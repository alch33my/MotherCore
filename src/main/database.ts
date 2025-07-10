import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

// Types for database entities
interface Organization {
  id: string
  name: string
  description?: string
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
  content?: string // Main content (could be base64 for binary, JSON for structured data, or text)
  content_text?: string // Plain text version for search
  page_type?: string // Enhanced to support new types: 'note', 'code', 'image', 'video', 'audio', 'pdf', 'spreadsheet'
  metadata?: { // New field for type-specific metadata
    language?: string // For code files
    mimeType?: string // For media files
    dimensions?: { width: number, height: number } // For images
    duration?: number // For audio/video
    fileSize?: number // For all binary content
    originalFileName?: string // For imported files
    lastModified?: string // For tracking file changes
    encoding?: string // For text files
    version?: string // For tracking content versions
  }
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
  private db: any
  private dbPath: string
  private isCustomPath: boolean

  constructor(dbPath?: string) {
    // Get stored custom path from settings if available
    let storedPath = this.getStoredDbPath()
    
    // If a specific path is provided or we have a stored custom path, use it
    if (dbPath || storedPath) {
      this.dbPath = dbPath || storedPath || ''
      this.isCustomPath = true
    } else {
      // Try to use app installation folder first
      try {
        // Get the app's root directory
        const appRootPath = path.dirname(app.getAppPath())
        const appDataPath = path.join(appRootPath, 'data')
        const appDbPath = path.join(appDataPath, 'mothercore.db')
        
        // Check if we can write to this directory
        if (!fs.existsSync(appDataPath)) {
          fs.mkdirSync(appDataPath, { recursive: true })
        }
        
        // Test write access by trying to write a test file
        const testFile = path.join(appDataPath, '.write-test')
        fs.writeFileSync(testFile, 'test')
        fs.unlinkSync(testFile) // Delete test file
        
        // If we reach here, the directory is writable
        this.dbPath = appDbPath
        this.isCustomPath = false
      } catch (error) {
        // Fallback to userData if the app directory is not writable
        console.log('App directory is not writable, falling back to userData directory')
        this.dbPath = path.join(app.getPath('userData'), 'mothercore.db')
        this.isCustomPath = false
      }
    }
    
    console.log(`Using database at: ${this.dbPath}`)
    
    // Create directory if it doesn't exist
    const dir = path.dirname(this.dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // Initialize database
    this.initializeDatabase()
  }

  private initializeDatabase() {
    try {
      this.db = new Database(this.dbPath)
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON')
      
      // Create tables if they don't exist
      this.initializeTables()
    } catch (error: any) {
      console.error('Error initializing database:', error)
      throw new Error(`Failed to initialize database at ${this.dbPath}: ${error.message}`)
    }
  }

  // Get stored database path from settings
  private getStoredDbPath(): string | null {
    try {
      // We need to be careful here to avoid circular dependencies
      // Create a temporary connection to the default database
      const defaultPath = path.join(app.getPath('userData'), 'mothercore.db')
      
      // Check if default database exists
      if (!fs.existsSync(defaultPath)) {
        return null
      }
      
      // Connect to default database temporarily
      const tempDb = new Database(defaultPath)
      
      // Query for custom database path
      const stmt = tempDb.prepare('SELECT value FROM app_settings WHERE category = ? AND key = ? LIMIT 1')
      const result = stmt.get('database', 'customPath') as { value: string } | undefined
      
      // Close temporary connection
      tempDb.close()
      
      if (result && result.value) {
        // Verify the path exists before returning it
        const customPath = result.value
        if (fs.existsSync(path.dirname(customPath))) {
          return customPath
        }
      }
      
      return null
    } catch (error: any) {
      console.error('Error getting stored database path:', error)
      return null
    }
  }

  // Change the database location
  public changeDbLocation(newPath: string): boolean {
    try {
      if (this.dbPath === newPath) {
        return true // No change needed
      }
      
      // Close current database connection
      this.db.close()
      
      // Ensure the target directory exists
      const dir = path.dirname(newPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      // Copy the database file to the new location
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, newPath)
      }
      
      // Update current path
      const oldPath = this.dbPath
      this.dbPath = newPath
      this.isCustomPath = true
      
      // Initialize with the new database path
      this.initializeDatabase()
      
      // Save the new path in settings
      this.updateSetting('database', 'customPath', newPath)
      this.updateSetting('database', 'isCustomPath', 'true')
      
      // Return success
      console.log(`Database successfully moved from ${oldPath} to ${newPath}`)
      return true
    } catch (error) {
      console.error('Error changing database location:', error)
      
      // Try to revert to the original path
      try {
        this.initializeDatabase()
      } catch (initError) {
        console.error('Failed to reinitialize original database:', initError)
      }
      
      return false
    }
  }

  // Reset to default database location
  public resetToDefaultLocation(): boolean {
    try {
      // Get default path
      const defaultPath = path.join(app.getPath('userData'), 'mothercore.db')
      
      // Skip if already using default
      if (this.dbPath === defaultPath) {
        return true
      }
      
      // Close current connection
      this.db.close()
      
      // Copy the database if needed
      if (this.isCustomPath && fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, defaultPath)
      }
      
      // Update path
      this.dbPath = defaultPath
      this.isCustomPath = false
      
      // Initialize the database with default path
      this.initializeDatabase()
      
      // Update settings
      this.updateSetting('database', 'customPath', '')
      this.updateSetting('database', 'isCustomPath', 'false')
      
      return true
    } catch (error) {
      console.error('Error resetting to default database location:', error)
      return false
    }
  }

  // Get current database path
  public getCurrentDbPath(): string {
    return this.dbPath
  }
  
  // Get database filename
  public getDbFilename(): string {
    return path.basename(this.dbPath)
  }
  
  // Get database directory
  public getDbDirectory(): string {
    return path.dirname(this.dbPath)
  }

  // Check if using custom path
  public isUsingCustomPath(): boolean {
    return this.isCustomPath
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

    // Settings table for application configuration
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, key)
      )
    `).run()

    // Insert default settings if they don't exist
    this.db.prepare(`
      INSERT OR IGNORE INTO settings (category, key, value) VALUES
      ('updates', 'autoCheck', 'false'),
      ('updates', 'checkOnStartup', 'false'),
      ('theme', 'matrixIntensity', '60'),
      ('theme', 'matrixSpeed', '50'),
      ('theme', 'matrixColorScheme', 'gold'),
      ('theme', 'matrixDensity', '40'),
      ('profile', 'name', ''),
      ('profile', 'email', ''),
      ('profile', 'avatar', '')
    `).run()

    // Organizations table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        content_text TEXT,
        page_type TEXT DEFAULT 'note',
        tags TEXT,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE CASCADE
      );
    `)

    // Add metadata column if it doesn't exist
    try {
      // Check if metadata column exists
      const tableInfo = this.db.prepare("PRAGMA table_info(pages)").all()
      const hasMetadata = tableInfo.some((col: any) => col.name === 'metadata')
      
      if (!hasMetadata) {
        console.log('Adding metadata column to pages table')
        this.db.exec(`
          ALTER TABLE pages ADD COLUMN metadata TEXT;
        `)
      }
    } catch (error) {
      console.error('Error checking/adding metadata column:', error)
    }

    // Add indexes for common queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pages_chapter_id ON pages(chapter_id);
      CREATE INDEX IF NOT EXISTS idx_pages_page_type ON pages(page_type);
      CREATE INDEX IF NOT EXISTS idx_pages_position ON pages(position);
    `)

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

    // App settings table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, key)
      )
    `).run()

    // Insert default update settings
    this.db.prepare(`
      INSERT OR IGNORE INTO app_settings (category, key, value) VALUES
      ('updates', 'autoCheck', 'false'),
      ('updates', 'checkOnStartup', 'false'),
      ('updates', 'requireApproval', 'true'),
      ('updates', 'backupBeforeUpdate', 'true'),
      ('updates', 'updateSource', 'manual'),
      ('updates', 'trustedDomains', '[]')
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

  // App settings methods
  public getSetting(category: string, key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM app_settings WHERE category = ? AND key = ?')
    const result = stmt.get(category, key)
    return result ? result.value : null
  }

  public getSettingsGroup(category: string): Record<string, string> {
    const stmt = this.db.prepare('SELECT key, value FROM app_settings WHERE category = ?')
    const rows = stmt.all(category) || []
    
    const settings: Record<string, string> = {}
    rows.forEach((row: any) => {
      settings[row.key] = row.value
    })
    
    return settings
  }

  public updateSetting(category: string, key: string, value: string): boolean {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO app_settings (category, key, value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (category, key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `)
      stmt.run(category, key, value)
      return true
    } catch (error) {
      console.error(`Error updating setting ${category}.${key}:`, error)
      return false
    }
  }

  // Organization methods
  public createOrganization(organization: Organization) {
    console.log('DatabaseManager: Creating organization', organization);
    
    const { id, name, description = null, icon = null } = organization
    
    try {
      // Begin a transaction
      const transaction = this.db.transaction(() => {
        const stmt = this.db.prepare(`
          INSERT INTO organizations (id, name, description, icon)
          VALUES (?, ?, ?, ?)
        `);
        
        const result = stmt.run(id, name, description, icon);
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
    const { id, name, description = null, icon = null } = organization
    
    const stmt = this.db.prepare(`
      UPDATE organizations
      SET name = ?, description = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    return stmt.run(name, description, icon, id)
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
        
        // If position is not provided, get the highest position number and add 1
        let bookPosition = position;
        if (bookPosition === null) {
          const highestPosition = this.db.prepare(
            'SELECT MAX(position) as maxPos FROM books WHERE project_id = ?'
          ).get(project_id);
          
          bookPosition = highestPosition && highestPosition.maxPos !== null 
            ? highestPosition.maxPos + 1 
            : 0;
          
          console.log(`Auto-assigned position ${bookPosition} for new book`);
        }
        
        const stmt = this.db.prepare(`
          INSERT INTO books (id, project_id, name, description, cover_image, spine_color, position)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(id, project_id, name, description, cover_image, spine_color, bookPosition);
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
    try {
      // Get the next position for this chapter
      const position = this.getNextPagePosition(page.chapter_id)
      
      // Ensure page_type is set
      const pageType = page.page_type || 'note'
      
      // Initialize metadata object based on page type
      const metadata = {
        ...(page.metadata || {}),
        lastModified: new Date().toISOString()
      }
      
      const result = this.db.prepare(`
        INSERT INTO pages (
          id, 
          chapter_id, 
          title, 
          content,
          content_text,
          page_type,
          metadata,
          position,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        page.id || crypto.randomUUID(),
        page.chapter_id,
        page.title,
        page.content || '',
        page.content_text || '',
        pageType,
        JSON.stringify(metadata),
        position
      )
      
      if (result.changes === 0) {
        throw new Error('Failed to create page')
      }
      
      return {
        success: true,
        page: {
          ...page,
          id: result.lastInsertRowid,
          position,
          page_type: pageType,
          metadata
        }
      }
    } catch (err) {
      console.error('Error creating page:', err)
      return {
        success: false,
        error: String(err)
      }
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
    console.log(`Updating content for page ${id}`)
    try {
      return this.db.transaction(() => {
        // Verify page exists
        if (!this.db.prepare('SELECT id FROM pages WHERE id = ?').get(id)) {
          throw new Error(`Page with ID ${id} does not exist`)
        }

        // Extract metadata if content is an object with metadata field
        let actualContent = content
        let metadata = null

        if (typeof content === 'object' && content !== null) {
          if (content.metadata) {
            metadata = JSON.stringify(content.metadata)
            actualContent = content.content
          }
        }

        const result = this.db.prepare(`
          UPDATE pages 
          SET content = ?, 
              content_text = ?,
              metadata = COALESCE(?, metadata),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(actualContent, plainText, metadata, id)

        return result
      })()
    } catch (error) {
      console.error(`Error updating content for page ${id}:`, error)
      throw error
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

  // Migration method to fix null IDs and clean up database
  public fixDatabaseIntegrity() {
    console.log("Starting database integrity fix...");
    
    try {
      const transaction = this.db.transaction(() => {
        // Check if organizations table has icon column
        try {
          this.db.prepare('SELECT icon FROM organizations LIMIT 1').get();
        } catch (error) {
          console.log("Adding icon column to organizations table...");
          this.db.prepare('ALTER TABLE organizations ADD COLUMN icon TEXT').run();
        }

        // Check if organizations table has updated_at column
        try {
          this.db.prepare('SELECT updated_at FROM organizations LIMIT 1').get();
        } catch (error) {
          console.log("Adding updated_at column to organizations table...");
          this.db.prepare('ALTER TABLE organizations ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP').run();
        }
        
        // Fix organizations with null IDs
        const orgsWithNullId = this.db.prepare('SELECT * FROM organizations WHERE id IS NULL').all();
        for (const org of orgsWithNullId) {
          const newId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare('UPDATE organizations SET id = ? WHERE rowid = ?').run(newId, org.rowid);
          console.log(`Fixed organization with null ID, new ID: ${newId}`);
        }
        
        // Fix projects with null IDs
        const projectsWithNullId = this.db.prepare('SELECT * FROM projects WHERE id IS NULL').all();
        for (const project of projectsWithNullId) {
          const newId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare('UPDATE projects SET id = ? WHERE rowid = ?').run(newId, project.rowid);
          console.log(`Fixed project with null ID, new ID: ${newId}`);
        }
        
        // Fix books with null IDs
        const booksWithNullId = this.db.prepare('SELECT * FROM books WHERE id IS NULL').all();
        for (const book of booksWithNullId) {
          const newId = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare('UPDATE books SET id = ? WHERE rowid = ?').run(newId, book.rowid);
          console.log(`Fixed book with null ID, new ID: ${newId}`);
        }
        
        // Fix chapters with null IDs
        const chaptersWithNullId = this.db.prepare('SELECT * FROM chapters WHERE id IS NULL').all();
        for (const chapter of chaptersWithNullId) {
          const newId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare('UPDATE chapters SET id = ? WHERE rowid = ?').run(newId, chapter.rowid);
          console.log(`Fixed chapter with null ID, new ID: ${newId}`);
        }
        
        // Fix pages with null IDs
        const pagesWithNullId = this.db.prepare('SELECT * FROM pages WHERE id IS NULL').all();
        for (const page of pagesWithNullId) {
          const newId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare('UPDATE pages SET id = ? WHERE rowid = ?').run(newId, page.rowid);
          console.log(`Fixed page with null ID, new ID: ${newId}`);
        }
        
        // Remove any records with invalid foreign keys
        this.db.prepare('DELETE FROM projects WHERE organization_id IS NULL OR organization_id NOT IN (SELECT id FROM organizations)').run();
        this.db.prepare('DELETE FROM books WHERE project_id IS NULL OR project_id NOT IN (SELECT id FROM projects)').run();
        this.db.prepare('DELETE FROM chapters WHERE book_id IS NULL OR book_id NOT IN (SELECT id FROM books)').run();
        this.db.prepare('DELETE FROM pages WHERE chapter_id IS NULL OR chapter_id NOT IN (SELECT id FROM chapters)').run();
        
        console.log("Database integrity fix completed successfully");
      });
      
      transaction();
    } catch (error) {
      console.error("Error fixing database integrity:", error);
    }
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

  private validateAndExtractMetadata(content: any, pageType: string) {
    const metadata: any = {}

    switch (pageType) {
      case 'code':
        // Extract language from code content
        const languageMatch = content.match(/^\/\/ language: (.+)$/m)
        if (languageMatch) {
          metadata.language = languageMatch[1]
          content = content.replace(/^\/\/ language: .+\n/, '')
        }
        break

      case 'image':
        // Extract image metadata for base64 images
        if (typeof content === 'string' && content.startsWith('data:image/')) {
          const mimeMatch = content.match(/^data:([^;]+);/)
          if (mimeMatch) {
            metadata.mimeType = mimeMatch[1]
          }
        }
        break

      case 'video':
      case 'audio':
        // Handle media file metadata
        if (content.duration) {
          metadata.duration = content.duration
        }
        if (content.mimeType) {
          metadata.mimeType = content.mimeType
        }
        break

      case 'spreadsheet':
        // Handle spreadsheet metadata
        metadata.version = '1.0'
        metadata.encoding = 'json'
        break

      case 'pdf':
        // Handle PDF metadata
        if (typeof content === 'string' && content.startsWith('data:application/pdf;')) {
          metadata.mimeType = 'application/pdf'
        }
        break
    }

    return { content, metadata }
  }

  private getNextPagePosition(chapterId: string): number {
    // Get the highest position number for the given chapter
    const result = this.db.prepare(`
      SELECT MAX(position) as maxPosition 
      FROM pages 
      WHERE chapter_id = ?
    `).get(chapterId) as { maxPosition: number | null }

    // If no pages exist or no position set, start at 0
    return (result.maxPosition ?? -1) + 1
  }
}

export default DatabaseManager 