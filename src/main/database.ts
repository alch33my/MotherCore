import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import { app } from 'electron'
import bcrypt from 'bcryptjs'
import fs from 'fs'

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Types for database entities
interface Organization {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
}

interface Project {
  id: string
  organization_id: string
  name: string
  description?: string
  color?: string
}

interface Book {
  id: string
  project_id: string
  name: string
  description?: string
  cover_image?: string
  spine_color?: string
  position?: number
}

interface Chapter {
  id: string
  book_id: string
  name: string
  position?: number
}

interface Page {
  id: string
  chapter_id: string
  title: string
  content?: any
  content_text?: string
  page_type?: string
  tags?: string
  position?: number
}

interface AuthCredentials {
  id: number
  password_hash: string
  salt: string
  created_at: string
}

class DatabaseManager {
  private db: Database.Database
  private static instance: DatabaseManager | null = null

  private constructor() {
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'mothercore.db')
    
    this.db = new Database(dbPath, { verbose: console.log })
    this.initializeTables()
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  private initializeTables() {
    // Authentication table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS auth (
        id INTEGER PRIMARY KEY,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Organizations table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Projects table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        organization_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(organization_id) REFERENCES organizations(id)
      )
    `).run()

    // Books table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        spine_color TEXT,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id)
      )
    `).run()

    // Chapters table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        book_id TEXT,
        name TEXT NOT NULL,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(book_id) REFERENCES books(id)
      )
    `).run()

    // Pages table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        chapter_id TEXT,
        title TEXT NOT NULL,
        content BLOB,
        content_text TEXT,
        page_type TEXT DEFAULT 'note',
        tags TEXT,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(chapter_id) REFERENCES chapters(id)
      )
    `).run()

    // Media files table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS media_files (
        id TEXT PRIMARY KEY,
        page_id TEXT,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(page_id) REFERENCES pages(id)
      )
    `).run()
  }

  public saveAuthCredentials(passwordHash: string, salt: string) {
    const stmt = this.db.prepare(`
      INSERT INTO auth (password_hash, salt) VALUES (?, ?)
    `)
    return stmt.run(passwordHash, salt)
  }

  public getAuthCredentials(): AuthCredentials | undefined {
    const stmt = this.db.prepare('SELECT * FROM auth ORDER BY created_at DESC LIMIT 1')
    return stmt.get() as AuthCredentials | undefined
  }

  // Organization methods
  public createOrganization(organization: Organization) {
    console.log('DatabaseManager: Creating organization', organization);
    
    const { id, name, description = null, color = null, icon = null } = organization
    
    try {
      // Begin a transaction
      const transaction = this.db.transaction(() => {
        const stmt = this.db.prepare(`
          INSERT INTO organizations (id, name, description, color, icon)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(id, name, description, color, icon);
        console.log('Organization created in database with result:', result);
        
        // Verify organization was created
        const insertedOrg = this.db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
        console.log('Inserted organization verification:', insertedOrg);
        
        return insertedOrg; // Return the inserted organization
      });
      
      // Execute the transaction and get the result
      const result = transaction();
      
      // Log entire database after creation
      this.logDbState();
      
      return result;
    } catch (error) {
      console.error('Database error in createOrganization:', error);
      throw error; // Re-throw to handle in the IPC layer
    }
  }
  
  public getOrganizations() {
    return this.db.prepare('SELECT * FROM organizations ORDER BY name').all()
  }
  
  public getOrganization(id: string) {
    return this.db.prepare('SELECT * FROM organizations WHERE id = ?').get(id)
  }
  
  public updateOrganization(organization: Organization) {
    const { id, name, description = null, color = null, icon = null } = organization
    
    const stmt = this.db.prepare(`
      UPDATE organizations
      SET name = ?, description = ?, color = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    return stmt.run(name, description, color, icon, id)
  }
  
  public deleteOrganization(id: string) {
    return this.db.prepare('DELETE FROM organizations WHERE id = ?').run(id)
  }
  
  // Project methods
  public createProject(project: Project) {
    console.log('DatabaseManager: Creating project', project);
    
    const { id, organization_id, name, description = null, color = null } = project
    
    try {
      // Begin a transaction
      const transaction = this.db.transaction(() => {
        // Check if the organization exists
        const org = this.db.prepare('SELECT id FROM organizations WHERE id = ?').get(organization_id);
        if (!org) {
          throw new Error(`Organization with ID ${organization_id} does not exist`);
        }
        
        const stmt = this.db.prepare(`
          INSERT INTO projects (id, organization_id, name, description, color)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(id, organization_id, name, description, color);
        console.log('Project created in database with result:', result);
        
        // Verify project was created
        const insertedProject = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
        console.log('Inserted project verification:', insertedProject);
        
        return insertedProject; // Return the inserted project
      });
      
      // Execute the transaction and get the result
      const result = transaction();
      
      // Log entire database after creation
      this.logDbState();
      
      return result;
    } catch (error) {
      console.error('Database error in createProject:', error);
      throw error; // Re-throw to handle in the IPC layer
    }
  }
  
  public getProjects(organizationId?: string) {
    console.log(`Getting projects${organizationId ? ` for org ${organizationId}` : ' (all)'}`);
    
    try {
      let projects;
      
      if (organizationId) {
        // First verify the organization exists
        const org = this.db.prepare('SELECT id FROM organizations WHERE id = ?').get(organizationId);
        if (!org) {
          console.error(`Organization with ID ${organizationId} not found when getting projects`);
          return []; // Return empty array instead of throwing error
        }
        
        // Get projects for this organization
        projects = this.db.prepare('SELECT * FROM projects WHERE organization_id = ? ORDER BY name').all(organizationId);
      } else {
        // Get all projects
        projects = this.db.prepare('SELECT * FROM projects ORDER BY name').all();
      }
      
      console.log(`Found ${projects.length} projects:`, 
        projects.map((p: any) => ({id: p.id, name: p.name, org_id: p.organization_id})));
      
      return projects;
    } catch (error) {
      console.error('Error in getProjects:', error);
      return []; // Return empty array on error
    }
  }
  
  public getProject(id: string) {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  }
  
  public updateProject(project: Project) {
    const { id, organization_id, name, description = null, color = null } = project
    
    const stmt = this.db.prepare(`
      UPDATE projects
      SET organization_id = ?, name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    return stmt.run(organization_id, name, description, color, id)
  }
  
  public deleteProject(id: string) {
    return this.db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  }
  
  // Book methods
  public createBook(book: Book) {
    console.log('DatabaseManager: Creating book', book);
    
    const { id, project_id, name, description = null, cover_image = null, spine_color = null, position = null } = book
    
    try {
      // Begin a transaction
      const transaction = this.db.transaction(() => {
        // Check if the project exists
        const project = this.db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
        if (!project) {
          throw new Error(`Project with ID ${project_id} does not exist`);
        }
        
        const stmt = this.db.prepare(`
          INSERT INTO books (id, project_id, name, description, cover_image, spine_color, position)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(id, project_id, name, description, cover_image, spine_color, position);
        console.log('Book created in database with result:', result);
        
        // Verify book was created
        const insertedBook = this.db.prepare('SELECT * FROM books WHERE id = ?').get(id);
        console.log('Inserted book verification:', insertedBook);
        
        return insertedBook; // Return the inserted book
      });
      
      // Execute the transaction and get the result
      const result = transaction();
      
      return result;
    } catch (error) {
      console.error('Database error in createBook:', error);
      throw error; // Re-throw to handle in the IPC layer
    }
  }
  
  public getBooks(projectId?: string) {
    console.log(`Getting books${projectId ? ` for project ${projectId}` : ' (all)'}`);
    
    try {
      let books;
      
      if (projectId) {
        // First verify the project exists
        const project = this.db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
        if (!project) {
          console.error(`Project with ID ${projectId} not found when getting books`);
          return []; // Return empty array instead of throwing error
        }
        
        // Get books for this project
        books = this.db.prepare('SELECT * FROM books WHERE project_id = ? ORDER BY position, name').all(projectId);
      } else {
        // Get all books
        books = this.db.prepare('SELECT * FROM books ORDER BY position, name').all();
      }
      
      console.log(`Found ${books.length} books:`, 
        books.map((b: any) => ({id: b.id, name: b.name, project_id: b.project_id})));
      
      return books;
    } catch (error) {
      console.error('Error in getBooks:', error);
      return []; // Return empty array on error
    }
  }
  
  public getBook(id: string) {
    return this.db.prepare('SELECT * FROM books WHERE id = ?').get(id)
  }
  
  public updateBook(book: Book) {
    const { id, project_id, name, description = null, cover_image = null, spine_color = null, position = null } = book
    
    const stmt = this.db.prepare(`
      UPDATE books
      SET project_id = ?, name = ?, description = ?, cover_image = ?, spine_color = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    return stmt.run(project_id, name, description, cover_image, spine_color, position, id)
  }
  
  public deleteBook(id: string) {
    return this.db.prepare('DELETE FROM books WHERE id = ?').run(id)
  }
  
  // Chapter methods
  public createChapter(chapter: Chapter) {
    console.log('DatabaseManager: Creating chapter', chapter);
    
    const { id, book_id, name, position = null } = chapter
    
    try {
      // Begin a transaction
      const transaction = this.db.transaction(() => {
        // Check if the book exists
        const book = this.db.prepare('SELECT id FROM books WHERE id = ?').get(book_id);
        if (!book) {
          throw new Error(`Book with ID ${book_id} does not exist`);
        }
        
        const stmt = this.db.prepare(`
          INSERT INTO chapters (id, book_id, name, position)
          VALUES (?, ?, ?, ?)
        `);
        
        const result = stmt.run(id, book_id, name, position);
        console.log('Chapter created in database with result:', result);
        
        // Verify chapter was created
        const insertedChapter = this.db.prepare('SELECT * FROM chapters WHERE id = ?').get(id);
        console.log('Inserted chapter verification:', insertedChapter);
        
        return insertedChapter; // Return the inserted chapter
      });
      
      // Execute the transaction and get the result
      const result = transaction();
      
      return result;
    } catch (error) {
      console.error('Database error in createChapter:', error);
      throw error; // Re-throw to handle in the IPC layer
    }
  }
  
  public getChapters(bookId?: string) {
    console.log(`Getting chapters${bookId ? ` for book ${bookId}` : ' (all)'}`);
    
    try {
      let chapters;
      
      if (bookId) {
        // First verify the book exists
        const book = this.db.prepare('SELECT id FROM books WHERE id = ?').get(bookId);
        if (!book) {
          console.error(`Book with ID ${bookId} not found when getting chapters`);
          return []; // Return empty array instead of throwing error
        }
        
        // Get chapters for this book
        chapters = this.db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY position, name').all(bookId);
      } else {
        // Get all chapters
        chapters = this.db.prepare('SELECT * FROM chapters ORDER BY position, name').all();
      }
      
      console.log(`Found ${chapters.length} chapters:`, 
        chapters.map((c: any) => ({id: c.id, name: c.name, book_id: c.book_id})));
      
      return chapters;
    } catch (error) {
      console.error('Error in getChapters:', error);
      return []; // Return empty array on error
    }
  }
  
  public getChapter(id: string) {
    return this.db.prepare('SELECT * FROM chapters WHERE id = ?').get(id)
  }
  
  public updateChapter(chapter: Chapter) {
    const { id, book_id, name, position = null } = chapter
    
    const stmt = this.db.prepare(`
      UPDATE chapters
      SET book_id = ?, name = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    return stmt.run(book_id, name, position, id)
  }
  
  public deleteChapter(id: string) {
    return this.db.prepare('DELETE FROM chapters WHERE id = ?').run(id)
  }
  
  // Page methods
  public createPage(page: Page) {
    console.log('DatabaseManager: Creating page', page);
    
    const { id, chapter_id, title, content = null, content_text = null, page_type = 'note', tags = null, position = null } = page
    
    try {
      // Begin a transaction
      const transaction = this.db.transaction(() => {
        // Check if the chapter exists
        const chapter = this.db.prepare('SELECT id FROM chapters WHERE id = ?').get(chapter_id);
        if (!chapter) {
          throw new Error(`Chapter with ID ${chapter_id} does not exist`);
        }
        
        // Convert content to JSON string if it's an object
        const contentStr = content ? (typeof content === 'object' ? JSON.stringify(content) : content) : null;
        
        const stmt = this.db.prepare(`
          INSERT INTO pages (id, chapter_id, title, content, content_text, page_type, tags, position)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(id, chapter_id, title, contentStr, content_text, page_type, tags, position);
        console.log('Page created in database with result:', result);
        
        // Verify page was created
        const insertedPage = this.db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
        console.log('Inserted page verification:', insertedPage);
        
        return insertedPage; // Return the inserted page
      });
      
      // Execute the transaction and get the result
      const result = transaction();
      
      return result;
    } catch (error) {
      console.error('Database error in createPage:', error);
      throw error; // Re-throw to handle in the IPC layer
    }
  }
  
  public getPages(chapterId?: string) {
    console.log(`Getting pages${chapterId ? ` for chapter ${chapterId}` : ' (all)'}`);
    
    try {
      let pages;
      
      if (chapterId) {
        // First verify the chapter exists
        const chapter = this.db.prepare('SELECT id FROM chapters WHERE id = ?').get(chapterId);
        if (!chapter) {
          console.error(`Chapter with ID ${chapterId} not found when getting pages`);
          return []; // Return empty array instead of throwing error
        }
        
        // Get pages for this chapter
        pages = this.db.prepare('SELECT * FROM pages WHERE chapter_id = ? ORDER BY position, title').all(chapterId);
      } else {
        // Get all pages
        pages = this.db.prepare('SELECT * FROM pages ORDER BY position, title').all();
      }
      
      console.log(`Found ${pages.length} pages:`, 
        pages.map((p: any) => ({id: p.id, title: p.title, chapter_id: p.chapter_id})));
      
      return pages;
    } catch (error) {
      console.error('Error in getPages:', error);
      return []; // Return empty array on error
    }
  }
  
  public getPage(id: string) {
    return this.db.prepare('SELECT * FROM pages WHERE id = ?').get(id)
  }
  
  public getPageContent(id: string) {
    console.log(`Getting content for page ${id}`);
    
    try {
      // First verify the page exists
      const page = this.db.prepare('SELECT id FROM pages WHERE id = ?').get(id);
      if (!page) {
        console.error(`Page with ID ${id} not found when getting content`);
        return null;
      }
      
      const result = this.db.prepare('SELECT content FROM pages WHERE id = ?').get(id) as { content: string } | undefined;
      if (!result) {
        console.log(`No content found for page ${id}`);
        return null;
      }
      
      if (!result.content) {
        console.log(`Content is null for page ${id}`);
        return null;
      }
      
      try {
        // Try to parse as JSON first
        const parsedContent = JSON.parse(result.content);
        console.log(`Successfully parsed JSON content for page ${id}`);
        return parsedContent;
      } catch (parseError) {
        // If parsing fails, return as raw content
        console.log(`Content for page ${id} is not JSON, returning raw content`);
        return result.content;
      }
    } catch (error) {
      console.error(`Error getting content for page ${id}:`, error);
      return null;
    }
  }
  
  public updatePageContent(id: string, content: any, plainText: string) {
    console.log(`Updating content for page ${id}`);
    
    try {
      // Begin a transaction
      const transaction = this.db.transaction(() => {
        // First verify the page exists
        const page = this.db.prepare('SELECT id FROM pages WHERE id = ?').get(id);
        if (!page) {
          throw new Error(`Page with ID ${id} does not exist`);
        }
        
        // Convert content to JSON string if it's an object
        const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;
        
        const stmt = this.db.prepare(`
          UPDATE pages
          SET content = ?, content_text = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        
        const result = stmt.run(contentStr, plainText, id);
        console.log(`Page content updated with result:`, result);
        
        return result;
      });
      
      // Execute the transaction and get the result
      const result = transaction();
      
      return result;
    } catch (error) {
      console.error(`Error updating content for page ${id}:`, error);
      throw error; // Re-throw to handle in the IPC layer
    }
  }
  
  public updatePage(page: Page) {
    const { id, chapter_id, title, page_type = 'note', tags = null, position = null } = page
    
    const stmt = this.db.prepare(`
      UPDATE pages
      SET chapter_id = ?, title = ?, page_type = ?, tags = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    return stmt.run(chapter_id, title, page_type, tags, position, id)
  }
  
  public deletePage(id: string) {
    return this.db.prepare('DELETE FROM pages WHERE id = ?').run(id)
  }

  public close() {
    this.db.close()
  }

  // Debug method to log database state
  public logDbState() {
    console.log("\n==== DATABASE STATE ====");
    
    try {
      // Log organizations
      const orgs = this.db.prepare('SELECT * FROM organizations').all() as Organization[];
      console.log(`Organizations (${orgs.length}):`);
      orgs.forEach(org => {
        console.log(`- ${org.id}: ${org.name}`);
      });
      
      // Log projects
      const projects = this.db.prepare('SELECT * FROM projects').all() as Project[];
      console.log(`\nProjects (${projects.length}):`);
      projects.forEach(proj => {
        console.log(`- ${proj.id}: ${proj.name} (org: ${proj.organization_id})`);
      });
      
      // Log books
      const books = this.db.prepare('SELECT * FROM books').all() as Book[];
      console.log(`\nBooks (${books.length}):`);
      books.forEach(book => {
        console.log(`- ${book.id}: ${book.name} (project: ${book.project_id})`);
      });
      
      // Log chapters
      const chapters = this.db.prepare('SELECT * FROM chapters').all() as Chapter[];
      console.log(`\nChapters (${chapters.length}):`);
      chapters.forEach(chapter => {
        console.log(`- ${chapter.id}: ${chapter.name} (book: ${chapter.book_id})`);
      });
      
      // Log pages
      const pages = this.db.prepare('SELECT * FROM pages').all() as Page[];
      console.log(`\nPages (${pages.length}):`);
      pages.forEach(page => {
        console.log(`- ${page.id}: ${page.title} (chapter: ${page.chapter_id})`);
      });
      
      console.log("==== END DATABASE STATE ====\n");
    } catch (error) {
      console.error("Error logging database state:", error);
    }
  }
}

export default DatabaseManager 