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

class DatabaseManager {
  private db: Database.Database
  private dbPath: string

  constructor() {
    try {
      // Ensure the userData directory exists
      const userDataPath = app.getPath('userData')
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }
      
      this.dbPath = path.join(userDataPath, 'mothercore.db')
      console.log('Database path:', this.dbPath)
      
      // Create/open the database
      this.db = new Database(this.dbPath)
      console.log('Database connection established')
      
      this.initializeTables()
      console.log('Database tables initialized')
    } catch (error) {
      console.error('Error initializing database:', error)
      throw error
    }
  }

  private initializeTables() {
    try {
      // Organizations table
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS organizations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT,
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

      // Authentication table
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS auth (
          id INTEGER PRIMARY KEY,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
    } catch (error) {
      console.error('Error creating tables:', error)
      throw error
    }
  }

  // Authentication methods
  public checkAuthExists(): boolean {
    try {
      const result = this.db.prepare('SELECT COUNT(*) as count FROM auth').get() as { count: number }
      return result.count > 0
    } catch (error) {
      console.error('Error checking auth status:', error)
      throw error
    }
  }

  public setupInitialAuth(password: string) {
    try {
      // Check if auth is already set up
      const existingAuth = this.db.prepare('SELECT * FROM auth LIMIT 1').get()
      if (existingAuth) {
        throw new Error('Authentication is already set up')
      }

      // Generate salt and hash
      const salt = bcrypt.genSaltSync(10)
      const passwordHash = bcrypt.hashSync(password, salt)

      // Store in database
      this.db.prepare('INSERT INTO auth (password_hash, salt) VALUES (?, ?)').run(passwordHash, salt)
    } catch (error) {
      console.error('Error setting up authentication:', error)
      throw error
    }
  }

  public authenticateUser(password: string): boolean {
    try {
      const auth = this.db.prepare('SELECT * FROM auth LIMIT 1').get() as { password_hash: string, salt: string } | undefined
      
      if (!auth) {
        throw new Error('No authentication setup found')
      }

      return bcrypt.compareSync(password, auth.password_hash)
    } catch (error) {
      console.error('Error authenticating user:', error)
      throw error
    }
  }

  // Organization methods
  public createOrganization(organization: Organization) {
    const { id, name, description = null, color = null, icon = null } = organization
    
    const stmt = this.db.prepare(`
      INSERT INTO organizations (id, name, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(id, name, description, color, icon)
    return result
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
    const { id, organization_id, name, description = null, color = null } = project
    
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, organization_id, name, description, color)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    return stmt.run(id, organization_id, name, description, color)
  }
  
  public getProjects(organizationId?: string) {
    if (organizationId) {
      return this.db.prepare('SELECT * FROM projects WHERE organization_id = ? ORDER BY name').all(organizationId)
    }
    return this.db.prepare('SELECT * FROM projects ORDER BY name').all()
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
    const { id, project_id, name, description = null, cover_image = null, spine_color = null, position = null } = book
    
    const stmt = this.db.prepare(`
      INSERT INTO books (id, project_id, name, description, cover_image, spine_color, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    return stmt.run(id, project_id, name, description, cover_image, spine_color, position)
  }
  
  public getBooks(projectId?: string) {
    if (projectId) {
      return this.db.prepare('SELECT * FROM books WHERE project_id = ? ORDER BY position, name').all(projectId)
    }
    return this.db.prepare('SELECT * FROM books ORDER BY position, name').all()
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
    const { id, book_id, name, position = null } = chapter
    
    const stmt = this.db.prepare(`
      INSERT INTO chapters (id, book_id, name, position)
      VALUES (?, ?, ?, ?)
    `)
    
    return stmt.run(id, book_id, name, position)
  }
  
  public getChapters(bookId?: string) {
    if (bookId) {
      return this.db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY position, name').all(bookId)
    }
    return this.db.prepare('SELECT * FROM chapters ORDER BY position, name').all()
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
    const { id, chapter_id, title, content = null, content_text = null, page_type = 'note', tags = null, position = null } = page
    
    const stmt = this.db.prepare(`
      INSERT INTO pages (id, chapter_id, title, content, content_text, page_type, tags, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    // Convert content to JSON string if it's an object
    const contentStr = content ? (typeof content === 'object' ? JSON.stringify(content) : content) : null
    
    return stmt.run(id, chapter_id, title, contentStr, content_text, page_type, tags, position)
  }
  
  public getPages(chapterId?: string) {
    if (chapterId) {
      return this.db.prepare('SELECT id, chapter_id, title, page_type, tags, position, created_at, updated_at FROM pages WHERE chapter_id = ? ORDER BY position, title').all(chapterId)
    }
    return this.db.prepare('SELECT id, chapter_id, title, page_type, tags, position, created_at, updated_at FROM pages ORDER BY position, title').all()
  }
  
  public getPage(id: string) {
    return this.db.prepare('SELECT * FROM pages WHERE id = ?').get(id)
  }
  
  public getPageContent(id: string) {
    const result = this.db.prepare('SELECT content FROM pages WHERE id = ?').get(id) as { content: string } | undefined
    if (!result) {
      return null
    }
    
    try {
      return JSON.parse(result.content)
    } catch {
      return result.content
    }
  }
  
  public updatePageContent(id: string, content: any, plainText: string) {
    const contentStr = typeof content === 'object' ? JSON.stringify(content) : content
    
    const stmt = this.db.prepare(`
      UPDATE pages
      SET content = ?, content_text = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    return stmt.run(contentStr, plainText, id)
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
    try {
      if (this.db) {
        console.log('Closing database connection')
        this.db.close()
      }
    } catch (error) {
      console.error('Error closing database:', error)
    }
  }
}

export default DatabaseManager 