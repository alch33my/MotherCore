import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import bcrypt from 'bcryptjs'

class DatabaseManager {
  private db: Database.Database
  private dbPath: string

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'mothercore.db')
    this.db = new Database(this.dbPath)
    this.initializeTables()
  }

  private initializeTables() {
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
  }

  public setupInitialAuth(password: string) {
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
  }

  public authenticateUser(password: string): boolean {
    const auth = this.db.prepare('SELECT * FROM auth LIMIT 1').get() as { password_hash: string, salt: string } | undefined
    
    if (!auth) {
      throw new Error('No authentication setup found')
    }

    return bcrypt.compareSync(password, auth.password_hash)
  }

  public close() {
    this.db.close()
  }
}

export default DatabaseManager 