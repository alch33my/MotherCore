import Dt, { app as Ze, BrowserWindow as ea, ipcMain as Re, dialog as Qr, shell as ac } from "electron";
import qt, { fileURLToPath as oc } from "url";
import Se from "path";
import Zr from "bcryptjs";
import Ca from "better-sqlite3";
import xe from "fs";
import sc from "constants";
import mr from "stream";
import ta from "util";
import Il from "assert";
import Br from "child_process";
import Nl from "events";
import Er from "crypto";
import Fl from "tty";
import jr from "os";
import lc from "string_decoder";
import Ll from "zlib";
import uc from "http";
class cc {
  db;
  dbPath;
  isCustomPath;
  constructor(e) {
    let a = this.getStoredDbPath();
    if (e || a)
      this.dbPath = e || a || "", this.isCustomPath = !0;
    else
      try {
        const d = Se.dirname(Ze.getAppPath()), l = Se.join(d, "data"), n = Se.join(l, "mothercore.db");
        xe.existsSync(l) || xe.mkdirSync(l, { recursive: !0 });
        const h = Se.join(l, ".write-test");
        xe.writeFileSync(h, "test"), xe.unlinkSync(h), this.dbPath = n, this.isCustomPath = !1;
      } catch {
        console.log("App directory is not writable, falling back to userData directory"), this.dbPath = Se.join(Ze.getPath("userData"), "mothercore.db"), this.isCustomPath = !1;
      }
    console.log(`Using database at: ${this.dbPath}`);
    const c = Se.dirname(this.dbPath);
    xe.existsSync(c) || xe.mkdirSync(c, { recursive: !0 }), this.initializeDatabase();
  }
  initializeDatabase() {
    try {
      this.db = new Ca(this.dbPath), this.db.pragma("foreign_keys = ON"), this.initializeTables();
    } catch (e) {
      throw console.error("Error initializing database:", e), new Error(`Failed to initialize database at ${this.dbPath}: ${e.message}`);
    }
  }
  // Get stored database path from settings
  getStoredDbPath() {
    try {
      const e = Se.join(Ze.getPath("userData"), "mothercore.db");
      if (!xe.existsSync(e))
        return null;
      const a = new Ca(e), d = a.prepare("SELECT value FROM app_settings WHERE category = ? AND key = ? LIMIT 1").get("database", "customPath");
      if (a.close(), d && d.value) {
        const l = d.value;
        if (xe.existsSync(Se.dirname(l)))
          return l;
      }
      return null;
    } catch (e) {
      return console.error("Error getting stored database path:", e), null;
    }
  }
  // Change the database location
  changeDbLocation(e) {
    try {
      if (this.dbPath === e)
        return !0;
      this.db.close();
      const a = Se.dirname(e);
      xe.existsSync(a) || xe.mkdirSync(a, { recursive: !0 }), xe.existsSync(this.dbPath) && xe.copyFileSync(this.dbPath, e);
      const c = this.dbPath;
      return this.dbPath = e, this.isCustomPath = !0, this.initializeDatabase(), this.updateSetting("database", "customPath", e), this.updateSetting("database", "isCustomPath", "true"), console.log(`Database successfully moved from ${c} to ${e}`), !0;
    } catch (a) {
      console.error("Error changing database location:", a);
      try {
        this.initializeDatabase();
      } catch (c) {
        console.error("Failed to reinitialize original database:", c);
      }
      return !1;
    }
  }
  // Reset to default database location
  resetToDefaultLocation() {
    try {
      const e = Se.join(Ze.getPath("userData"), "mothercore.db");
      return this.dbPath === e || (this.db.close(), this.isCustomPath && xe.existsSync(this.dbPath) && xe.copyFileSync(this.dbPath, e), this.dbPath = e, this.isCustomPath = !1, this.initializeDatabase(), this.updateSetting("database", "customPath", ""), this.updateSetting("database", "isCustomPath", "false")), !0;
    } catch (e) {
      return console.error("Error resetting to default database location:", e), !1;
    }
  }
  // Get current database path
  getCurrentDbPath() {
    return this.dbPath;
  }
  // Get database filename
  getDbFilename() {
    return Se.basename(this.dbPath);
  }
  // Get database directory
  getDbDirectory() {
    return Se.dirname(this.dbPath);
  }
  // Check if using custom path
  isUsingCustomPath() {
    return this.isCustomPath;
  }
  initializeTables() {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS auth (
        id INTEGER PRIMARY KEY,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run(), this.db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, key)
      )
    `).run(), this.db.prepare(`
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
    `).run(), this.db.prepare(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run(), this.db.prepare(`
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
    `).run(), this.db.prepare(`
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
    `).run(), this.db.prepare(`
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        book_id TEXT,
        name TEXT NOT NULL,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(book_id) REFERENCES books(id)
      )
    `).run(), this.db.exec(`
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
    `);
    try {
      this.db.prepare("PRAGMA table_info(pages)").all().some((c) => c.name === "metadata") || (console.log("Adding metadata column to pages table"), this.db.exec(`
          ALTER TABLE pages ADD COLUMN metadata TEXT;
        `));
    } catch (e) {
      console.error("Error checking/adding metadata column:", e);
    }
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pages_chapter_id ON pages(chapter_id);
      CREATE INDEX IF NOT EXISTS idx_pages_page_type ON pages(page_type);
      CREATE INDEX IF NOT EXISTS idx_pages_position ON pages(position);
    `), this.db.prepare(`
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
    `).run(), this.db.prepare(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, key)
      )
    `).run(), this.db.prepare(`
      INSERT OR IGNORE INTO app_settings (category, key, value) VALUES
      ('updates', 'autoCheck', 'false'),
      ('updates', 'checkOnStartup', 'false'),
      ('updates', 'requireApproval', 'true'),
      ('updates', 'backupBeforeUpdate', 'true'),
      ('updates', 'updateSource', 'manual'),
      ('updates', 'trustedDomains', '[]')
    `).run();
  }
  saveAuthCredentials(e, a) {
    return this.db.prepare(`
      INSERT INTO auth (password_hash, salt) VALUES (?, ?)
    `).run(e, a);
  }
  getAuthCredentials() {
    return this.db.prepare("SELECT * FROM auth ORDER BY created_at DESC LIMIT 1").get();
  }
  // App settings methods
  getSetting(e, a) {
    const d = this.db.prepare("SELECT value FROM app_settings WHERE category = ? AND key = ?").get(e, a);
    return d ? d.value : null;
  }
  getSettingsGroup(e) {
    const c = this.db.prepare("SELECT key, value FROM app_settings WHERE category = ?").all(e) || [], d = {};
    return c.forEach((l) => {
      d[l.key] = l.value;
    }), d;
  }
  updateSetting(e, a, c) {
    try {
      return this.db.prepare(`
        INSERT INTO app_settings (category, key, value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (category, key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `).run(e, a, c), !0;
    } catch (d) {
      return console.error(`Error updating setting ${e}.${a}:`, d), !1;
    }
  }
  // Organization methods
  createOrganization(e) {
    console.log("DatabaseManager: Creating organization", e);
    const { id: a, name: c, description: d = null, icon: l = null } = e;
    try {
      const h = this.db.transaction(() => {
        const u = this.db.prepare(`
          INSERT INTO organizations (id, name, description, icon)
          VALUES (?, ?, ?, ?)
        `).run(a, c, d, l);
        console.log("Organization created in database with result:", u);
        const s = this.db.prepare("SELECT * FROM organizations WHERE id = ?").get(a);
        return console.log("Inserted organization verification:", s), s;
      })();
      return this.logDbState(), h;
    } catch (n) {
      throw console.error("Database error in createOrganization:", n), n;
    }
  }
  getOrganizations() {
    return this.db.prepare("SELECT * FROM organizations ORDER BY name").all();
  }
  getOrganization(e) {
    return this.db.prepare("SELECT * FROM organizations WHERE id = ?").get(e);
  }
  updateOrganization(e) {
    const { id: a, name: c, description: d = null, icon: l = null } = e;
    return this.db.prepare(`
      UPDATE organizations
      SET name = ?, description = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(c, d, l, a);
  }
  deleteOrganization(e) {
    return this.db.prepare("DELETE FROM organizations WHERE id = ?").run(e);
  }
  // Project methods
  createProject(e) {
    console.log("DatabaseManager: Creating project", e);
    const { id: a, organization_id: c, name: d, description: l = null, color: n = null } = e;
    try {
      const o = this.db.transaction(() => {
        if (!this.db.prepare("SELECT id FROM organizations WHERE id = ?").get(c))
          throw new Error(`Organization with ID ${c} does not exist`);
        const f = this.db.prepare(`
          INSERT INTO projects (id, organization_id, name, description, color)
          VALUES (?, ?, ?, ?, ?)
        `).run(a, c, d, l, n);
        console.log("Project created in database with result:", f);
        const i = this.db.prepare("SELECT * FROM projects WHERE id = ?").get(a);
        return console.log("Inserted project verification:", i), i;
      })();
      return this.logDbState(), o;
    } catch (h) {
      throw console.error("Database error in createProject:", h), h;
    }
  }
  getProjects(e) {
    console.log(`Getting projects${e ? ` for org ${e}` : " (all)"}`);
    try {
      let a;
      if (e) {
        if (!this.db.prepare("SELECT id FROM organizations WHERE id = ?").get(e))
          return console.error(`Organization with ID ${e} not found when getting projects`), [];
        a = this.db.prepare("SELECT * FROM projects WHERE organization_id = ? ORDER BY name").all(e);
      } else
        a = this.db.prepare("SELECT * FROM projects ORDER BY name").all();
      return console.log(
        `Found ${a.length} projects:`,
        a.map((c) => ({ id: c.id, name: c.name, org_id: c.organization_id }))
      ), a;
    } catch (a) {
      return console.error("Error in getProjects:", a), [];
    }
  }
  getProject(e) {
    return this.db.prepare("SELECT * FROM projects WHERE id = ?").get(e);
  }
  updateProject(e) {
    const { id: a, organization_id: c, name: d, description: l = null, color: n = null } = e;
    return this.db.prepare(`
      UPDATE projects
      SET organization_id = ?, name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(c, d, l, n, a);
  }
  deleteProject(e) {
    return this.db.prepare("DELETE FROM projects WHERE id = ?").run(e);
  }
  // Book methods
  createBook(e) {
    console.log("DatabaseManager: Creating book", e);
    const { id: a, project_id: c, name: d, description: l = null, cover_image: n = null, spine_color: h = null, position: o = null } = e;
    try {
      return this.db.transaction(() => {
        if (!this.db.prepare("SELECT id FROM projects WHERE id = ?").get(c))
          throw new Error(`Project with ID ${c} does not exist`);
        let i = o;
        if (i === null) {
          const p = this.db.prepare(
            "SELECT MAX(position) as maxPos FROM books WHERE project_id = ?"
          ).get(c);
          i = p && p.maxPos !== null ? p.maxPos + 1 : 0, console.log(`Auto-assigned position ${i} for new book`);
        }
        const E = this.db.prepare(`
          INSERT INTO books (id, project_id, name, description, cover_image, spine_color, position)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(a, c, d, l, n, h, i);
        console.log("Book created in database with result:", E);
        const y = this.db.prepare("SELECT * FROM books WHERE id = ?").get(a);
        return console.log("Inserted book verification:", y), y;
      })();
    } catch (u) {
      throw console.error("Database error in createBook:", u), u;
    }
  }
  getBooks(e) {
    console.log(`Getting books${e ? ` for project ${e}` : " (all)"}`);
    try {
      let a;
      if (e) {
        if (!this.db.prepare("SELECT id FROM projects WHERE id = ?").get(e))
          return console.error(`Project with ID ${e} not found when getting books`), [];
        a = this.db.prepare("SELECT * FROM books WHERE project_id = ? ORDER BY position, name").all(e);
      } else
        a = this.db.prepare("SELECT * FROM books ORDER BY position, name").all();
      return console.log(
        `Found ${a.length} books:`,
        a.map((c) => ({ id: c.id, name: c.name, project_id: c.project_id }))
      ), a;
    } catch (a) {
      return console.error("Error in getBooks:", a), [];
    }
  }
  getBook(e) {
    return this.db.prepare("SELECT * FROM books WHERE id = ?").get(e);
  }
  updateBook(e) {
    const { id: a, project_id: c, name: d, description: l = null, cover_image: n = null, spine_color: h = null, position: o = null } = e;
    return this.db.prepare(`
      UPDATE books
      SET project_id = ?, name = ?, description = ?, cover_image = ?, spine_color = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(c, d, l, n, h, o, a);
  }
  deleteBook(e) {
    return this.db.prepare("DELETE FROM books WHERE id = ?").run(e);
  }
  // Chapter methods
  createChapter(e) {
    console.log("DatabaseManager: Creating chapter", e);
    const { id: a, book_id: c, name: d, position: l = null } = e;
    try {
      return this.db.transaction(() => {
        if (!this.db.prepare("SELECT id FROM books WHERE id = ?").get(c))
          throw new Error(`Book with ID ${c} does not exist`);
        const s = this.db.prepare(`
          INSERT INTO chapters (id, book_id, name, position)
          VALUES (?, ?, ?, ?)
        `).run(a, c, d, l);
        console.log("Chapter created in database with result:", s);
        const f = this.db.prepare("SELECT * FROM chapters WHERE id = ?").get(a);
        return console.log("Inserted chapter verification:", f), f;
      })();
    } catch (n) {
      throw console.error("Database error in createChapter:", n), n;
    }
  }
  getChapters(e) {
    console.log(`Getting chapters${e ? ` for book ${e}` : " (all)"}`);
    try {
      let a;
      if (e) {
        if (!this.db.prepare("SELECT id FROM books WHERE id = ?").get(e))
          return console.error(`Book with ID ${e} not found when getting chapters`), [];
        a = this.db.prepare("SELECT * FROM chapters WHERE book_id = ? ORDER BY position, name").all(e);
      } else
        a = this.db.prepare("SELECT * FROM chapters ORDER BY position, name").all();
      return console.log(
        `Found ${a.length} chapters:`,
        a.map((c) => ({ id: c.id, name: c.name, book_id: c.book_id }))
      ), a;
    } catch (a) {
      return console.error("Error in getChapters:", a), [];
    }
  }
  getChapter(e) {
    return this.db.prepare("SELECT * FROM chapters WHERE id = ?").get(e);
  }
  updateChapter(e) {
    const { id: a, book_id: c, name: d, position: l = null } = e;
    return this.db.prepare(`
      UPDATE chapters
      SET book_id = ?, name = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(c, d, l, a);
  }
  deleteChapter(e) {
    return this.db.prepare("DELETE FROM chapters WHERE id = ?").run(e);
  }
  // Page methods
  createPage(e) {
    try {
      const a = this.getNextPagePosition(e.chapter_id), c = e.page_type || "note", d = {
        ...e.metadata || {},
        lastModified: (/* @__PURE__ */ new Date()).toISOString()
      }, l = this.db.prepare(`
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
        e.id || crypto.randomUUID(),
        e.chapter_id,
        e.title,
        e.content || "",
        e.content_text || "",
        c,
        JSON.stringify(d),
        a
      );
      if (l.changes === 0)
        throw new Error("Failed to create page");
      return {
        success: !0,
        page: {
          ...e,
          id: l.lastInsertRowid,
          position: a,
          page_type: c,
          metadata: d
        }
      };
    } catch (a) {
      return console.error("Error creating page:", a), {
        success: !1,
        error: String(a)
      };
    }
  }
  getPages(e) {
    console.log(`Getting pages${e ? ` for chapter ${e}` : " (all)"}`);
    try {
      let a;
      if (e) {
        if (!this.db.prepare("SELECT id FROM chapters WHERE id = ?").get(e))
          return console.error(`Chapter with ID ${e} not found when getting pages`), [];
        a = this.db.prepare("SELECT * FROM pages WHERE chapter_id = ? ORDER BY position, title").all(e);
      } else
        a = this.db.prepare("SELECT * FROM pages ORDER BY position, title").all();
      return console.log(
        `Found ${a.length} pages:`,
        a.map((c) => ({ id: c.id, title: c.title, chapter_id: c.chapter_id }))
      ), a;
    } catch (a) {
      return console.error("Error in getPages:", a), [];
    }
  }
  getPage(e) {
    return this.db.prepare("SELECT * FROM pages WHERE id = ?").get(e);
  }
  getPageContent(e) {
    console.log(`Getting content for page ${e}`);
    try {
      if (!this.db.prepare("SELECT id FROM pages WHERE id = ?").get(e))
        return console.error(`Page with ID ${e} not found when getting content`), null;
      const c = this.db.prepare("SELECT content FROM pages WHERE id = ?").get(e);
      if (!c)
        return console.log(`No content found for page ${e}`), null;
      if (!c.content)
        return console.log(`Content is null for page ${e}`), null;
      try {
        const d = JSON.parse(c.content);
        return console.log(`Successfully parsed JSON content for page ${e}`), d;
      } catch {
        return console.log(`Content for page ${e} is not JSON, returning raw content`), c.content;
      }
    } catch (a) {
      return console.error(`Error getting content for page ${e}:`, a), null;
    }
  }
  updatePageContent(e, a, c) {
    console.log(`Updating content for page ${e}`);
    try {
      return this.db.transaction(() => {
        if (!this.db.prepare("SELECT id FROM pages WHERE id = ?").get(e))
          throw new Error(`Page with ID ${e} does not exist`);
        let d = a, l = null;
        return typeof a == "object" && a !== null && a.metadata && (l = JSON.stringify(a.metadata), d = a.content), this.db.prepare(`
          UPDATE pages 
          SET content = ?, 
              content_text = ?,
              metadata = COALESCE(?, metadata),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(d, c, l, e);
      })();
    } catch (d) {
      throw console.error(`Error updating content for page ${e}:`, d), d;
    }
  }
  updatePage(e) {
    const { id: a, chapter_id: c, title: d, page_type: l = "note", tags: n = null, position: h = null } = e;
    return this.db.prepare(`
      UPDATE pages
      SET chapter_id = ?, title = ?, page_type = ?, tags = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(c, d, l, n, h, a);
  }
  deletePage(e) {
    return this.db.prepare("DELETE FROM pages WHERE id = ?").run(e);
  }
  close() {
    this.db.close();
  }
  // Migration method to fix null IDs and clean up database
  fixDatabaseIntegrity() {
    console.log("Starting database integrity fix...");
    try {
      this.db.transaction(() => {
        try {
          this.db.prepare("SELECT icon FROM organizations LIMIT 1").get();
        } catch {
          console.log("Adding icon column to organizations table..."), this.db.prepare("ALTER TABLE organizations ADD COLUMN icon TEXT").run();
        }
        try {
          this.db.prepare("SELECT updated_at FROM organizations LIMIT 1").get();
        } catch {
          console.log("Adding updated_at column to organizations table..."), this.db.prepare("ALTER TABLE organizations ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
        }
        const a = this.db.prepare("SELECT * FROM organizations WHERE id IS NULL").all();
        for (const h of a) {
          const o = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare("UPDATE organizations SET id = ? WHERE rowid = ?").run(o, h.rowid), console.log(`Fixed organization with null ID, new ID: ${o}`);
        }
        const c = this.db.prepare("SELECT * FROM projects WHERE id IS NULL").all();
        for (const h of c) {
          const o = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare("UPDATE projects SET id = ? WHERE rowid = ?").run(o, h.rowid), console.log(`Fixed project with null ID, new ID: ${o}`);
        }
        const d = this.db.prepare("SELECT * FROM books WHERE id IS NULL").all();
        for (const h of d) {
          const o = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare("UPDATE books SET id = ? WHERE rowid = ?").run(o, h.rowid), console.log(`Fixed book with null ID, new ID: ${o}`);
        }
        const l = this.db.prepare("SELECT * FROM chapters WHERE id IS NULL").all();
        for (const h of l) {
          const o = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare("UPDATE chapters SET id = ? WHERE rowid = ?").run(o, h.rowid), console.log(`Fixed chapter with null ID, new ID: ${o}`);
        }
        const n = this.db.prepare("SELECT * FROM pages WHERE id IS NULL").all();
        for (const h of n) {
          const o = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.db.prepare("UPDATE pages SET id = ? WHERE rowid = ?").run(o, h.rowid), console.log(`Fixed page with null ID, new ID: ${o}`);
        }
        this.db.prepare("DELETE FROM projects WHERE organization_id IS NULL OR organization_id NOT IN (SELECT id FROM organizations)").run(), this.db.prepare("DELETE FROM books WHERE project_id IS NULL OR project_id NOT IN (SELECT id FROM projects)").run(), this.db.prepare("DELETE FROM chapters WHERE book_id IS NULL OR book_id NOT IN (SELECT id FROM books)").run(), this.db.prepare("DELETE FROM pages WHERE chapter_id IS NULL OR chapter_id NOT IN (SELECT id FROM chapters)").run(), console.log("Database integrity fix completed successfully");
      })();
    } catch (e) {
      console.error("Error fixing database integrity:", e);
    }
  }
  // Debug method to log database state
  logDbState() {
    console.log(`
==== DATABASE STATE ====`);
    try {
      const e = this.db.prepare("SELECT * FROM organizations").all();
      console.log(`Organizations (${e.length}):`), e.forEach((n) => {
        console.log(`- ${n.id}: ${n.name}`);
      });
      const a = this.db.prepare("SELECT * FROM projects").all();
      console.log(`
Projects (${a.length}):`), a.forEach((n) => {
        console.log(`- ${n.id}: ${n.name} (org: ${n.organization_id})`);
      });
      const c = this.db.prepare("SELECT * FROM books").all();
      console.log(`
Books (${c.length}):`), c.forEach((n) => {
        console.log(`- ${n.id}: ${n.name} (project: ${n.project_id})`);
      });
      const d = this.db.prepare("SELECT * FROM chapters").all();
      console.log(`
Chapters (${d.length}):`), d.forEach((n) => {
        console.log(`- ${n.id}: ${n.name} (book: ${n.book_id})`);
      });
      const l = this.db.prepare("SELECT * FROM pages").all();
      console.log(`
Pages (${l.length}):`), l.forEach((n) => {
        console.log(`- ${n.id}: ${n.title} (chapter: ${n.chapter_id})`);
      }), console.log(`==== END DATABASE STATE ====
`);
    } catch (e) {
      console.error("Error logging database state:", e);
    }
  }
  validateAndExtractMetadata(e, a) {
    const c = {};
    switch (a) {
      case "code":
        const d = e.match(/^\/\/ language: (.+)$/m);
        d && (c.language = d[1], e = e.replace(/^\/\/ language: .+\n/, ""));
        break;
      case "image":
        if (typeof e == "string" && e.startsWith("data:image/")) {
          const l = e.match(/^data:([^;]+);/);
          l && (c.mimeType = l[1]);
        }
        break;
      case "video":
      case "audio":
        e.duration && (c.duration = e.duration), e.mimeType && (c.mimeType = e.mimeType);
        break;
      case "spreadsheet":
        c.version = "1.0", c.encoding = "json";
        break;
      case "pdf":
        typeof e == "string" && e.startsWith("data:application/pdf;") && (c.mimeType = "application/pdf");
        break;
    }
    return { content: e, metadata: c };
  }
  getNextPagePosition(e) {
    return (this.db.prepare(`
      SELECT MAX(position) as maxPosition 
      FROM pages 
      WHERE chapter_id = ?
    `).get(e).maxPosition ?? -1) + 1;
  }
}
var it = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, Rt = {}, en = {}, Cr = {}, Oa;
function Ke() {
  return Oa || (Oa = 1, Cr.fromCallback = function(t) {
    return Object.defineProperty(function(...e) {
      if (typeof e[e.length - 1] == "function") t.apply(this, e);
      else
        return new Promise((a, c) => {
          e.push((d, l) => d != null ? c(d) : a(l)), t.apply(this, e);
        });
    }, "name", { value: t.name });
  }, Cr.fromPromise = function(t) {
    return Object.defineProperty(function(...e) {
      const a = e[e.length - 1];
      if (typeof a != "function") return t.apply(this, e);
      e.pop(), t.apply(this, e).then((c) => a(null, c), a);
    }, "name", { value: t.name });
  }), Cr;
}
var tn, Da;
function fc() {
  if (Da) return tn;
  Da = 1;
  var t = sc, e = process.cwd, a = null, c = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    return a || (a = e.call(process)), a;
  };
  try {
    process.cwd();
  } catch {
  }
  if (typeof process.chdir == "function") {
    var d = process.chdir;
    process.chdir = function(n) {
      a = null, d.call(process, n);
    }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, d);
  }
  tn = l;
  function l(n) {
    t.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && h(n), n.lutimes || o(n), n.chown = f(n.chown), n.fchown = f(n.fchown), n.lchown = f(n.lchown), n.chmod = u(n.chmod), n.fchmod = u(n.fchmod), n.lchmod = u(n.lchmod), n.chownSync = i(n.chownSync), n.fchownSync = i(n.fchownSync), n.lchownSync = i(n.lchownSync), n.chmodSync = s(n.chmodSync), n.fchmodSync = s(n.fchmodSync), n.lchmodSync = s(n.lchmodSync), n.stat = g(n.stat), n.fstat = g(n.fstat), n.lstat = g(n.lstat), n.statSync = E(n.statSync), n.fstatSync = E(n.fstatSync), n.lstatSync = E(n.lstatSync), n.chmod && !n.lchmod && (n.lchmod = function(p, T, b) {
      b && process.nextTick(b);
    }, n.lchmodSync = function() {
    }), n.chown && !n.lchown && (n.lchown = function(p, T, b, O) {
      O && process.nextTick(O);
    }, n.lchownSync = function() {
    }), c === "win32" && (n.rename = typeof n.rename != "function" ? n.rename : function(p) {
      function T(b, O, D) {
        var q = Date.now(), A = 0;
        p(b, O, function S(R) {
          if (R && (R.code === "EACCES" || R.code === "EPERM" || R.code === "EBUSY") && Date.now() - q < 6e4) {
            setTimeout(function() {
              n.stat(O, function(v, M) {
                v && v.code === "ENOENT" ? p(b, O, S) : D(R);
              });
            }, A), A < 100 && (A += 10);
            return;
          }
          D && D(R);
        });
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(T, p), T;
    }(n.rename)), n.read = typeof n.read != "function" ? n.read : function(p) {
      function T(b, O, D, q, A, S) {
        var R;
        if (S && typeof S == "function") {
          var v = 0;
          R = function(M, U, x) {
            if (M && M.code === "EAGAIN" && v < 10)
              return v++, p.call(n, b, O, D, q, A, R);
            S.apply(this, arguments);
          };
        }
        return p.call(n, b, O, D, q, A, R);
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(T, p), T;
    }(n.read), n.readSync = typeof n.readSync != "function" ? n.readSync : /* @__PURE__ */ function(p) {
      return function(T, b, O, D, q) {
        for (var A = 0; ; )
          try {
            return p.call(n, T, b, O, D, q);
          } catch (S) {
            if (S.code === "EAGAIN" && A < 10) {
              A++;
              continue;
            }
            throw S;
          }
      };
    }(n.readSync);
    function h(p) {
      p.lchmod = function(T, b, O) {
        p.open(
          T,
          t.O_WRONLY | t.O_SYMLINK,
          b,
          function(D, q) {
            if (D) {
              O && O(D);
              return;
            }
            p.fchmod(q, b, function(A) {
              p.close(q, function(S) {
                O && O(A || S);
              });
            });
          }
        );
      }, p.lchmodSync = function(T, b) {
        var O = p.openSync(T, t.O_WRONLY | t.O_SYMLINK, b), D = !0, q;
        try {
          q = p.fchmodSync(O, b), D = !1;
        } finally {
          if (D)
            try {
              p.closeSync(O);
            } catch {
            }
          else
            p.closeSync(O);
        }
        return q;
      };
    }
    function o(p) {
      t.hasOwnProperty("O_SYMLINK") && p.futimes ? (p.lutimes = function(T, b, O, D) {
        p.open(T, t.O_SYMLINK, function(q, A) {
          if (q) {
            D && D(q);
            return;
          }
          p.futimes(A, b, O, function(S) {
            p.close(A, function(R) {
              D && D(S || R);
            });
          });
        });
      }, p.lutimesSync = function(T, b, O) {
        var D = p.openSync(T, t.O_SYMLINK), q, A = !0;
        try {
          q = p.futimesSync(D, b, O), A = !1;
        } finally {
          if (A)
            try {
              p.closeSync(D);
            } catch {
            }
          else
            p.closeSync(D);
        }
        return q;
      }) : p.futimes && (p.lutimes = function(T, b, O, D) {
        D && process.nextTick(D);
      }, p.lutimesSync = function() {
      });
    }
    function u(p) {
      return p && function(T, b, O) {
        return p.call(n, T, b, function(D) {
          y(D) && (D = null), O && O.apply(this, arguments);
        });
      };
    }
    function s(p) {
      return p && function(T, b) {
        try {
          return p.call(n, T, b);
        } catch (O) {
          if (!y(O)) throw O;
        }
      };
    }
    function f(p) {
      return p && function(T, b, O, D) {
        return p.call(n, T, b, O, function(q) {
          y(q) && (q = null), D && D.apply(this, arguments);
        });
      };
    }
    function i(p) {
      return p && function(T, b, O) {
        try {
          return p.call(n, T, b, O);
        } catch (D) {
          if (!y(D)) throw D;
        }
      };
    }
    function g(p) {
      return p && function(T, b, O) {
        typeof b == "function" && (O = b, b = null);
        function D(q, A) {
          A && (A.uid < 0 && (A.uid += 4294967296), A.gid < 0 && (A.gid += 4294967296)), O && O.apply(this, arguments);
        }
        return b ? p.call(n, T, b, D) : p.call(n, T, D);
      };
    }
    function E(p) {
      return p && function(T, b) {
        var O = b ? p.call(n, T, b) : p.call(n, T);
        return O && (O.uid < 0 && (O.uid += 4294967296), O.gid < 0 && (O.gid += 4294967296)), O;
      };
    }
    function y(p) {
      if (!p || p.code === "ENOSYS")
        return !0;
      var T = !process.getuid || process.getuid() !== 0;
      return !!(T && (p.code === "EINVAL" || p.code === "EPERM"));
    }
  }
  return tn;
}
var rn, Pa;
function dc() {
  if (Pa) return rn;
  Pa = 1;
  var t = mr.Stream;
  rn = e;
  function e(a) {
    return {
      ReadStream: c,
      WriteStream: d
    };
    function c(l, n) {
      if (!(this instanceof c)) return new c(l, n);
      t.call(this);
      var h = this;
      this.path = l, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, n = n || {};
      for (var o = Object.keys(n), u = 0, s = o.length; u < s; u++) {
        var f = o[u];
        this[f] = n[f];
      }
      if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.end === void 0)
          this.end = 1 / 0;
        else if (typeof this.end != "number")
          throw TypeError("end must be a Number");
        if (this.start > this.end)
          throw new Error("start must be <= end");
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          h._read();
        });
        return;
      }
      a.open(this.path, this.flags, this.mode, function(i, g) {
        if (i) {
          h.emit("error", i), h.readable = !1;
          return;
        }
        h.fd = g, h.emit("open", g), h._read();
      });
    }
    function d(l, n) {
      if (!(this instanceof d)) return new d(l, n);
      t.call(this), this.path = l, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, n = n || {};
      for (var h = Object.keys(n), o = 0, u = h.length; o < u; o++) {
        var s = h[o];
        this[s] = n[s];
      }
      if (this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.start < 0)
          throw new Error("start must be >= zero");
        this.pos = this.start;
      }
      this.busy = !1, this._queue = [], this.fd === null && (this._open = a.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
    }
  }
  return rn;
}
var nn, Ia;
function hc() {
  if (Ia) return nn;
  Ia = 1, nn = e;
  var t = Object.getPrototypeOf || function(a) {
    return a.__proto__;
  };
  function e(a) {
    if (a === null || typeof a != "object")
      return a;
    if (a instanceof Object)
      var c = { __proto__: t(a) };
    else
      var c = /* @__PURE__ */ Object.create(null);
    return Object.getOwnPropertyNames(a).forEach(function(d) {
      Object.defineProperty(c, d, Object.getOwnPropertyDescriptor(a, d));
    }), c;
  }
  return nn;
}
var Or, Na;
function Ve() {
  if (Na) return Or;
  Na = 1;
  var t = xe, e = fc(), a = dc(), c = hc(), d = ta, l, n;
  typeof Symbol == "function" && typeof Symbol.for == "function" ? (l = Symbol.for("graceful-fs.queue"), n = Symbol.for("graceful-fs.previous")) : (l = "___graceful-fs.queue", n = "___graceful-fs.previous");
  function h() {
  }
  function o(p, T) {
    Object.defineProperty(p, l, {
      get: function() {
        return T;
      }
    });
  }
  var u = h;
  if (d.debuglog ? u = d.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (u = function() {
    var p = d.format.apply(d, arguments);
    p = "GFS4: " + p.split(/\n/).join(`
GFS4: `), console.error(p);
  }), !t[l]) {
    var s = it[l] || [];
    o(t, s), t.close = function(p) {
      function T(b, O) {
        return p.call(t, b, function(D) {
          D || E(), typeof O == "function" && O.apply(this, arguments);
        });
      }
      return Object.defineProperty(T, n, {
        value: p
      }), T;
    }(t.close), t.closeSync = function(p) {
      function T(b) {
        p.apply(t, arguments), E();
      }
      return Object.defineProperty(T, n, {
        value: p
      }), T;
    }(t.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
      u(t[l]), Il.equal(t[l].length, 0);
    });
  }
  it[l] || o(it, t[l]), Or = f(c(t)), process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !t.__patched && (Or = f(t), t.__patched = !0);
  function f(p) {
    e(p), p.gracefulify = f, p.createReadStream = ce, p.createWriteStream = ue;
    var T = p.readFile;
    p.readFile = b;
    function b(K, ye, _) {
      return typeof ye == "function" && (_ = ye, ye = null), m(K, ye, _);
      function m(j, I, le, ge) {
        return T(j, I, function(pe) {
          pe && (pe.code === "EMFILE" || pe.code === "ENFILE") ? i([m, [j, I, le], pe, ge || Date.now(), Date.now()]) : typeof le == "function" && le.apply(this, arguments);
        });
      }
    }
    var O = p.writeFile;
    p.writeFile = D;
    function D(K, ye, _, m) {
      return typeof _ == "function" && (m = _, _ = null), j(K, ye, _, m);
      function j(I, le, ge, pe, _e) {
        return O(I, le, ge, function(ve) {
          ve && (ve.code === "EMFILE" || ve.code === "ENFILE") ? i([j, [I, le, ge, pe], ve, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var q = p.appendFile;
    q && (p.appendFile = A);
    function A(K, ye, _, m) {
      return typeof _ == "function" && (m = _, _ = null), j(K, ye, _, m);
      function j(I, le, ge, pe, _e) {
        return q(I, le, ge, function(ve) {
          ve && (ve.code === "EMFILE" || ve.code === "ENFILE") ? i([j, [I, le, ge, pe], ve, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var S = p.copyFile;
    S && (p.copyFile = R);
    function R(K, ye, _, m) {
      return typeof _ == "function" && (m = _, _ = 0), j(K, ye, _, m);
      function j(I, le, ge, pe, _e) {
        return S(I, le, ge, function(ve) {
          ve && (ve.code === "EMFILE" || ve.code === "ENFILE") ? i([j, [I, le, ge, pe], ve, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var v = p.readdir;
    p.readdir = U;
    var M = /^v[0-5]\./;
    function U(K, ye, _) {
      typeof ye == "function" && (_ = ye, ye = null);
      var m = M.test(process.version) ? function(le, ge, pe, _e) {
        return v(le, j(
          le,
          ge,
          pe,
          _e
        ));
      } : function(le, ge, pe, _e) {
        return v(le, ge, j(
          le,
          ge,
          pe,
          _e
        ));
      };
      return m(K, ye, _);
      function j(I, le, ge, pe) {
        return function(_e, ve) {
          _e && (_e.code === "EMFILE" || _e.code === "ENFILE") ? i([
            m,
            [I, le, ge],
            _e,
            pe || Date.now(),
            Date.now()
          ]) : (ve && ve.sort && ve.sort(), typeof ge == "function" && ge.call(this, _e, ve));
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var x = a(p);
      $ = x.ReadStream, W = x.WriteStream;
    }
    var k = p.ReadStream;
    k && ($.prototype = Object.create(k.prototype), $.prototype.open = J);
    var N = p.WriteStream;
    N && (W.prototype = Object.create(N.prototype), W.prototype.open = ne), Object.defineProperty(p, "ReadStream", {
      get: function() {
        return $;
      },
      set: function(K) {
        $ = K;
      },
      enumerable: !0,
      configurable: !0
    }), Object.defineProperty(p, "WriteStream", {
      get: function() {
        return W;
      },
      set: function(K) {
        W = K;
      },
      enumerable: !0,
      configurable: !0
    });
    var P = $;
    Object.defineProperty(p, "FileReadStream", {
      get: function() {
        return P;
      },
      set: function(K) {
        P = K;
      },
      enumerable: !0,
      configurable: !0
    });
    var F = W;
    Object.defineProperty(p, "FileWriteStream", {
      get: function() {
        return F;
      },
      set: function(K) {
        F = K;
      },
      enumerable: !0,
      configurable: !0
    });
    function $(K, ye) {
      return this instanceof $ ? (k.apply(this, arguments), this) : $.apply(Object.create($.prototype), arguments);
    }
    function J() {
      var K = this;
      be(K.path, K.flags, K.mode, function(ye, _) {
        ye ? (K.autoClose && K.destroy(), K.emit("error", ye)) : (K.fd = _, K.emit("open", _), K.read());
      });
    }
    function W(K, ye) {
      return this instanceof W ? (N.apply(this, arguments), this) : W.apply(Object.create(W.prototype), arguments);
    }
    function ne() {
      var K = this;
      be(K.path, K.flags, K.mode, function(ye, _) {
        ye ? (K.destroy(), K.emit("error", ye)) : (K.fd = _, K.emit("open", _));
      });
    }
    function ce(K, ye) {
      return new p.ReadStream(K, ye);
    }
    function ue(K, ye) {
      return new p.WriteStream(K, ye);
    }
    var ie = p.open;
    p.open = be;
    function be(K, ye, _, m) {
      return typeof _ == "function" && (m = _, _ = null), j(K, ye, _, m);
      function j(I, le, ge, pe, _e) {
        return ie(I, le, ge, function(ve, Ue) {
          ve && (ve.code === "EMFILE" || ve.code === "ENFILE") ? i([j, [I, le, ge, pe], ve, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    return p;
  }
  function i(p) {
    u("ENQUEUE", p[0].name, p[1]), t[l].push(p), y();
  }
  var g;
  function E() {
    for (var p = Date.now(), T = 0; T < t[l].length; ++T)
      t[l][T].length > 2 && (t[l][T][3] = p, t[l][T][4] = p);
    y();
  }
  function y() {
    if (clearTimeout(g), g = void 0, t[l].length !== 0) {
      var p = t[l].shift(), T = p[0], b = p[1], O = p[2], D = p[3], q = p[4];
      if (D === void 0)
        u("RETRY", T.name, b), T.apply(null, b);
      else if (Date.now() - D >= 6e4) {
        u("TIMEOUT", T.name, b);
        var A = b.pop();
        typeof A == "function" && A.call(null, O);
      } else {
        var S = Date.now() - q, R = Math.max(q - D, 1), v = Math.min(R * 1.2, 100);
        S >= v ? (u("RETRY", T.name, b), T.apply(null, b.concat([D]))) : t[l].push(p);
      }
      g === void 0 && (g = setTimeout(y, 0));
    }
  }
  return Or;
}
var Fa;
function Bt() {
  return Fa || (Fa = 1, function(t) {
    const e = Ke().fromCallback, a = Ve(), c = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "lchmod",
      "lchown",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((d) => typeof a[d] == "function");
    Object.assign(t, a), c.forEach((d) => {
      t[d] = e(a[d]);
    }), t.exists = function(d, l) {
      return typeof l == "function" ? a.exists(d, l) : new Promise((n) => a.exists(d, n));
    }, t.read = function(d, l, n, h, o, u) {
      return typeof u == "function" ? a.read(d, l, n, h, o, u) : new Promise((s, f) => {
        a.read(d, l, n, h, o, (i, g, E) => {
          if (i) return f(i);
          s({ bytesRead: g, buffer: E });
        });
      });
    }, t.write = function(d, l, ...n) {
      return typeof n[n.length - 1] == "function" ? a.write(d, l, ...n) : new Promise((h, o) => {
        a.write(d, l, ...n, (u, s, f) => {
          if (u) return o(u);
          h({ bytesWritten: s, buffer: f });
        });
      });
    }, typeof a.writev == "function" && (t.writev = function(d, l, ...n) {
      return typeof n[n.length - 1] == "function" ? a.writev(d, l, ...n) : new Promise((h, o) => {
        a.writev(d, l, ...n, (u, s, f) => {
          if (u) return o(u);
          h({ bytesWritten: s, buffers: f });
        });
      });
    }), typeof a.realpath.native == "function" ? t.realpath.native = e(a.realpath.native) : process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  }(en)), en;
}
var Dr = {}, an = {}, La;
function pc() {
  if (La) return an;
  La = 1;
  const t = Se;
  return an.checkPath = function(a) {
    if (process.platform === "win32" && /[<>:"|?*]/.test(a.replace(t.parse(a).root, ""))) {
      const d = new Error(`Path contains invalid characters: ${a}`);
      throw d.code = "EINVAL", d;
    }
  }, an;
}
var xa;
function gc() {
  if (xa) return Dr;
  xa = 1;
  const t = /* @__PURE__ */ Bt(), { checkPath: e } = /* @__PURE__ */ pc(), a = (c) => {
    const d = { mode: 511 };
    return typeof c == "number" ? c : { ...d, ...c }.mode;
  };
  return Dr.makeDir = async (c, d) => (e(c), t.mkdir(c, {
    mode: a(d),
    recursive: !0
  })), Dr.makeDirSync = (c, d) => (e(c), t.mkdirSync(c, {
    mode: a(d),
    recursive: !0
  })), Dr;
}
var on, Ua;
function st() {
  if (Ua) return on;
  Ua = 1;
  const t = Ke().fromPromise, { makeDir: e, makeDirSync: a } = /* @__PURE__ */ gc(), c = t(e);
  return on = {
    mkdirs: c,
    mkdirsSync: a,
    // alias
    mkdirp: c,
    mkdirpSync: a,
    ensureDir: c,
    ensureDirSync: a
  }, on;
}
var sn, $a;
function Pt() {
  if ($a) return sn;
  $a = 1;
  const t = Ke().fromPromise, e = /* @__PURE__ */ Bt();
  function a(c) {
    return e.access(c).then(() => !0).catch(() => !1);
  }
  return sn = {
    pathExists: t(a),
    pathExistsSync: e.existsSync
  }, sn;
}
var ln, ka;
function xl() {
  if (ka) return ln;
  ka = 1;
  const t = Ve();
  function e(c, d, l, n) {
    t.open(c, "r+", (h, o) => {
      if (h) return n(h);
      t.futimes(o, d, l, (u) => {
        t.close(o, (s) => {
          n && n(u || s);
        });
      });
    });
  }
  function a(c, d, l) {
    const n = t.openSync(c, "r+");
    return t.futimesSync(n, d, l), t.closeSync(n);
  }
  return ln = {
    utimesMillis: e,
    utimesMillisSync: a
  }, ln;
}
var un, Ma;
function jt() {
  if (Ma) return un;
  Ma = 1;
  const t = /* @__PURE__ */ Bt(), e = Se, a = ta;
  function c(i, g, E) {
    const y = E.dereference ? (p) => t.stat(p, { bigint: !0 }) : (p) => t.lstat(p, { bigint: !0 });
    return Promise.all([
      y(i),
      y(g).catch((p) => {
        if (p.code === "ENOENT") return null;
        throw p;
      })
    ]).then(([p, T]) => ({ srcStat: p, destStat: T }));
  }
  function d(i, g, E) {
    let y;
    const p = E.dereference ? (b) => t.statSync(b, { bigint: !0 }) : (b) => t.lstatSync(b, { bigint: !0 }), T = p(i);
    try {
      y = p(g);
    } catch (b) {
      if (b.code === "ENOENT") return { srcStat: T, destStat: null };
      throw b;
    }
    return { srcStat: T, destStat: y };
  }
  function l(i, g, E, y, p) {
    a.callbackify(c)(i, g, y, (T, b) => {
      if (T) return p(T);
      const { srcStat: O, destStat: D } = b;
      if (D) {
        if (u(O, D)) {
          const q = e.basename(i), A = e.basename(g);
          return E === "move" && q !== A && q.toLowerCase() === A.toLowerCase() ? p(null, { srcStat: O, destStat: D, isChangingCase: !0 }) : p(new Error("Source and destination must not be the same."));
        }
        if (O.isDirectory() && !D.isDirectory())
          return p(new Error(`Cannot overwrite non-directory '${g}' with directory '${i}'.`));
        if (!O.isDirectory() && D.isDirectory())
          return p(new Error(`Cannot overwrite directory '${g}' with non-directory '${i}'.`));
      }
      return O.isDirectory() && s(i, g) ? p(new Error(f(i, g, E))) : p(null, { srcStat: O, destStat: D });
    });
  }
  function n(i, g, E, y) {
    const { srcStat: p, destStat: T } = d(i, g, y);
    if (T) {
      if (u(p, T)) {
        const b = e.basename(i), O = e.basename(g);
        if (E === "move" && b !== O && b.toLowerCase() === O.toLowerCase())
          return { srcStat: p, destStat: T, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (p.isDirectory() && !T.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${g}' with directory '${i}'.`);
      if (!p.isDirectory() && T.isDirectory())
        throw new Error(`Cannot overwrite directory '${g}' with non-directory '${i}'.`);
    }
    if (p.isDirectory() && s(i, g))
      throw new Error(f(i, g, E));
    return { srcStat: p, destStat: T };
  }
  function h(i, g, E, y, p) {
    const T = e.resolve(e.dirname(i)), b = e.resolve(e.dirname(E));
    if (b === T || b === e.parse(b).root) return p();
    t.stat(b, { bigint: !0 }, (O, D) => O ? O.code === "ENOENT" ? p() : p(O) : u(g, D) ? p(new Error(f(i, E, y))) : h(i, g, b, y, p));
  }
  function o(i, g, E, y) {
    const p = e.resolve(e.dirname(i)), T = e.resolve(e.dirname(E));
    if (T === p || T === e.parse(T).root) return;
    let b;
    try {
      b = t.statSync(T, { bigint: !0 });
    } catch (O) {
      if (O.code === "ENOENT") return;
      throw O;
    }
    if (u(g, b))
      throw new Error(f(i, E, y));
    return o(i, g, T, y);
  }
  function u(i, g) {
    return g.ino && g.dev && g.ino === i.ino && g.dev === i.dev;
  }
  function s(i, g) {
    const E = e.resolve(i).split(e.sep).filter((p) => p), y = e.resolve(g).split(e.sep).filter((p) => p);
    return E.reduce((p, T, b) => p && y[b] === T, !0);
  }
  function f(i, g, E) {
    return `Cannot ${E} '${i}' to a subdirectory of itself, '${g}'.`;
  }
  return un = {
    checkPaths: l,
    checkPathsSync: n,
    checkParentPaths: h,
    checkParentPathsSync: o,
    isSrcSubdir: s,
    areIdentical: u
  }, un;
}
var cn, qa;
function mc() {
  if (qa) return cn;
  qa = 1;
  const t = Ve(), e = Se, a = st().mkdirs, c = Pt().pathExists, d = xl().utimesMillis, l = /* @__PURE__ */ jt();
  function n(U, x, k, N) {
    typeof k == "function" && !N ? (N = k, k = {}) : typeof k == "function" && (k = { filter: k }), N = N || function() {
    }, k = k || {}, k.clobber = "clobber" in k ? !!k.clobber : !0, k.overwrite = "overwrite" in k ? !!k.overwrite : k.clobber, k.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0001"
    ), l.checkPaths(U, x, "copy", k, (P, F) => {
      if (P) return N(P);
      const { srcStat: $, destStat: J } = F;
      l.checkParentPaths(U, $, x, "copy", (W) => W ? N(W) : k.filter ? o(h, J, U, x, k, N) : h(J, U, x, k, N));
    });
  }
  function h(U, x, k, N, P) {
    const F = e.dirname(k);
    c(F, ($, J) => {
      if ($) return P($);
      if (J) return s(U, x, k, N, P);
      a(F, (W) => W ? P(W) : s(U, x, k, N, P));
    });
  }
  function o(U, x, k, N, P, F) {
    Promise.resolve(P.filter(k, N)).then(($) => $ ? U(x, k, N, P, F) : F(), ($) => F($));
  }
  function u(U, x, k, N, P) {
    return N.filter ? o(s, U, x, k, N, P) : s(U, x, k, N, P);
  }
  function s(U, x, k, N, P) {
    (N.dereference ? t.stat : t.lstat)(x, ($, J) => $ ? P($) : J.isDirectory() ? D(J, U, x, k, N, P) : J.isFile() || J.isCharacterDevice() || J.isBlockDevice() ? f(J, U, x, k, N, P) : J.isSymbolicLink() ? v(U, x, k, N, P) : J.isSocket() ? P(new Error(`Cannot copy a socket file: ${x}`)) : J.isFIFO() ? P(new Error(`Cannot copy a FIFO pipe: ${x}`)) : P(new Error(`Unknown file: ${x}`)));
  }
  function f(U, x, k, N, P, F) {
    return x ? i(U, k, N, P, F) : g(U, k, N, P, F);
  }
  function i(U, x, k, N, P) {
    if (N.overwrite)
      t.unlink(k, (F) => F ? P(F) : g(U, x, k, N, P));
    else return N.errorOnExist ? P(new Error(`'${k}' already exists`)) : P();
  }
  function g(U, x, k, N, P) {
    t.copyFile(x, k, (F) => F ? P(F) : N.preserveTimestamps ? E(U.mode, x, k, P) : b(k, U.mode, P));
  }
  function E(U, x, k, N) {
    return y(U) ? p(k, U, (P) => P ? N(P) : T(U, x, k, N)) : T(U, x, k, N);
  }
  function y(U) {
    return (U & 128) === 0;
  }
  function p(U, x, k) {
    return b(U, x | 128, k);
  }
  function T(U, x, k, N) {
    O(x, k, (P) => P ? N(P) : b(k, U, N));
  }
  function b(U, x, k) {
    return t.chmod(U, x, k);
  }
  function O(U, x, k) {
    t.stat(U, (N, P) => N ? k(N) : d(x, P.atime, P.mtime, k));
  }
  function D(U, x, k, N, P, F) {
    return x ? A(k, N, P, F) : q(U.mode, k, N, P, F);
  }
  function q(U, x, k, N, P) {
    t.mkdir(k, (F) => {
      if (F) return P(F);
      A(x, k, N, ($) => $ ? P($) : b(k, U, P));
    });
  }
  function A(U, x, k, N) {
    t.readdir(U, (P, F) => P ? N(P) : S(F, U, x, k, N));
  }
  function S(U, x, k, N, P) {
    const F = U.pop();
    return F ? R(U, F, x, k, N, P) : P();
  }
  function R(U, x, k, N, P, F) {
    const $ = e.join(k, x), J = e.join(N, x);
    l.checkPaths($, J, "copy", P, (W, ne) => {
      if (W) return F(W);
      const { destStat: ce } = ne;
      u(ce, $, J, P, (ue) => ue ? F(ue) : S(U, k, N, P, F));
    });
  }
  function v(U, x, k, N, P) {
    t.readlink(x, (F, $) => {
      if (F) return P(F);
      if (N.dereference && ($ = e.resolve(process.cwd(), $)), U)
        t.readlink(k, (J, W) => J ? J.code === "EINVAL" || J.code === "UNKNOWN" ? t.symlink($, k, P) : P(J) : (N.dereference && (W = e.resolve(process.cwd(), W)), l.isSrcSubdir($, W) ? P(new Error(`Cannot copy '${$}' to a subdirectory of itself, '${W}'.`)) : U.isDirectory() && l.isSrcSubdir(W, $) ? P(new Error(`Cannot overwrite '${W}' with '${$}'.`)) : M($, k, P)));
      else
        return t.symlink($, k, P);
    });
  }
  function M(U, x, k) {
    t.unlink(x, (N) => N ? k(N) : t.symlink(U, x, k));
  }
  return cn = n, cn;
}
var fn, Ba;
function Ec() {
  if (Ba) return fn;
  Ba = 1;
  const t = Ve(), e = Se, a = st().mkdirsSync, c = xl().utimesMillisSync, d = /* @__PURE__ */ jt();
  function l(S, R, v) {
    typeof v == "function" && (v = { filter: v }), v = v || {}, v.clobber = "clobber" in v ? !!v.clobber : !0, v.overwrite = "overwrite" in v ? !!v.overwrite : v.clobber, v.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0002"
    );
    const { srcStat: M, destStat: U } = d.checkPathsSync(S, R, "copy", v);
    return d.checkParentPathsSync(S, M, R, "copy"), n(U, S, R, v);
  }
  function n(S, R, v, M) {
    if (M.filter && !M.filter(R, v)) return;
    const U = e.dirname(v);
    return t.existsSync(U) || a(U), o(S, R, v, M);
  }
  function h(S, R, v, M) {
    if (!(M.filter && !M.filter(R, v)))
      return o(S, R, v, M);
  }
  function o(S, R, v, M) {
    const x = (M.dereference ? t.statSync : t.lstatSync)(R);
    if (x.isDirectory()) return T(x, S, R, v, M);
    if (x.isFile() || x.isCharacterDevice() || x.isBlockDevice()) return u(x, S, R, v, M);
    if (x.isSymbolicLink()) return q(S, R, v, M);
    throw x.isSocket() ? new Error(`Cannot copy a socket file: ${R}`) : x.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${R}`) : new Error(`Unknown file: ${R}`);
  }
  function u(S, R, v, M, U) {
    return R ? s(S, v, M, U) : f(S, v, M, U);
  }
  function s(S, R, v, M) {
    if (M.overwrite)
      return t.unlinkSync(v), f(S, R, v, M);
    if (M.errorOnExist)
      throw new Error(`'${v}' already exists`);
  }
  function f(S, R, v, M) {
    return t.copyFileSync(R, v), M.preserveTimestamps && i(S.mode, R, v), y(v, S.mode);
  }
  function i(S, R, v) {
    return g(S) && E(v, S), p(R, v);
  }
  function g(S) {
    return (S & 128) === 0;
  }
  function E(S, R) {
    return y(S, R | 128);
  }
  function y(S, R) {
    return t.chmodSync(S, R);
  }
  function p(S, R) {
    const v = t.statSync(S);
    return c(R, v.atime, v.mtime);
  }
  function T(S, R, v, M, U) {
    return R ? O(v, M, U) : b(S.mode, v, M, U);
  }
  function b(S, R, v, M) {
    return t.mkdirSync(v), O(R, v, M), y(v, S);
  }
  function O(S, R, v) {
    t.readdirSync(S).forEach((M) => D(M, S, R, v));
  }
  function D(S, R, v, M) {
    const U = e.join(R, S), x = e.join(v, S), { destStat: k } = d.checkPathsSync(U, x, "copy", M);
    return h(k, U, x, M);
  }
  function q(S, R, v, M) {
    let U = t.readlinkSync(R);
    if (M.dereference && (U = e.resolve(process.cwd(), U)), S) {
      let x;
      try {
        x = t.readlinkSync(v);
      } catch (k) {
        if (k.code === "EINVAL" || k.code === "UNKNOWN") return t.symlinkSync(U, v);
        throw k;
      }
      if (M.dereference && (x = e.resolve(process.cwd(), x)), d.isSrcSubdir(U, x))
        throw new Error(`Cannot copy '${U}' to a subdirectory of itself, '${x}'.`);
      if (t.statSync(v).isDirectory() && d.isSrcSubdir(x, U))
        throw new Error(`Cannot overwrite '${x}' with '${U}'.`);
      return A(U, v);
    } else
      return t.symlinkSync(U, v);
  }
  function A(S, R) {
    return t.unlinkSync(R), t.symlinkSync(S, R);
  }
  return fn = l, fn;
}
var dn, ja;
function ra() {
  if (ja) return dn;
  ja = 1;
  const t = Ke().fromCallback;
  return dn = {
    copy: t(/* @__PURE__ */ mc()),
    copySync: /* @__PURE__ */ Ec()
  }, dn;
}
var hn, Ha;
function yc() {
  if (Ha) return hn;
  Ha = 1;
  const t = Ve(), e = Se, a = Il, c = process.platform === "win32";
  function d(E) {
    [
      "unlink",
      "chmod",
      "stat",
      "lstat",
      "rmdir",
      "readdir"
    ].forEach((p) => {
      E[p] = E[p] || t[p], p = p + "Sync", E[p] = E[p] || t[p];
    }), E.maxBusyTries = E.maxBusyTries || 3;
  }
  function l(E, y, p) {
    let T = 0;
    typeof y == "function" && (p = y, y = {}), a(E, "rimraf: missing path"), a.strictEqual(typeof E, "string", "rimraf: path should be a string"), a.strictEqual(typeof p, "function", "rimraf: callback function required"), a(y, "rimraf: invalid options argument provided"), a.strictEqual(typeof y, "object", "rimraf: options should be object"), d(y), n(E, y, function b(O) {
      if (O) {
        if ((O.code === "EBUSY" || O.code === "ENOTEMPTY" || O.code === "EPERM") && T < y.maxBusyTries) {
          T++;
          const D = T * 100;
          return setTimeout(() => n(E, y, b), D);
        }
        O.code === "ENOENT" && (O = null);
      }
      p(O);
    });
  }
  function n(E, y, p) {
    a(E), a(y), a(typeof p == "function"), y.lstat(E, (T, b) => {
      if (T && T.code === "ENOENT")
        return p(null);
      if (T && T.code === "EPERM" && c)
        return h(E, y, T, p);
      if (b && b.isDirectory())
        return u(E, y, T, p);
      y.unlink(E, (O) => {
        if (O) {
          if (O.code === "ENOENT")
            return p(null);
          if (O.code === "EPERM")
            return c ? h(E, y, O, p) : u(E, y, O, p);
          if (O.code === "EISDIR")
            return u(E, y, O, p);
        }
        return p(O);
      });
    });
  }
  function h(E, y, p, T) {
    a(E), a(y), a(typeof T == "function"), y.chmod(E, 438, (b) => {
      b ? T(b.code === "ENOENT" ? null : p) : y.stat(E, (O, D) => {
        O ? T(O.code === "ENOENT" ? null : p) : D.isDirectory() ? u(E, y, p, T) : y.unlink(E, T);
      });
    });
  }
  function o(E, y, p) {
    let T;
    a(E), a(y);
    try {
      y.chmodSync(E, 438);
    } catch (b) {
      if (b.code === "ENOENT")
        return;
      throw p;
    }
    try {
      T = y.statSync(E);
    } catch (b) {
      if (b.code === "ENOENT")
        return;
      throw p;
    }
    T.isDirectory() ? i(E, y, p) : y.unlinkSync(E);
  }
  function u(E, y, p, T) {
    a(E), a(y), a(typeof T == "function"), y.rmdir(E, (b) => {
      b && (b.code === "ENOTEMPTY" || b.code === "EEXIST" || b.code === "EPERM") ? s(E, y, T) : b && b.code === "ENOTDIR" ? T(p) : T(b);
    });
  }
  function s(E, y, p) {
    a(E), a(y), a(typeof p == "function"), y.readdir(E, (T, b) => {
      if (T) return p(T);
      let O = b.length, D;
      if (O === 0) return y.rmdir(E, p);
      b.forEach((q) => {
        l(e.join(E, q), y, (A) => {
          if (!D) {
            if (A) return p(D = A);
            --O === 0 && y.rmdir(E, p);
          }
        });
      });
    });
  }
  function f(E, y) {
    let p;
    y = y || {}, d(y), a(E, "rimraf: missing path"), a.strictEqual(typeof E, "string", "rimraf: path should be a string"), a(y, "rimraf: missing options"), a.strictEqual(typeof y, "object", "rimraf: options should be object");
    try {
      p = y.lstatSync(E);
    } catch (T) {
      if (T.code === "ENOENT")
        return;
      T.code === "EPERM" && c && o(E, y, T);
    }
    try {
      p && p.isDirectory() ? i(E, y, null) : y.unlinkSync(E);
    } catch (T) {
      if (T.code === "ENOENT")
        return;
      if (T.code === "EPERM")
        return c ? o(E, y, T) : i(E, y, T);
      if (T.code !== "EISDIR")
        throw T;
      i(E, y, T);
    }
  }
  function i(E, y, p) {
    a(E), a(y);
    try {
      y.rmdirSync(E);
    } catch (T) {
      if (T.code === "ENOTDIR")
        throw p;
      if (T.code === "ENOTEMPTY" || T.code === "EEXIST" || T.code === "EPERM")
        g(E, y);
      else if (T.code !== "ENOENT")
        throw T;
    }
  }
  function g(E, y) {
    if (a(E), a(y), y.readdirSync(E).forEach((p) => f(e.join(E, p), y)), c) {
      const p = Date.now();
      do
        try {
          return y.rmdirSync(E, y);
        } catch {
        }
      while (Date.now() - p < 500);
    } else
      return y.rmdirSync(E, y);
  }
  return hn = l, l.sync = f, hn;
}
var pn, Ga;
function Hr() {
  if (Ga) return pn;
  Ga = 1;
  const t = Ve(), e = Ke().fromCallback, a = /* @__PURE__ */ yc();
  function c(l, n) {
    if (t.rm) return t.rm(l, { recursive: !0, force: !0 }, n);
    a(l, n);
  }
  function d(l) {
    if (t.rmSync) return t.rmSync(l, { recursive: !0, force: !0 });
    a.sync(l);
  }
  return pn = {
    remove: e(c),
    removeSync: d
  }, pn;
}
var gn, Wa;
function vc() {
  if (Wa) return gn;
  Wa = 1;
  const t = Ke().fromPromise, e = /* @__PURE__ */ Bt(), a = Se, c = /* @__PURE__ */ st(), d = /* @__PURE__ */ Hr(), l = t(async function(o) {
    let u;
    try {
      u = await e.readdir(o);
    } catch {
      return c.mkdirs(o);
    }
    return Promise.all(u.map((s) => d.remove(a.join(o, s))));
  });
  function n(h) {
    let o;
    try {
      o = e.readdirSync(h);
    } catch {
      return c.mkdirsSync(h);
    }
    o.forEach((u) => {
      u = a.join(h, u), d.removeSync(u);
    });
  }
  return gn = {
    emptyDirSync: n,
    emptydirSync: n,
    emptyDir: l,
    emptydir: l
  }, gn;
}
var mn, za;
function wc() {
  if (za) return mn;
  za = 1;
  const t = Ke().fromCallback, e = Se, a = Ve(), c = /* @__PURE__ */ st();
  function d(n, h) {
    function o() {
      a.writeFile(n, "", (u) => {
        if (u) return h(u);
        h();
      });
    }
    a.stat(n, (u, s) => {
      if (!u && s.isFile()) return h();
      const f = e.dirname(n);
      a.stat(f, (i, g) => {
        if (i)
          return i.code === "ENOENT" ? c.mkdirs(f, (E) => {
            if (E) return h(E);
            o();
          }) : h(i);
        g.isDirectory() ? o() : a.readdir(f, (E) => {
          if (E) return h(E);
        });
      });
    });
  }
  function l(n) {
    let h;
    try {
      h = a.statSync(n);
    } catch {
    }
    if (h && h.isFile()) return;
    const o = e.dirname(n);
    try {
      a.statSync(o).isDirectory() || a.readdirSync(o);
    } catch (u) {
      if (u && u.code === "ENOENT") c.mkdirsSync(o);
      else throw u;
    }
    a.writeFileSync(n, "");
  }
  return mn = {
    createFile: t(d),
    createFileSync: l
  }, mn;
}
var En, Ya;
function _c() {
  if (Ya) return En;
  Ya = 1;
  const t = Ke().fromCallback, e = Se, a = Ve(), c = /* @__PURE__ */ st(), d = Pt().pathExists, { areIdentical: l } = /* @__PURE__ */ jt();
  function n(o, u, s) {
    function f(i, g) {
      a.link(i, g, (E) => {
        if (E) return s(E);
        s(null);
      });
    }
    a.lstat(u, (i, g) => {
      a.lstat(o, (E, y) => {
        if (E)
          return E.message = E.message.replace("lstat", "ensureLink"), s(E);
        if (g && l(y, g)) return s(null);
        const p = e.dirname(u);
        d(p, (T, b) => {
          if (T) return s(T);
          if (b) return f(o, u);
          c.mkdirs(p, (O) => {
            if (O) return s(O);
            f(o, u);
          });
        });
      });
    });
  }
  function h(o, u) {
    let s;
    try {
      s = a.lstatSync(u);
    } catch {
    }
    try {
      const g = a.lstatSync(o);
      if (s && l(g, s)) return;
    } catch (g) {
      throw g.message = g.message.replace("lstat", "ensureLink"), g;
    }
    const f = e.dirname(u);
    return a.existsSync(f) || c.mkdirsSync(f), a.linkSync(o, u);
  }
  return En = {
    createLink: t(n),
    createLinkSync: h
  }, En;
}
var yn, Va;
function Tc() {
  if (Va) return yn;
  Va = 1;
  const t = Se, e = Ve(), a = Pt().pathExists;
  function c(l, n, h) {
    if (t.isAbsolute(l))
      return e.lstat(l, (o) => o ? (o.message = o.message.replace("lstat", "ensureSymlink"), h(o)) : h(null, {
        toCwd: l,
        toDst: l
      }));
    {
      const o = t.dirname(n), u = t.join(o, l);
      return a(u, (s, f) => s ? h(s) : f ? h(null, {
        toCwd: u,
        toDst: l
      }) : e.lstat(l, (i) => i ? (i.message = i.message.replace("lstat", "ensureSymlink"), h(i)) : h(null, {
        toCwd: l,
        toDst: t.relative(o, l)
      })));
    }
  }
  function d(l, n) {
    let h;
    if (t.isAbsolute(l)) {
      if (h = e.existsSync(l), !h) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: l,
        toDst: l
      };
    } else {
      const o = t.dirname(n), u = t.join(o, l);
      if (h = e.existsSync(u), h)
        return {
          toCwd: u,
          toDst: l
        };
      if (h = e.existsSync(l), !h) throw new Error("relative srcpath does not exist");
      return {
        toCwd: l,
        toDst: t.relative(o, l)
      };
    }
  }
  return yn = {
    symlinkPaths: c,
    symlinkPathsSync: d
  }, yn;
}
var vn, Xa;
function Sc() {
  if (Xa) return vn;
  Xa = 1;
  const t = Ve();
  function e(c, d, l) {
    if (l = typeof d == "function" ? d : l, d = typeof d == "function" ? !1 : d, d) return l(null, d);
    t.lstat(c, (n, h) => {
      if (n) return l(null, "file");
      d = h && h.isDirectory() ? "dir" : "file", l(null, d);
    });
  }
  function a(c, d) {
    let l;
    if (d) return d;
    try {
      l = t.lstatSync(c);
    } catch {
      return "file";
    }
    return l && l.isDirectory() ? "dir" : "file";
  }
  return vn = {
    symlinkType: e,
    symlinkTypeSync: a
  }, vn;
}
var wn, Ka;
function Rc() {
  if (Ka) return wn;
  Ka = 1;
  const t = Ke().fromCallback, e = Se, a = /* @__PURE__ */ Bt(), c = /* @__PURE__ */ st(), d = c.mkdirs, l = c.mkdirsSync, n = /* @__PURE__ */ Tc(), h = n.symlinkPaths, o = n.symlinkPathsSync, u = /* @__PURE__ */ Sc(), s = u.symlinkType, f = u.symlinkTypeSync, i = Pt().pathExists, { areIdentical: g } = /* @__PURE__ */ jt();
  function E(T, b, O, D) {
    D = typeof O == "function" ? O : D, O = typeof O == "function" ? !1 : O, a.lstat(b, (q, A) => {
      !q && A.isSymbolicLink() ? Promise.all([
        a.stat(T),
        a.stat(b)
      ]).then(([S, R]) => {
        if (g(S, R)) return D(null);
        y(T, b, O, D);
      }) : y(T, b, O, D);
    });
  }
  function y(T, b, O, D) {
    h(T, b, (q, A) => {
      if (q) return D(q);
      T = A.toDst, s(A.toCwd, O, (S, R) => {
        if (S) return D(S);
        const v = e.dirname(b);
        i(v, (M, U) => {
          if (M) return D(M);
          if (U) return a.symlink(T, b, R, D);
          d(v, (x) => {
            if (x) return D(x);
            a.symlink(T, b, R, D);
          });
        });
      });
    });
  }
  function p(T, b, O) {
    let D;
    try {
      D = a.lstatSync(b);
    } catch {
    }
    if (D && D.isSymbolicLink()) {
      const R = a.statSync(T), v = a.statSync(b);
      if (g(R, v)) return;
    }
    const q = o(T, b);
    T = q.toDst, O = f(q.toCwd, O);
    const A = e.dirname(b);
    return a.existsSync(A) || l(A), a.symlinkSync(T, b, O);
  }
  return wn = {
    createSymlink: t(E),
    createSymlinkSync: p
  }, wn;
}
var _n, Ja;
function bc() {
  if (Ja) return _n;
  Ja = 1;
  const { createFile: t, createFileSync: e } = /* @__PURE__ */ wc(), { createLink: a, createLinkSync: c } = /* @__PURE__ */ _c(), { createSymlink: d, createSymlinkSync: l } = /* @__PURE__ */ Rc();
  return _n = {
    // file
    createFile: t,
    createFileSync: e,
    ensureFile: t,
    ensureFileSync: e,
    // link
    createLink: a,
    createLinkSync: c,
    ensureLink: a,
    ensureLinkSync: c,
    // symlink
    createSymlink: d,
    createSymlinkSync: l,
    ensureSymlink: d,
    ensureSymlinkSync: l
  }, _n;
}
var Tn, Qa;
function na() {
  if (Qa) return Tn;
  Qa = 1;
  function t(a, { EOL: c = `
`, finalEOL: d = !0, replacer: l = null, spaces: n } = {}) {
    const h = d ? c : "";
    return JSON.stringify(a, l, n).replace(/\n/g, c) + h;
  }
  function e(a) {
    return Buffer.isBuffer(a) && (a = a.toString("utf8")), a.replace(/^\uFEFF/, "");
  }
  return Tn = { stringify: t, stripBom: e }, Tn;
}
var Sn, Za;
function Ac() {
  if (Za) return Sn;
  Za = 1;
  let t;
  try {
    t = Ve();
  } catch {
    t = xe;
  }
  const e = Ke(), { stringify: a, stripBom: c } = na();
  async function d(f, i = {}) {
    typeof i == "string" && (i = { encoding: i });
    const g = i.fs || t, E = "throws" in i ? i.throws : !0;
    let y = await e.fromCallback(g.readFile)(f, i);
    y = c(y);
    let p;
    try {
      p = JSON.parse(y, i ? i.reviver : null);
    } catch (T) {
      if (E)
        throw T.message = `${f}: ${T.message}`, T;
      return null;
    }
    return p;
  }
  const l = e.fromPromise(d);
  function n(f, i = {}) {
    typeof i == "string" && (i = { encoding: i });
    const g = i.fs || t, E = "throws" in i ? i.throws : !0;
    try {
      let y = g.readFileSync(f, i);
      return y = c(y), JSON.parse(y, i.reviver);
    } catch (y) {
      if (E)
        throw y.message = `${f}: ${y.message}`, y;
      return null;
    }
  }
  async function h(f, i, g = {}) {
    const E = g.fs || t, y = a(i, g);
    await e.fromCallback(E.writeFile)(f, y, g);
  }
  const o = e.fromPromise(h);
  function u(f, i, g = {}) {
    const E = g.fs || t, y = a(i, g);
    return E.writeFileSync(f, y, g);
  }
  return Sn = {
    readFile: l,
    readFileSync: n,
    writeFile: o,
    writeFileSync: u
  }, Sn;
}
var Rn, eo;
function Cc() {
  if (eo) return Rn;
  eo = 1;
  const t = Ac();
  return Rn = {
    // jsonfile exports
    readJson: t.readFile,
    readJsonSync: t.readFileSync,
    writeJson: t.writeFile,
    writeJsonSync: t.writeFileSync
  }, Rn;
}
var bn, to;
function ia() {
  if (to) return bn;
  to = 1;
  const t = Ke().fromCallback, e = Ve(), a = Se, c = /* @__PURE__ */ st(), d = Pt().pathExists;
  function l(h, o, u, s) {
    typeof u == "function" && (s = u, u = "utf8");
    const f = a.dirname(h);
    d(f, (i, g) => {
      if (i) return s(i);
      if (g) return e.writeFile(h, o, u, s);
      c.mkdirs(f, (E) => {
        if (E) return s(E);
        e.writeFile(h, o, u, s);
      });
    });
  }
  function n(h, ...o) {
    const u = a.dirname(h);
    if (e.existsSync(u))
      return e.writeFileSync(h, ...o);
    c.mkdirsSync(u), e.writeFileSync(h, ...o);
  }
  return bn = {
    outputFile: t(l),
    outputFileSync: n
  }, bn;
}
var An, ro;
function Oc() {
  if (ro) return An;
  ro = 1;
  const { stringify: t } = na(), { outputFile: e } = /* @__PURE__ */ ia();
  async function a(c, d, l = {}) {
    const n = t(d, l);
    await e(c, n, l);
  }
  return An = a, An;
}
var Cn, no;
function Dc() {
  if (no) return Cn;
  no = 1;
  const { stringify: t } = na(), { outputFileSync: e } = /* @__PURE__ */ ia();
  function a(c, d, l) {
    const n = t(d, l);
    e(c, n, l);
  }
  return Cn = a, Cn;
}
var On, io;
function Pc() {
  if (io) return On;
  io = 1;
  const t = Ke().fromPromise, e = /* @__PURE__ */ Cc();
  return e.outputJson = t(/* @__PURE__ */ Oc()), e.outputJsonSync = /* @__PURE__ */ Dc(), e.outputJSON = e.outputJson, e.outputJSONSync = e.outputJsonSync, e.writeJSON = e.writeJson, e.writeJSONSync = e.writeJsonSync, e.readJSON = e.readJson, e.readJSONSync = e.readJsonSync, On = e, On;
}
var Dn, ao;
function Ic() {
  if (ao) return Dn;
  ao = 1;
  const t = Ve(), e = Se, a = ra().copy, c = Hr().remove, d = st().mkdirp, l = Pt().pathExists, n = /* @__PURE__ */ jt();
  function h(i, g, E, y) {
    typeof E == "function" && (y = E, E = {}), E = E || {};
    const p = E.overwrite || E.clobber || !1;
    n.checkPaths(i, g, "move", E, (T, b) => {
      if (T) return y(T);
      const { srcStat: O, isChangingCase: D = !1 } = b;
      n.checkParentPaths(i, O, g, "move", (q) => {
        if (q) return y(q);
        if (o(g)) return u(i, g, p, D, y);
        d(e.dirname(g), (A) => A ? y(A) : u(i, g, p, D, y));
      });
    });
  }
  function o(i) {
    const g = e.dirname(i);
    return e.parse(g).root === g;
  }
  function u(i, g, E, y, p) {
    if (y) return s(i, g, E, p);
    if (E)
      return c(g, (T) => T ? p(T) : s(i, g, E, p));
    l(g, (T, b) => T ? p(T) : b ? p(new Error("dest already exists.")) : s(i, g, E, p));
  }
  function s(i, g, E, y) {
    t.rename(i, g, (p) => p ? p.code !== "EXDEV" ? y(p) : f(i, g, E, y) : y());
  }
  function f(i, g, E, y) {
    a(i, g, {
      overwrite: E,
      errorOnExist: !0
    }, (T) => T ? y(T) : c(i, y));
  }
  return Dn = h, Dn;
}
var Pn, oo;
function Nc() {
  if (oo) return Pn;
  oo = 1;
  const t = Ve(), e = Se, a = ra().copySync, c = Hr().removeSync, d = st().mkdirpSync, l = /* @__PURE__ */ jt();
  function n(f, i, g) {
    g = g || {};
    const E = g.overwrite || g.clobber || !1, { srcStat: y, isChangingCase: p = !1 } = l.checkPathsSync(f, i, "move", g);
    return l.checkParentPathsSync(f, y, i, "move"), h(i) || d(e.dirname(i)), o(f, i, E, p);
  }
  function h(f) {
    const i = e.dirname(f);
    return e.parse(i).root === i;
  }
  function o(f, i, g, E) {
    if (E) return u(f, i, g);
    if (g)
      return c(i), u(f, i, g);
    if (t.existsSync(i)) throw new Error("dest already exists.");
    return u(f, i, g);
  }
  function u(f, i, g) {
    try {
      t.renameSync(f, i);
    } catch (E) {
      if (E.code !== "EXDEV") throw E;
      return s(f, i, g);
    }
  }
  function s(f, i, g) {
    return a(f, i, {
      overwrite: g,
      errorOnExist: !0
    }), c(f);
  }
  return Pn = n, Pn;
}
var In, so;
function Fc() {
  if (so) return In;
  so = 1;
  const t = Ke().fromCallback;
  return In = {
    move: t(/* @__PURE__ */ Ic()),
    moveSync: /* @__PURE__ */ Nc()
  }, In;
}
var Nn, lo;
function Et() {
  return lo || (lo = 1, Nn = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ Bt(),
    // Export extra methods:
    .../* @__PURE__ */ ra(),
    .../* @__PURE__ */ vc(),
    .../* @__PURE__ */ bc(),
    .../* @__PURE__ */ Pc(),
    .../* @__PURE__ */ st(),
    .../* @__PURE__ */ Fc(),
    .../* @__PURE__ */ ia(),
    .../* @__PURE__ */ Pt(),
    .../* @__PURE__ */ Hr()
  }), Nn;
}
var Yt = {}, bt = {}, Fn = {}, At = {}, uo;
function aa() {
  if (uo) return At;
  uo = 1, Object.defineProperty(At, "__esModule", { value: !0 }), At.CancellationError = At.CancellationToken = void 0;
  const t = Nl;
  let e = class extends t.EventEmitter {
    get cancelled() {
      return this._cancelled || this._parent != null && this._parent.cancelled;
    }
    set parent(d) {
      this.removeParentCancelHandler(), this._parent = d, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
    }
    // babel cannot compile ... correctly for super calls
    constructor(d) {
      super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, d != null && (this.parent = d);
    }
    cancel() {
      this._cancelled = !0, this.emit("cancel");
    }
    onCancel(d) {
      this.cancelled ? d() : this.once("cancel", d);
    }
    createPromise(d) {
      if (this.cancelled)
        return Promise.reject(new a());
      const l = () => {
        if (n != null)
          try {
            this.removeListener("cancel", n), n = null;
          } catch {
          }
      };
      let n = null;
      return new Promise((h, o) => {
        let u = null;
        if (n = () => {
          try {
            u != null && (u(), u = null);
          } finally {
            o(new a());
          }
        }, this.cancelled) {
          n();
          return;
        }
        this.onCancel(n), d(h, o, (s) => {
          u = s;
        });
      }).then((h) => (l(), h)).catch((h) => {
        throw l(), h;
      });
    }
    removeParentCancelHandler() {
      const d = this._parent;
      d != null && this.parentCancelHandler != null && (d.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
    }
    dispose() {
      try {
        this.removeParentCancelHandler();
      } finally {
        this.removeAllListeners(), this._parent = null;
      }
    }
  };
  At.CancellationToken = e;
  class a extends Error {
    constructor() {
      super("cancelled");
    }
  }
  return At.CancellationError = a, At;
}
var Pr = {}, co;
function Gr() {
  if (co) return Pr;
  co = 1, Object.defineProperty(Pr, "__esModule", { value: !0 }), Pr.newError = t;
  function t(e, a) {
    const c = new Error(e);
    return c.code = a, c;
  }
  return Pr;
}
var Ge = {}, Ir = { exports: {} }, Nr = { exports: {} }, Ln, fo;
function Lc() {
  if (fo) return Ln;
  fo = 1;
  var t = 1e3, e = t * 60, a = e * 60, c = a * 24, d = c * 7, l = c * 365.25;
  Ln = function(s, f) {
    f = f || {};
    var i = typeof s;
    if (i === "string" && s.length > 0)
      return n(s);
    if (i === "number" && isFinite(s))
      return f.long ? o(s) : h(s);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(s)
    );
  };
  function n(s) {
    if (s = String(s), !(s.length > 100)) {
      var f = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        s
      );
      if (f) {
        var i = parseFloat(f[1]), g = (f[2] || "ms").toLowerCase();
        switch (g) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return i * l;
          case "weeks":
          case "week":
          case "w":
            return i * d;
          case "days":
          case "day":
          case "d":
            return i * c;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return i * a;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return i * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return i * t;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return i;
          default:
            return;
        }
      }
    }
  }
  function h(s) {
    var f = Math.abs(s);
    return f >= c ? Math.round(s / c) + "d" : f >= a ? Math.round(s / a) + "h" : f >= e ? Math.round(s / e) + "m" : f >= t ? Math.round(s / t) + "s" : s + "ms";
  }
  function o(s) {
    var f = Math.abs(s);
    return f >= c ? u(s, f, c, "day") : f >= a ? u(s, f, a, "hour") : f >= e ? u(s, f, e, "minute") : f >= t ? u(s, f, t, "second") : s + " ms";
  }
  function u(s, f, i, g) {
    var E = f >= i * 1.5;
    return Math.round(s / i) + " " + g + (E ? "s" : "");
  }
  return Ln;
}
var xn, ho;
function Ul() {
  if (ho) return xn;
  ho = 1;
  function t(e) {
    c.debug = c, c.default = c, c.coerce = u, c.disable = h, c.enable = l, c.enabled = o, c.humanize = Lc(), c.destroy = s, Object.keys(e).forEach((f) => {
      c[f] = e[f];
    }), c.names = [], c.skips = [], c.formatters = {};
    function a(f) {
      let i = 0;
      for (let g = 0; g < f.length; g++)
        i = (i << 5) - i + f.charCodeAt(g), i |= 0;
      return c.colors[Math.abs(i) % c.colors.length];
    }
    c.selectColor = a;
    function c(f) {
      let i, g = null, E, y;
      function p(...T) {
        if (!p.enabled)
          return;
        const b = p, O = Number(/* @__PURE__ */ new Date()), D = O - (i || O);
        b.diff = D, b.prev = i, b.curr = O, i = O, T[0] = c.coerce(T[0]), typeof T[0] != "string" && T.unshift("%O");
        let q = 0;
        T[0] = T[0].replace(/%([a-zA-Z%])/g, (S, R) => {
          if (S === "%%")
            return "%";
          q++;
          const v = c.formatters[R];
          if (typeof v == "function") {
            const M = T[q];
            S = v.call(b, M), T.splice(q, 1), q--;
          }
          return S;
        }), c.formatArgs.call(b, T), (b.log || c.log).apply(b, T);
      }
      return p.namespace = f, p.useColors = c.useColors(), p.color = c.selectColor(f), p.extend = d, p.destroy = c.destroy, Object.defineProperty(p, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => g !== null ? g : (E !== c.namespaces && (E = c.namespaces, y = c.enabled(f)), y),
        set: (T) => {
          g = T;
        }
      }), typeof c.init == "function" && c.init(p), p;
    }
    function d(f, i) {
      const g = c(this.namespace + (typeof i > "u" ? ":" : i) + f);
      return g.log = this.log, g;
    }
    function l(f) {
      c.save(f), c.namespaces = f, c.names = [], c.skips = [];
      const i = (typeof f == "string" ? f : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const g of i)
        g[0] === "-" ? c.skips.push(g.slice(1)) : c.names.push(g);
    }
    function n(f, i) {
      let g = 0, E = 0, y = -1, p = 0;
      for (; g < f.length; )
        if (E < i.length && (i[E] === f[g] || i[E] === "*"))
          i[E] === "*" ? (y = E, p = g, E++) : (g++, E++);
        else if (y !== -1)
          E = y + 1, p++, g = p;
        else
          return !1;
      for (; E < i.length && i[E] === "*"; )
        E++;
      return E === i.length;
    }
    function h() {
      const f = [
        ...c.names,
        ...c.skips.map((i) => "-" + i)
      ].join(",");
      return c.enable(""), f;
    }
    function o(f) {
      for (const i of c.skips)
        if (n(f, i))
          return !1;
      for (const i of c.names)
        if (n(f, i))
          return !0;
      return !1;
    }
    function u(f) {
      return f instanceof Error ? f.stack || f.message : f;
    }
    function s() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return c.enable(c.load()), c;
  }
  return xn = t, xn;
}
var po;
function xc() {
  return po || (po = 1, function(t, e) {
    e.formatArgs = c, e.save = d, e.load = l, e.useColors = a, e.storage = n(), e.destroy = /* @__PURE__ */ (() => {
      let o = !1;
      return () => {
        o || (o = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), e.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function a() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let o;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (o = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(o[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function c(o) {
      if (o[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + o[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff), !this.useColors)
        return;
      const u = "color: " + this.color;
      o.splice(1, 0, u, "color: inherit");
      let s = 0, f = 0;
      o[0].replace(/%[a-zA-Z%]/g, (i) => {
        i !== "%%" && (s++, i === "%c" && (f = s));
      }), o.splice(f, 0, u);
    }
    e.log = console.debug || console.log || (() => {
    });
    function d(o) {
      try {
        o ? e.storage.setItem("debug", o) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function l() {
      let o;
      try {
        o = e.storage.getItem("debug") || e.storage.getItem("DEBUG");
      } catch {
      }
      return !o && typeof process < "u" && "env" in process && (o = process.env.DEBUG), o;
    }
    function n() {
      try {
        return localStorage;
      } catch {
      }
    }
    t.exports = Ul()(e);
    const { formatters: h } = t.exports;
    h.j = function(o) {
      try {
        return JSON.stringify(o);
      } catch (u) {
        return "[UnexpectedJSONParseError]: " + u.message;
      }
    };
  }(Nr, Nr.exports)), Nr.exports;
}
var Fr = { exports: {} }, Un, go;
function Uc() {
  return go || (go = 1, Un = (t, e = process.argv) => {
    const a = t.startsWith("-") ? "" : t.length === 1 ? "-" : "--", c = e.indexOf(a + t), d = e.indexOf("--");
    return c !== -1 && (d === -1 || c < d);
  }), Un;
}
var $n, mo;
function $c() {
  if (mo) return $n;
  mo = 1;
  const t = jr, e = Fl, a = Uc(), { env: c } = process;
  let d;
  a("no-color") || a("no-colors") || a("color=false") || a("color=never") ? d = 0 : (a("color") || a("colors") || a("color=true") || a("color=always")) && (d = 1);
  function l() {
    if ("FORCE_COLOR" in c)
      return c.FORCE_COLOR === "true" ? 1 : c.FORCE_COLOR === "false" ? 0 : c.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(c.FORCE_COLOR, 10), 3);
  }
  function n(u) {
    return u === 0 ? !1 : {
      level: u,
      hasBasic: !0,
      has256: u >= 2,
      has16m: u >= 3
    };
  }
  function h(u, { streamIsTTY: s, sniffFlags: f = !0 } = {}) {
    const i = l();
    i !== void 0 && (d = i);
    const g = f ? d : i;
    if (g === 0)
      return 0;
    if (f) {
      if (a("color=16m") || a("color=full") || a("color=truecolor"))
        return 3;
      if (a("color=256"))
        return 2;
    }
    if (u && !s && g === void 0)
      return 0;
    const E = g || 0;
    if (c.TERM === "dumb")
      return E;
    if (process.platform === "win32") {
      const y = t.release().split(".");
      return Number(y[0]) >= 10 && Number(y[2]) >= 10586 ? Number(y[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in c)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE", "DRONE"].some((y) => y in c) || c.CI_NAME === "codeship" ? 1 : E;
    if ("TEAMCITY_VERSION" in c)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(c.TEAMCITY_VERSION) ? 1 : 0;
    if (c.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in c) {
      const y = Number.parseInt((c.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (c.TERM_PROGRAM) {
        case "iTerm.app":
          return y >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(c.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(c.TERM) || "COLORTERM" in c ? 1 : E;
  }
  function o(u, s = {}) {
    const f = h(u, {
      streamIsTTY: u && u.isTTY,
      ...s
    });
    return n(f);
  }
  return $n = {
    supportsColor: o,
    stdout: o({ isTTY: e.isatty(1) }),
    stderr: o({ isTTY: e.isatty(2) })
  }, $n;
}
var Eo;
function kc() {
  return Eo || (Eo = 1, function(t, e) {
    const a = Fl, c = ta;
    e.init = s, e.log = h, e.formatArgs = l, e.save = o, e.load = u, e.useColors = d, e.destroy = c.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), e.colors = [6, 2, 3, 4, 5, 1];
    try {
      const i = $c();
      i && (i.stderr || i).level >= 2 && (e.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    e.inspectOpts = Object.keys(process.env).filter((i) => /^debug_/i.test(i)).reduce((i, g) => {
      const E = g.substring(6).toLowerCase().replace(/_([a-z])/g, (p, T) => T.toUpperCase());
      let y = process.env[g];
      return /^(yes|on|true|enabled)$/i.test(y) ? y = !0 : /^(no|off|false|disabled)$/i.test(y) ? y = !1 : y === "null" ? y = null : y = Number(y), i[E] = y, i;
    }, {});
    function d() {
      return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : a.isatty(process.stderr.fd);
    }
    function l(i) {
      const { namespace: g, useColors: E } = this;
      if (E) {
        const y = this.color, p = "\x1B[3" + (y < 8 ? y : "8;5;" + y), T = `  ${p};1m${g} \x1B[0m`;
        i[0] = T + i[0].split(`
`).join(`
` + T), i.push(p + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
      } else
        i[0] = n() + g + " " + i[0];
    }
    function n() {
      return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function h(...i) {
      return process.stderr.write(c.formatWithOptions(e.inspectOpts, ...i) + `
`);
    }
    function o(i) {
      i ? process.env.DEBUG = i : delete process.env.DEBUG;
    }
    function u() {
      return process.env.DEBUG;
    }
    function s(i) {
      i.inspectOpts = {};
      const g = Object.keys(e.inspectOpts);
      for (let E = 0; E < g.length; E++)
        i.inspectOpts[g[E]] = e.inspectOpts[g[E]];
    }
    t.exports = Ul()(e);
    const { formatters: f } = t.exports;
    f.o = function(i) {
      return this.inspectOpts.colors = this.useColors, c.inspect(i, this.inspectOpts).split(`
`).map((g) => g.trim()).join(" ");
    }, f.O = function(i) {
      return this.inspectOpts.colors = this.useColors, c.inspect(i, this.inspectOpts);
    };
  }(Fr, Fr.exports)), Fr.exports;
}
var yo;
function Mc() {
  return yo || (yo = 1, typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? Ir.exports = xc() : Ir.exports = kc()), Ir.exports;
}
var Vt = {}, vo;
function $l() {
  if (vo) return Vt;
  vo = 1, Object.defineProperty(Vt, "__esModule", { value: !0 }), Vt.ProgressCallbackTransform = void 0;
  const t = mr;
  let e = class extends t.Transform {
    constructor(c, d, l) {
      super(), this.total = c, this.cancellationToken = d, this.onProgress = l, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
    }
    _transform(c, d, l) {
      if (this.cancellationToken.cancelled) {
        l(new Error("cancelled"), null);
        return;
      }
      this.transferred += c.length, this.delta += c.length;
      const n = Date.now();
      n >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = n + 1e3, this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.total * 100,
        bytesPerSecond: Math.round(this.transferred / ((n - this.start) / 1e3))
      }), this.delta = 0), l(null, c);
    }
    _flush(c) {
      if (this.cancellationToken.cancelled) {
        c(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.total,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, c(null);
    }
  };
  return Vt.ProgressCallbackTransform = e, Vt;
}
var wo;
function qc() {
  if (wo) return Ge;
  wo = 1, Object.defineProperty(Ge, "__esModule", { value: !0 }), Ge.DigestTransform = Ge.HttpExecutor = Ge.HttpError = void 0, Ge.createHttpError = u, Ge.parseJson = i, Ge.configureRequestOptionsFromUrl = E, Ge.configureRequestUrl = y, Ge.safeGetHeader = b, Ge.configureRequestOptions = D, Ge.safeStringifyJson = q;
  const t = Er, e = Mc(), a = xe, c = mr, d = qt, l = aa(), n = Gr(), h = $l(), o = (0, e.default)("electron-builder");
  function u(A, S = null) {
    return new f(A.statusCode || -1, `${A.statusCode} ${A.statusMessage}` + (S == null ? "" : `
` + JSON.stringify(S, null, "  ")) + `
Headers: ` + q(A.headers), S);
  }
  const s = /* @__PURE__ */ new Map([
    [429, "Too many requests"],
    [400, "Bad request"],
    [403, "Forbidden"],
    [404, "Not found"],
    [405, "Method not allowed"],
    [406, "Not acceptable"],
    [408, "Request timeout"],
    [413, "Request entity too large"],
    [500, "Internal server error"],
    [502, "Bad gateway"],
    [503, "Service unavailable"],
    [504, "Gateway timeout"],
    [505, "HTTP version not supported"]
  ]);
  class f extends Error {
    constructor(S, R = `HTTP error: ${s.get(S) || S}`, v = null) {
      super(R), this.statusCode = S, this.description = v, this.name = "HttpError", this.code = `HTTP_ERROR_${S}`;
    }
    isServerError() {
      return this.statusCode >= 500 && this.statusCode <= 599;
    }
  }
  Ge.HttpError = f;
  function i(A) {
    return A.then((S) => S == null || S.length === 0 ? null : JSON.parse(S));
  }
  class g {
    constructor() {
      this.maxRedirects = 10;
    }
    request(S, R = new l.CancellationToken(), v) {
      D(S);
      const M = v == null ? void 0 : JSON.stringify(v), U = M ? Buffer.from(M) : void 0;
      if (U != null) {
        o(M);
        const { headers: x, ...k } = S;
        S = {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": U.length,
            ...x
          },
          ...k
        };
      }
      return this.doApiRequest(S, R, (x) => x.end(U));
    }
    doApiRequest(S, R, v, M = 0) {
      return o.enabled && o(`Request: ${q(S)}`), R.createPromise((U, x, k) => {
        const N = this.createRequest(S, (P) => {
          try {
            this.handleResponse(P, S, R, U, x, M, v);
          } catch (F) {
            x(F);
          }
        });
        this.addErrorAndTimeoutHandlers(N, x, S.timeout), this.addRedirectHandlers(N, S, x, M, (P) => {
          this.doApiRequest(P, R, v, M).then(U).catch(x);
        }), v(N, x), k(() => N.abort());
      });
    }
    // noinspection JSUnusedLocalSymbols
    // eslint-disable-next-line
    addRedirectHandlers(S, R, v, M, U) {
    }
    addErrorAndTimeoutHandlers(S, R, v = 60 * 1e3) {
      this.addTimeOutHandler(S, R, v), S.on("error", R), S.on("aborted", () => {
        R(new Error("Request has been aborted by the server"));
      });
    }
    handleResponse(S, R, v, M, U, x, k) {
      var N;
      if (o.enabled && o(`Response: ${S.statusCode} ${S.statusMessage}, request options: ${q(R)}`), S.statusCode === 404) {
        U(u(S, `method: ${R.method || "GET"} url: ${R.protocol || "https:"}//${R.hostname}${R.port ? `:${R.port}` : ""}${R.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
        return;
      } else if (S.statusCode === 204) {
        M();
        return;
      }
      const P = (N = S.statusCode) !== null && N !== void 0 ? N : 0, F = P >= 300 && P < 400, $ = b(S, "location");
      if (F && $ != null) {
        if (x > this.maxRedirects) {
          U(this.createMaxRedirectError());
          return;
        }
        this.doApiRequest(g.prepareRedirectUrlOptions($, R), v, k, x).then(M).catch(U);
        return;
      }
      S.setEncoding("utf8");
      let J = "";
      S.on("error", U), S.on("data", (W) => J += W), S.on("end", () => {
        try {
          if (S.statusCode != null && S.statusCode >= 400) {
            const W = b(S, "content-type"), ne = W != null && (Array.isArray(W) ? W.find((ce) => ce.includes("json")) != null : W.includes("json"));
            U(u(S, `method: ${R.method || "GET"} url: ${R.protocol || "https:"}//${R.hostname}${R.port ? `:${R.port}` : ""}${R.path}

          Data:
          ${ne ? JSON.stringify(JSON.parse(J)) : J}
          `));
          } else
            M(J.length === 0 ? null : J);
        } catch (W) {
          U(W);
        }
      });
    }
    async downloadToBuffer(S, R) {
      return await R.cancellationToken.createPromise((v, M, U) => {
        const x = [], k = {
          headers: R.headers || void 0,
          // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
          redirect: "manual"
        };
        y(S, k), D(k), this.doDownload(k, {
          destination: null,
          options: R,
          onCancel: U,
          callback: (N) => {
            N == null ? v(Buffer.concat(x)) : M(N);
          },
          responseHandler: (N, P) => {
            let F = 0;
            N.on("data", ($) => {
              if (F += $.length, F > 524288e3) {
                P(new Error("Maximum allowed size is 500 MB"));
                return;
              }
              x.push($);
            }), N.on("end", () => {
              P(null);
            });
          }
        }, 0);
      });
    }
    doDownload(S, R, v) {
      const M = this.createRequest(S, (U) => {
        if (U.statusCode >= 400) {
          R.callback(new Error(`Cannot download "${S.protocol || "https:"}//${S.hostname}${S.path}", status ${U.statusCode}: ${U.statusMessage}`));
          return;
        }
        U.on("error", R.callback);
        const x = b(U, "location");
        if (x != null) {
          v < this.maxRedirects ? this.doDownload(g.prepareRedirectUrlOptions(x, S), R, v++) : R.callback(this.createMaxRedirectError());
          return;
        }
        R.responseHandler == null ? O(R, U) : R.responseHandler(U, R.callback);
      });
      this.addErrorAndTimeoutHandlers(M, R.callback, S.timeout), this.addRedirectHandlers(M, S, R.callback, v, (U) => {
        this.doDownload(U, R, v++);
      }), M.end();
    }
    createMaxRedirectError() {
      return new Error(`Too many redirects (> ${this.maxRedirects})`);
    }
    addTimeOutHandler(S, R, v) {
      S.on("socket", (M) => {
        M.setTimeout(v, () => {
          S.abort(), R(new Error("Request timed out"));
        });
      });
    }
    static prepareRedirectUrlOptions(S, R) {
      const v = E(S, { ...R }), M = v.headers;
      if (M?.authorization) {
        const U = new d.URL(S);
        (U.hostname.endsWith(".amazonaws.com") || U.searchParams.has("X-Amz-Credential")) && delete M.authorization;
      }
      return v;
    }
    static retryOnServerError(S, R = 3) {
      for (let v = 0; ; v++)
        try {
          return S();
        } catch (M) {
          if (v < R && (M instanceof f && M.isServerError() || M.code === "EPIPE"))
            continue;
          throw M;
        }
    }
  }
  Ge.HttpExecutor = g;
  function E(A, S) {
    const R = D(S);
    return y(new d.URL(A), R), R;
  }
  function y(A, S) {
    S.protocol = A.protocol, S.hostname = A.hostname, A.port ? S.port = A.port : S.port && delete S.port, S.path = A.pathname + A.search;
  }
  class p extends c.Transform {
    // noinspection JSUnusedGlobalSymbols
    get actual() {
      return this._actual;
    }
    constructor(S, R = "sha512", v = "base64") {
      super(), this.expected = S, this.algorithm = R, this.encoding = v, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, t.createHash)(R);
    }
    // noinspection JSUnusedGlobalSymbols
    _transform(S, R, v) {
      this.digester.update(S), v(null, S);
    }
    // noinspection JSUnusedGlobalSymbols
    _flush(S) {
      if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
        try {
          this.validate();
        } catch (R) {
          S(R);
          return;
        }
      S(null);
    }
    validate() {
      if (this._actual == null)
        throw (0, n.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
      if (this._actual !== this.expected)
        throw (0, n.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
      return null;
    }
  }
  Ge.DigestTransform = p;
  function T(A, S, R) {
    return A != null && S != null && A !== S ? (R(new Error(`checksum mismatch: expected ${S} but got ${A} (X-Checksum-Sha2 header)`)), !1) : !0;
  }
  function b(A, S) {
    const R = A.headers[S];
    return R == null ? null : Array.isArray(R) ? R.length === 0 ? null : R[R.length - 1] : R;
  }
  function O(A, S) {
    if (!T(b(S, "X-Checksum-Sha2"), A.options.sha2, A.callback))
      return;
    const R = [];
    if (A.options.onProgress != null) {
      const x = b(S, "content-length");
      x != null && R.push(new h.ProgressCallbackTransform(parseInt(x, 10), A.options.cancellationToken, A.options.onProgress));
    }
    const v = A.options.sha512;
    v != null ? R.push(new p(v, "sha512", v.length === 128 && !v.includes("+") && !v.includes("Z") && !v.includes("=") ? "hex" : "base64")) : A.options.sha2 != null && R.push(new p(A.options.sha2, "sha256", "hex"));
    const M = (0, a.createWriteStream)(A.destination);
    R.push(M);
    let U = S;
    for (const x of R)
      x.on("error", (k) => {
        M.close(), A.options.cancellationToken.cancelled || A.callback(k);
      }), U = U.pipe(x);
    M.on("finish", () => {
      M.close(A.callback);
    });
  }
  function D(A, S, R) {
    R != null && (A.method = R), A.headers = { ...A.headers };
    const v = A.headers;
    return S != null && (v.authorization = S.startsWith("Basic") || S.startsWith("Bearer") ? S : `token ${S}`), v["User-Agent"] == null && (v["User-Agent"] = "electron-builder"), (R == null || R === "GET" || v["Cache-Control"] == null) && (v["Cache-Control"] = "no-cache"), A.protocol == null && process.versions.electron != null && (A.protocol = "https:"), A;
  }
  function q(A, S) {
    return JSON.stringify(A, (R, v) => R.endsWith("Authorization") || R.endsWith("authorization") || R.endsWith("Password") || R.endsWith("PASSWORD") || R.endsWith("Token") || R.includes("password") || R.includes("token") || S != null && S.has(R) ? "<stripped sensitive data>" : v, 2);
  }
  return Ge;
}
var Xt = {}, _o;
function Bc() {
  if (_o) return Xt;
  _o = 1, Object.defineProperty(Xt, "__esModule", { value: !0 }), Xt.MemoLazy = void 0;
  let t = class {
    constructor(c, d) {
      this.selector = c, this.creator = d, this.selected = void 0, this._value = void 0;
    }
    get hasValue() {
      return this._value !== void 0;
    }
    get value() {
      const c = this.selector();
      if (this._value !== void 0 && e(this.selected, c))
        return this._value;
      this.selected = c;
      const d = this.creator(c);
      return this.value = d, d;
    }
    set value(c) {
      this._value = c;
    }
  };
  Xt.MemoLazy = t;
  function e(a, c) {
    if (typeof a == "object" && a !== null && (typeof c == "object" && c !== null)) {
      const n = Object.keys(a), h = Object.keys(c);
      return n.length === h.length && n.every((o) => e(a[o], c[o]));
    }
    return a === c;
  }
  return Xt;
}
var Kt = {}, To;
function jc() {
  if (To) return Kt;
  To = 1, Object.defineProperty(Kt, "__esModule", { value: !0 }), Kt.githubUrl = t, Kt.getS3LikeProviderBaseUrl = e;
  function t(l, n = "github.com") {
    return `${l.protocol || "https"}://${l.host || n}`;
  }
  function e(l) {
    const n = l.provider;
    if (n === "s3")
      return a(l);
    if (n === "spaces")
      return d(l);
    throw new Error(`Not supported provider: ${n}`);
  }
  function a(l) {
    let n;
    if (l.accelerate == !0)
      n = `https://${l.bucket}.s3-accelerate.amazonaws.com`;
    else if (l.endpoint != null)
      n = `${l.endpoint}/${l.bucket}`;
    else if (l.bucket.includes(".")) {
      if (l.region == null)
        throw new Error(`Bucket name "${l.bucket}" includes a dot, but S3 region is missing`);
      l.region === "us-east-1" ? n = `https://s3.amazonaws.com/${l.bucket}` : n = `https://s3-${l.region}.amazonaws.com/${l.bucket}`;
    } else l.region === "cn-north-1" ? n = `https://${l.bucket}.s3.${l.region}.amazonaws.com.cn` : n = `https://${l.bucket}.s3.amazonaws.com`;
    return c(n, l.path);
  }
  function c(l, n) {
    return n != null && n.length > 0 && (n.startsWith("/") || (l += "/"), l += n), l;
  }
  function d(l) {
    if (l.name == null)
      throw new Error("name is missing");
    if (l.region == null)
      throw new Error("region is missing");
    return c(`https://${l.name}.${l.region}.digitaloceanspaces.com`, l.path);
  }
  return Kt;
}
var Lr = {}, So;
function Hc() {
  if (So) return Lr;
  So = 1, Object.defineProperty(Lr, "__esModule", { value: !0 }), Lr.retry = e;
  const t = aa();
  async function e(a, c, d, l = 0, n = 0, h) {
    var o;
    const u = new t.CancellationToken();
    try {
      return await a();
    } catch (s) {
      if ((!((o = h?.(s)) !== null && o !== void 0) || o) && c > 0 && !u.cancelled)
        return await new Promise((f) => setTimeout(f, d + l * n)), await e(a, c - 1, d, l, n + 1, h);
      throw s;
    }
  }
  return Lr;
}
var xr = {}, Ro;
function Gc() {
  if (Ro) return xr;
  Ro = 1, Object.defineProperty(xr, "__esModule", { value: !0 }), xr.parseDn = t;
  function t(e) {
    let a = !1, c = null, d = "", l = 0;
    e = e.trim();
    const n = /* @__PURE__ */ new Map();
    for (let h = 0; h <= e.length; h++) {
      if (h === e.length) {
        c !== null && n.set(c, d);
        break;
      }
      const o = e[h];
      if (a) {
        if (o === '"') {
          a = !1;
          continue;
        }
      } else {
        if (o === '"') {
          a = !0;
          continue;
        }
        if (o === "\\") {
          h++;
          const u = parseInt(e.slice(h, h + 2), 16);
          Number.isNaN(u) ? d += e[h] : (h++, d += String.fromCharCode(u));
          continue;
        }
        if (c === null && o === "=") {
          c = d, d = "";
          continue;
        }
        if (o === "," || o === ";" || o === "+") {
          c !== null && n.set(c, d), c = null, d = "";
          continue;
        }
      }
      if (o === " " && !a) {
        if (d.length === 0)
          continue;
        if (h > l) {
          let u = h;
          for (; e[u] === " "; )
            u++;
          l = u;
        }
        if (l >= e.length || e[l] === "," || e[l] === ";" || c === null && e[l] === "=" || c !== null && e[l] === "+") {
          h = l - 1;
          continue;
        }
      }
      d += o;
    }
    return n;
  }
  return xr;
}
var Ct = {}, bo;
function Wc() {
  if (bo) return Ct;
  bo = 1, Object.defineProperty(Ct, "__esModule", { value: !0 }), Ct.nil = Ct.UUID = void 0;
  const t = Er, e = Gr(), a = "options.name must be either a string or a Buffer", c = (0, t.randomBytes)(16);
  c[0] = c[0] | 1;
  const d = {}, l = [];
  for (let f = 0; f < 256; f++) {
    const i = (f + 256).toString(16).substr(1);
    d[i] = f, l[f] = i;
  }
  class n {
    constructor(i) {
      this.ascii = null, this.binary = null;
      const g = n.check(i);
      if (!g)
        throw new Error("not a UUID");
      this.version = g.version, g.format === "ascii" ? this.ascii = i : this.binary = i;
    }
    static v5(i, g) {
      return u(i, "sha1", 80, g);
    }
    toString() {
      return this.ascii == null && (this.ascii = s(this.binary)), this.ascii;
    }
    inspect() {
      return `UUID v${this.version} ${this.toString()}`;
    }
    static check(i, g = 0) {
      if (typeof i == "string")
        return i = i.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(i) ? i === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
          version: (d[i[14] + i[15]] & 240) >> 4,
          variant: h((d[i[19] + i[20]] & 224) >> 5),
          format: "ascii"
        } : !1;
      if (Buffer.isBuffer(i)) {
        if (i.length < g + 16)
          return !1;
        let E = 0;
        for (; E < 16 && i[g + E] === 0; E++)
          ;
        return E === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
          version: (i[g + 6] & 240) >> 4,
          variant: h((i[g + 8] & 224) >> 5),
          format: "binary"
        };
      }
      throw (0, e.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
    }
    // read stringified uuid into a Buffer
    static parse(i) {
      const g = Buffer.allocUnsafe(16);
      let E = 0;
      for (let y = 0; y < 16; y++)
        g[y] = d[i[E++] + i[E++]], (y === 3 || y === 5 || y === 7 || y === 9) && (E += 1);
      return g;
    }
  }
  Ct.UUID = n, n.OID = n.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
  function h(f) {
    switch (f) {
      case 0:
      case 1:
      case 3:
        return "ncs";
      case 4:
      case 5:
        return "rfc4122";
      case 6:
        return "microsoft";
      default:
        return "future";
    }
  }
  var o;
  (function(f) {
    f[f.ASCII = 0] = "ASCII", f[f.BINARY = 1] = "BINARY", f[f.OBJECT = 2] = "OBJECT";
  })(o || (o = {}));
  function u(f, i, g, E, y = o.ASCII) {
    const p = (0, t.createHash)(i);
    if (typeof f != "string" && !Buffer.isBuffer(f))
      throw (0, e.newError)(a, "ERR_INVALID_UUID_NAME");
    p.update(E), p.update(f);
    const b = p.digest();
    let O;
    switch (y) {
      case o.BINARY:
        b[6] = b[6] & 15 | g, b[8] = b[8] & 63 | 128, O = b;
        break;
      case o.OBJECT:
        b[6] = b[6] & 15 | g, b[8] = b[8] & 63 | 128, O = new n(b);
        break;
      default:
        O = l[b[0]] + l[b[1]] + l[b[2]] + l[b[3]] + "-" + l[b[4]] + l[b[5]] + "-" + l[b[6] & 15 | g] + l[b[7]] + "-" + l[b[8] & 63 | 128] + l[b[9]] + "-" + l[b[10]] + l[b[11]] + l[b[12]] + l[b[13]] + l[b[14]] + l[b[15]];
        break;
    }
    return O;
  }
  function s(f) {
    return l[f[0]] + l[f[1]] + l[f[2]] + l[f[3]] + "-" + l[f[4]] + l[f[5]] + "-" + l[f[6]] + l[f[7]] + "-" + l[f[8]] + l[f[9]] + "-" + l[f[10]] + l[f[11]] + l[f[12]] + l[f[13]] + l[f[14]] + l[f[15]];
  }
  return Ct.nil = new n("00000000-0000-0000-0000-000000000000"), Ct;
}
var xt = {}, kn = {}, Ao;
function zc() {
  return Ao || (Ao = 1, function(t) {
    (function(e) {
      e.parser = function(_, m) {
        return new c(_, m);
      }, e.SAXParser = c, e.SAXStream = s, e.createStream = u, e.MAX_BUFFER_LENGTH = 64 * 1024;
      var a = [
        "comment",
        "sgmlDecl",
        "textNode",
        "tagName",
        "doctype",
        "procInstName",
        "procInstBody",
        "entity",
        "attribName",
        "attribValue",
        "cdata",
        "script"
      ];
      e.EVENTS = [
        "text",
        "processinginstruction",
        "sgmldeclaration",
        "doctype",
        "comment",
        "opentagstart",
        "attribute",
        "opentag",
        "closetag",
        "opencdata",
        "cdata",
        "closecdata",
        "error",
        "end",
        "ready",
        "script",
        "opennamespace",
        "closenamespace"
      ];
      function c(_, m) {
        if (!(this instanceof c))
          return new c(_, m);
        var j = this;
        l(j), j.q = j.c = "", j.bufferCheckPosition = e.MAX_BUFFER_LENGTH, j.opt = m || {}, j.opt.lowercase = j.opt.lowercase || j.opt.lowercasetags, j.looseCase = j.opt.lowercase ? "toLowerCase" : "toUpperCase", j.tags = [], j.closed = j.closedRoot = j.sawRoot = !1, j.tag = j.error = null, j.strict = !!_, j.noscript = !!(_ || j.opt.noscript), j.state = v.BEGIN, j.strictEntities = j.opt.strictEntities, j.ENTITIES = j.strictEntities ? Object.create(e.XML_ENTITIES) : Object.create(e.ENTITIES), j.attribList = [], j.opt.xmlns && (j.ns = Object.create(y)), j.opt.unquotedAttributeValues === void 0 && (j.opt.unquotedAttributeValues = !_), j.trackPosition = j.opt.position !== !1, j.trackPosition && (j.position = j.line = j.column = 0), U(j, "onready");
      }
      Object.create || (Object.create = function(_) {
        function m() {
        }
        m.prototype = _;
        var j = new m();
        return j;
      }), Object.keys || (Object.keys = function(_) {
        var m = [];
        for (var j in _) _.hasOwnProperty(j) && m.push(j);
        return m;
      });
      function d(_) {
        for (var m = Math.max(e.MAX_BUFFER_LENGTH, 10), j = 0, I = 0, le = a.length; I < le; I++) {
          var ge = _[a[I]].length;
          if (ge > m)
            switch (a[I]) {
              case "textNode":
                k(_);
                break;
              case "cdata":
                x(_, "oncdata", _.cdata), _.cdata = "";
                break;
              case "script":
                x(_, "onscript", _.script), _.script = "";
                break;
              default:
                P(_, "Max buffer length exceeded: " + a[I]);
            }
          j = Math.max(j, ge);
        }
        var pe = e.MAX_BUFFER_LENGTH - j;
        _.bufferCheckPosition = pe + _.position;
      }
      function l(_) {
        for (var m = 0, j = a.length; m < j; m++)
          _[a[m]] = "";
      }
      function n(_) {
        k(_), _.cdata !== "" && (x(_, "oncdata", _.cdata), _.cdata = ""), _.script !== "" && (x(_, "onscript", _.script), _.script = "");
      }
      c.prototype = {
        end: function() {
          F(this);
        },
        write: ye,
        resume: function() {
          return this.error = null, this;
        },
        close: function() {
          return this.write(null);
        },
        flush: function() {
          n(this);
        }
      };
      var h;
      try {
        h = require("stream").Stream;
      } catch {
        h = function() {
        };
      }
      h || (h = function() {
      });
      var o = e.EVENTS.filter(function(_) {
        return _ !== "error" && _ !== "end";
      });
      function u(_, m) {
        return new s(_, m);
      }
      function s(_, m) {
        if (!(this instanceof s))
          return new s(_, m);
        h.apply(this), this._parser = new c(_, m), this.writable = !0, this.readable = !0;
        var j = this;
        this._parser.onend = function() {
          j.emit("end");
        }, this._parser.onerror = function(I) {
          j.emit("error", I), j._parser.error = null;
        }, this._decoder = null, o.forEach(function(I) {
          Object.defineProperty(j, "on" + I, {
            get: function() {
              return j._parser["on" + I];
            },
            set: function(le) {
              if (!le)
                return j.removeAllListeners(I), j._parser["on" + I] = le, le;
              j.on(I, le);
            },
            enumerable: !0,
            configurable: !1
          });
        });
      }
      s.prototype = Object.create(h.prototype, {
        constructor: {
          value: s
        }
      }), s.prototype.write = function(_) {
        if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(_)) {
          if (!this._decoder) {
            var m = lc.StringDecoder;
            this._decoder = new m("utf8");
          }
          _ = this._decoder.write(_);
        }
        return this._parser.write(_.toString()), this.emit("data", _), !0;
      }, s.prototype.end = function(_) {
        return _ && _.length && this.write(_), this._parser.end(), !0;
      }, s.prototype.on = function(_, m) {
        var j = this;
        return !j._parser["on" + _] && o.indexOf(_) !== -1 && (j._parser["on" + _] = function() {
          var I = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
          I.splice(0, 0, _), j.emit.apply(j, I);
        }), h.prototype.on.call(j, _, m);
      };
      var f = "[CDATA[", i = "DOCTYPE", g = "http://www.w3.org/XML/1998/namespace", E = "http://www.w3.org/2000/xmlns/", y = { xml: g, xmlns: E }, p = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, T = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, b = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, O = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      function D(_) {
        return _ === " " || _ === `
` || _ === "\r" || _ === "	";
      }
      function q(_) {
        return _ === '"' || _ === "'";
      }
      function A(_) {
        return _ === ">" || D(_);
      }
      function S(_, m) {
        return _.test(m);
      }
      function R(_, m) {
        return !S(_, m);
      }
      var v = 0;
      e.STATE = {
        BEGIN: v++,
        // leading byte order mark or whitespace
        BEGIN_WHITESPACE: v++,
        // leading whitespace
        TEXT: v++,
        // general stuff
        TEXT_ENTITY: v++,
        // &amp and such.
        OPEN_WAKA: v++,
        // <
        SGML_DECL: v++,
        // <!BLARG
        SGML_DECL_QUOTED: v++,
        // <!BLARG foo "bar
        DOCTYPE: v++,
        // <!DOCTYPE
        DOCTYPE_QUOTED: v++,
        // <!DOCTYPE "//blah
        DOCTYPE_DTD: v++,
        // <!DOCTYPE "//blah" [ ...
        DOCTYPE_DTD_QUOTED: v++,
        // <!DOCTYPE "//blah" [ "foo
        COMMENT_STARTING: v++,
        // <!-
        COMMENT: v++,
        // <!--
        COMMENT_ENDING: v++,
        // <!-- blah -
        COMMENT_ENDED: v++,
        // <!-- blah --
        CDATA: v++,
        // <![CDATA[ something
        CDATA_ENDING: v++,
        // ]
        CDATA_ENDING_2: v++,
        // ]]
        PROC_INST: v++,
        // <?hi
        PROC_INST_BODY: v++,
        // <?hi there
        PROC_INST_ENDING: v++,
        // <?hi "there" ?
        OPEN_TAG: v++,
        // <strong
        OPEN_TAG_SLASH: v++,
        // <strong /
        ATTRIB: v++,
        // <a
        ATTRIB_NAME: v++,
        // <a foo
        ATTRIB_NAME_SAW_WHITE: v++,
        // <a foo _
        ATTRIB_VALUE: v++,
        // <a foo=
        ATTRIB_VALUE_QUOTED: v++,
        // <a foo="bar
        ATTRIB_VALUE_CLOSED: v++,
        // <a foo="bar"
        ATTRIB_VALUE_UNQUOTED: v++,
        // <a foo=bar
        ATTRIB_VALUE_ENTITY_Q: v++,
        // <foo bar="&quot;"
        ATTRIB_VALUE_ENTITY_U: v++,
        // <foo bar=&quot
        CLOSE_TAG: v++,
        // </a
        CLOSE_TAG_SAW_WHITE: v++,
        // </a   >
        SCRIPT: v++,
        // <script> ...
        SCRIPT_ENDING: v++
        // <script> ... <
      }, e.XML_ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'"
      }, e.ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'",
        AElig: 198,
        Aacute: 193,
        Acirc: 194,
        Agrave: 192,
        Aring: 197,
        Atilde: 195,
        Auml: 196,
        Ccedil: 199,
        ETH: 208,
        Eacute: 201,
        Ecirc: 202,
        Egrave: 200,
        Euml: 203,
        Iacute: 205,
        Icirc: 206,
        Igrave: 204,
        Iuml: 207,
        Ntilde: 209,
        Oacute: 211,
        Ocirc: 212,
        Ograve: 210,
        Oslash: 216,
        Otilde: 213,
        Ouml: 214,
        THORN: 222,
        Uacute: 218,
        Ucirc: 219,
        Ugrave: 217,
        Uuml: 220,
        Yacute: 221,
        aacute: 225,
        acirc: 226,
        aelig: 230,
        agrave: 224,
        aring: 229,
        atilde: 227,
        auml: 228,
        ccedil: 231,
        eacute: 233,
        ecirc: 234,
        egrave: 232,
        eth: 240,
        euml: 235,
        iacute: 237,
        icirc: 238,
        igrave: 236,
        iuml: 239,
        ntilde: 241,
        oacute: 243,
        ocirc: 244,
        ograve: 242,
        oslash: 248,
        otilde: 245,
        ouml: 246,
        szlig: 223,
        thorn: 254,
        uacute: 250,
        ucirc: 251,
        ugrave: 249,
        uuml: 252,
        yacute: 253,
        yuml: 255,
        copy: 169,
        reg: 174,
        nbsp: 160,
        iexcl: 161,
        cent: 162,
        pound: 163,
        curren: 164,
        yen: 165,
        brvbar: 166,
        sect: 167,
        uml: 168,
        ordf: 170,
        laquo: 171,
        not: 172,
        shy: 173,
        macr: 175,
        deg: 176,
        plusmn: 177,
        sup1: 185,
        sup2: 178,
        sup3: 179,
        acute: 180,
        micro: 181,
        para: 182,
        middot: 183,
        cedil: 184,
        ordm: 186,
        raquo: 187,
        frac14: 188,
        frac12: 189,
        frac34: 190,
        iquest: 191,
        times: 215,
        divide: 247,
        OElig: 338,
        oelig: 339,
        Scaron: 352,
        scaron: 353,
        Yuml: 376,
        fnof: 402,
        circ: 710,
        tilde: 732,
        Alpha: 913,
        Beta: 914,
        Gamma: 915,
        Delta: 916,
        Epsilon: 917,
        Zeta: 918,
        Eta: 919,
        Theta: 920,
        Iota: 921,
        Kappa: 922,
        Lambda: 923,
        Mu: 924,
        Nu: 925,
        Xi: 926,
        Omicron: 927,
        Pi: 928,
        Rho: 929,
        Sigma: 931,
        Tau: 932,
        Upsilon: 933,
        Phi: 934,
        Chi: 935,
        Psi: 936,
        Omega: 937,
        alpha: 945,
        beta: 946,
        gamma: 947,
        delta: 948,
        epsilon: 949,
        zeta: 950,
        eta: 951,
        theta: 952,
        iota: 953,
        kappa: 954,
        lambda: 955,
        mu: 956,
        nu: 957,
        xi: 958,
        omicron: 959,
        pi: 960,
        rho: 961,
        sigmaf: 962,
        sigma: 963,
        tau: 964,
        upsilon: 965,
        phi: 966,
        chi: 967,
        psi: 968,
        omega: 969,
        thetasym: 977,
        upsih: 978,
        piv: 982,
        ensp: 8194,
        emsp: 8195,
        thinsp: 8201,
        zwnj: 8204,
        zwj: 8205,
        lrm: 8206,
        rlm: 8207,
        ndash: 8211,
        mdash: 8212,
        lsquo: 8216,
        rsquo: 8217,
        sbquo: 8218,
        ldquo: 8220,
        rdquo: 8221,
        bdquo: 8222,
        dagger: 8224,
        Dagger: 8225,
        bull: 8226,
        hellip: 8230,
        permil: 8240,
        prime: 8242,
        Prime: 8243,
        lsaquo: 8249,
        rsaquo: 8250,
        oline: 8254,
        frasl: 8260,
        euro: 8364,
        image: 8465,
        weierp: 8472,
        real: 8476,
        trade: 8482,
        alefsym: 8501,
        larr: 8592,
        uarr: 8593,
        rarr: 8594,
        darr: 8595,
        harr: 8596,
        crarr: 8629,
        lArr: 8656,
        uArr: 8657,
        rArr: 8658,
        dArr: 8659,
        hArr: 8660,
        forall: 8704,
        part: 8706,
        exist: 8707,
        empty: 8709,
        nabla: 8711,
        isin: 8712,
        notin: 8713,
        ni: 8715,
        prod: 8719,
        sum: 8721,
        minus: 8722,
        lowast: 8727,
        radic: 8730,
        prop: 8733,
        infin: 8734,
        ang: 8736,
        and: 8743,
        or: 8744,
        cap: 8745,
        cup: 8746,
        int: 8747,
        there4: 8756,
        sim: 8764,
        cong: 8773,
        asymp: 8776,
        ne: 8800,
        equiv: 8801,
        le: 8804,
        ge: 8805,
        sub: 8834,
        sup: 8835,
        nsub: 8836,
        sube: 8838,
        supe: 8839,
        oplus: 8853,
        otimes: 8855,
        perp: 8869,
        sdot: 8901,
        lceil: 8968,
        rceil: 8969,
        lfloor: 8970,
        rfloor: 8971,
        lang: 9001,
        rang: 9002,
        loz: 9674,
        spades: 9824,
        clubs: 9827,
        hearts: 9829,
        diams: 9830
      }, Object.keys(e.ENTITIES).forEach(function(_) {
        var m = e.ENTITIES[_], j = typeof m == "number" ? String.fromCharCode(m) : m;
        e.ENTITIES[_] = j;
      });
      for (var M in e.STATE)
        e.STATE[e.STATE[M]] = M;
      v = e.STATE;
      function U(_, m, j) {
        _[m] && _[m](j);
      }
      function x(_, m, j) {
        _.textNode && k(_), U(_, m, j);
      }
      function k(_) {
        _.textNode = N(_.opt, _.textNode), _.textNode && U(_, "ontext", _.textNode), _.textNode = "";
      }
      function N(_, m) {
        return _.trim && (m = m.trim()), _.normalize && (m = m.replace(/\s+/g, " ")), m;
      }
      function P(_, m) {
        return k(_), _.trackPosition && (m += `
Line: ` + _.line + `
Column: ` + _.column + `
Char: ` + _.c), m = new Error(m), _.error = m, U(_, "onerror", m), _;
      }
      function F(_) {
        return _.sawRoot && !_.closedRoot && $(_, "Unclosed root tag"), _.state !== v.BEGIN && _.state !== v.BEGIN_WHITESPACE && _.state !== v.TEXT && P(_, "Unexpected end"), k(_), _.c = "", _.closed = !0, U(_, "onend"), c.call(_, _.strict, _.opt), _;
      }
      function $(_, m) {
        if (typeof _ != "object" || !(_ instanceof c))
          throw new Error("bad call to strictFail");
        _.strict && P(_, m);
      }
      function J(_) {
        _.strict || (_.tagName = _.tagName[_.looseCase]());
        var m = _.tags[_.tags.length - 1] || _, j = _.tag = { name: _.tagName, attributes: {} };
        _.opt.xmlns && (j.ns = m.ns), _.attribList.length = 0, x(_, "onopentagstart", j);
      }
      function W(_, m) {
        var j = _.indexOf(":"), I = j < 0 ? ["", _] : _.split(":"), le = I[0], ge = I[1];
        return m && _ === "xmlns" && (le = "xmlns", ge = ""), { prefix: le, local: ge };
      }
      function ne(_) {
        if (_.strict || (_.attribName = _.attribName[_.looseCase]()), _.attribList.indexOf(_.attribName) !== -1 || _.tag.attributes.hasOwnProperty(_.attribName)) {
          _.attribName = _.attribValue = "";
          return;
        }
        if (_.opt.xmlns) {
          var m = W(_.attribName, !0), j = m.prefix, I = m.local;
          if (j === "xmlns")
            if (I === "xml" && _.attribValue !== g)
              $(
                _,
                "xml: prefix must be bound to " + g + `
Actual: ` + _.attribValue
              );
            else if (I === "xmlns" && _.attribValue !== E)
              $(
                _,
                "xmlns: prefix must be bound to " + E + `
Actual: ` + _.attribValue
              );
            else {
              var le = _.tag, ge = _.tags[_.tags.length - 1] || _;
              le.ns === ge.ns && (le.ns = Object.create(ge.ns)), le.ns[I] = _.attribValue;
            }
          _.attribList.push([_.attribName, _.attribValue]);
        } else
          _.tag.attributes[_.attribName] = _.attribValue, x(_, "onattribute", {
            name: _.attribName,
            value: _.attribValue
          });
        _.attribName = _.attribValue = "";
      }
      function ce(_, m) {
        if (_.opt.xmlns) {
          var j = _.tag, I = W(_.tagName);
          j.prefix = I.prefix, j.local = I.local, j.uri = j.ns[I.prefix] || "", j.prefix && !j.uri && ($(_, "Unbound namespace prefix: " + JSON.stringify(_.tagName)), j.uri = I.prefix);
          var le = _.tags[_.tags.length - 1] || _;
          j.ns && le.ns !== j.ns && Object.keys(j.ns).forEach(function(B) {
            x(_, "onopennamespace", {
              prefix: B,
              uri: j.ns[B]
            });
          });
          for (var ge = 0, pe = _.attribList.length; ge < pe; ge++) {
            var _e = _.attribList[ge], ve = _e[0], Ue = _e[1], De = W(ve, !0), je = De.prefix, yt = De.local, lt = je === "" ? "" : j.ns[je] || "", r = {
              name: ve,
              value: Ue,
              prefix: je,
              local: yt,
              uri: lt
            };
            je && je !== "xmlns" && !lt && ($(_, "Unbound namespace prefix: " + JSON.stringify(je)), r.uri = je), _.tag.attributes[ve] = r, x(_, "onattribute", r);
          }
          _.attribList.length = 0;
        }
        _.tag.isSelfClosing = !!m, _.sawRoot = !0, _.tags.push(_.tag), x(_, "onopentag", _.tag), m || (!_.noscript && _.tagName.toLowerCase() === "script" ? _.state = v.SCRIPT : _.state = v.TEXT, _.tag = null, _.tagName = ""), _.attribName = _.attribValue = "", _.attribList.length = 0;
      }
      function ue(_) {
        if (!_.tagName) {
          $(_, "Weird empty close tag."), _.textNode += "</>", _.state = v.TEXT;
          return;
        }
        if (_.script) {
          if (_.tagName !== "script") {
            _.script += "</" + _.tagName + ">", _.tagName = "", _.state = v.SCRIPT;
            return;
          }
          x(_, "onscript", _.script), _.script = "";
        }
        var m = _.tags.length, j = _.tagName;
        _.strict || (j = j[_.looseCase]());
        for (var I = j; m--; ) {
          var le = _.tags[m];
          if (le.name !== I)
            $(_, "Unexpected close tag");
          else
            break;
        }
        if (m < 0) {
          $(_, "Unmatched closing tag: " + _.tagName), _.textNode += "</" + _.tagName + ">", _.state = v.TEXT;
          return;
        }
        _.tagName = j;
        for (var ge = _.tags.length; ge-- > m; ) {
          var pe = _.tag = _.tags.pop();
          _.tagName = _.tag.name, x(_, "onclosetag", _.tagName);
          var _e = {};
          for (var ve in pe.ns)
            _e[ve] = pe.ns[ve];
          var Ue = _.tags[_.tags.length - 1] || _;
          _.opt.xmlns && pe.ns !== Ue.ns && Object.keys(pe.ns).forEach(function(De) {
            var je = pe.ns[De];
            x(_, "onclosenamespace", { prefix: De, uri: je });
          });
        }
        m === 0 && (_.closedRoot = !0), _.tagName = _.attribValue = _.attribName = "", _.attribList.length = 0, _.state = v.TEXT;
      }
      function ie(_) {
        var m = _.entity, j = m.toLowerCase(), I, le = "";
        return _.ENTITIES[m] ? _.ENTITIES[m] : _.ENTITIES[j] ? _.ENTITIES[j] : (m = j, m.charAt(0) === "#" && (m.charAt(1) === "x" ? (m = m.slice(2), I = parseInt(m, 16), le = I.toString(16)) : (m = m.slice(1), I = parseInt(m, 10), le = I.toString(10))), m = m.replace(/^0+/, ""), isNaN(I) || le.toLowerCase() !== m ? ($(_, "Invalid character entity"), "&" + _.entity + ";") : String.fromCodePoint(I));
      }
      function be(_, m) {
        m === "<" ? (_.state = v.OPEN_WAKA, _.startTagPosition = _.position) : D(m) || ($(_, "Non-whitespace before first tag."), _.textNode = m, _.state = v.TEXT);
      }
      function K(_, m) {
        var j = "";
        return m < _.length && (j = _.charAt(m)), j;
      }
      function ye(_) {
        var m = this;
        if (this.error)
          throw this.error;
        if (m.closed)
          return P(
            m,
            "Cannot write after close. Assign an onready handler."
          );
        if (_ === null)
          return F(m);
        typeof _ == "object" && (_ = _.toString());
        for (var j = 0, I = ""; I = K(_, j++), m.c = I, !!I; )
          switch (m.trackPosition && (m.position++, I === `
` ? (m.line++, m.column = 0) : m.column++), m.state) {
            case v.BEGIN:
              if (m.state = v.BEGIN_WHITESPACE, I === "\uFEFF")
                continue;
              be(m, I);
              continue;
            case v.BEGIN_WHITESPACE:
              be(m, I);
              continue;
            case v.TEXT:
              if (m.sawRoot && !m.closedRoot) {
                for (var le = j - 1; I && I !== "<" && I !== "&"; )
                  I = K(_, j++), I && m.trackPosition && (m.position++, I === `
` ? (m.line++, m.column = 0) : m.column++);
                m.textNode += _.substring(le, j - 1);
              }
              I === "<" && !(m.sawRoot && m.closedRoot && !m.strict) ? (m.state = v.OPEN_WAKA, m.startTagPosition = m.position) : (!D(I) && (!m.sawRoot || m.closedRoot) && $(m, "Text data outside of root node."), I === "&" ? m.state = v.TEXT_ENTITY : m.textNode += I);
              continue;
            case v.SCRIPT:
              I === "<" ? m.state = v.SCRIPT_ENDING : m.script += I;
              continue;
            case v.SCRIPT_ENDING:
              I === "/" ? m.state = v.CLOSE_TAG : (m.script += "<" + I, m.state = v.SCRIPT);
              continue;
            case v.OPEN_WAKA:
              if (I === "!")
                m.state = v.SGML_DECL, m.sgmlDecl = "";
              else if (!D(I)) if (S(p, I))
                m.state = v.OPEN_TAG, m.tagName = I;
              else if (I === "/")
                m.state = v.CLOSE_TAG, m.tagName = "";
              else if (I === "?")
                m.state = v.PROC_INST, m.procInstName = m.procInstBody = "";
              else {
                if ($(m, "Unencoded <"), m.startTagPosition + 1 < m.position) {
                  var ge = m.position - m.startTagPosition;
                  I = new Array(ge).join(" ") + I;
                }
                m.textNode += "<" + I, m.state = v.TEXT;
              }
              continue;
            case v.SGML_DECL:
              if (m.sgmlDecl + I === "--") {
                m.state = v.COMMENT, m.comment = "", m.sgmlDecl = "";
                continue;
              }
              m.doctype && m.doctype !== !0 && m.sgmlDecl ? (m.state = v.DOCTYPE_DTD, m.doctype += "<!" + m.sgmlDecl + I, m.sgmlDecl = "") : (m.sgmlDecl + I).toUpperCase() === f ? (x(m, "onopencdata"), m.state = v.CDATA, m.sgmlDecl = "", m.cdata = "") : (m.sgmlDecl + I).toUpperCase() === i ? (m.state = v.DOCTYPE, (m.doctype || m.sawRoot) && $(
                m,
                "Inappropriately located doctype declaration"
              ), m.doctype = "", m.sgmlDecl = "") : I === ">" ? (x(m, "onsgmldeclaration", m.sgmlDecl), m.sgmlDecl = "", m.state = v.TEXT) : (q(I) && (m.state = v.SGML_DECL_QUOTED), m.sgmlDecl += I);
              continue;
            case v.SGML_DECL_QUOTED:
              I === m.q && (m.state = v.SGML_DECL, m.q = ""), m.sgmlDecl += I;
              continue;
            case v.DOCTYPE:
              I === ">" ? (m.state = v.TEXT, x(m, "ondoctype", m.doctype), m.doctype = !0) : (m.doctype += I, I === "[" ? m.state = v.DOCTYPE_DTD : q(I) && (m.state = v.DOCTYPE_QUOTED, m.q = I));
              continue;
            case v.DOCTYPE_QUOTED:
              m.doctype += I, I === m.q && (m.q = "", m.state = v.DOCTYPE);
              continue;
            case v.DOCTYPE_DTD:
              I === "]" ? (m.doctype += I, m.state = v.DOCTYPE) : I === "<" ? (m.state = v.OPEN_WAKA, m.startTagPosition = m.position) : q(I) ? (m.doctype += I, m.state = v.DOCTYPE_DTD_QUOTED, m.q = I) : m.doctype += I;
              continue;
            case v.DOCTYPE_DTD_QUOTED:
              m.doctype += I, I === m.q && (m.state = v.DOCTYPE_DTD, m.q = "");
              continue;
            case v.COMMENT:
              I === "-" ? m.state = v.COMMENT_ENDING : m.comment += I;
              continue;
            case v.COMMENT_ENDING:
              I === "-" ? (m.state = v.COMMENT_ENDED, m.comment = N(m.opt, m.comment), m.comment && x(m, "oncomment", m.comment), m.comment = "") : (m.comment += "-" + I, m.state = v.COMMENT);
              continue;
            case v.COMMENT_ENDED:
              I !== ">" ? ($(m, "Malformed comment"), m.comment += "--" + I, m.state = v.COMMENT) : m.doctype && m.doctype !== !0 ? m.state = v.DOCTYPE_DTD : m.state = v.TEXT;
              continue;
            case v.CDATA:
              I === "]" ? m.state = v.CDATA_ENDING : m.cdata += I;
              continue;
            case v.CDATA_ENDING:
              I === "]" ? m.state = v.CDATA_ENDING_2 : (m.cdata += "]" + I, m.state = v.CDATA);
              continue;
            case v.CDATA_ENDING_2:
              I === ">" ? (m.cdata && x(m, "oncdata", m.cdata), x(m, "onclosecdata"), m.cdata = "", m.state = v.TEXT) : I === "]" ? m.cdata += "]" : (m.cdata += "]]" + I, m.state = v.CDATA);
              continue;
            case v.PROC_INST:
              I === "?" ? m.state = v.PROC_INST_ENDING : D(I) ? m.state = v.PROC_INST_BODY : m.procInstName += I;
              continue;
            case v.PROC_INST_BODY:
              if (!m.procInstBody && D(I))
                continue;
              I === "?" ? m.state = v.PROC_INST_ENDING : m.procInstBody += I;
              continue;
            case v.PROC_INST_ENDING:
              I === ">" ? (x(m, "onprocessinginstruction", {
                name: m.procInstName,
                body: m.procInstBody
              }), m.procInstName = m.procInstBody = "", m.state = v.TEXT) : (m.procInstBody += "?" + I, m.state = v.PROC_INST_BODY);
              continue;
            case v.OPEN_TAG:
              S(T, I) ? m.tagName += I : (J(m), I === ">" ? ce(m) : I === "/" ? m.state = v.OPEN_TAG_SLASH : (D(I) || $(m, "Invalid character in tag name"), m.state = v.ATTRIB));
              continue;
            case v.OPEN_TAG_SLASH:
              I === ">" ? (ce(m, !0), ue(m)) : ($(m, "Forward-slash in opening tag not followed by >"), m.state = v.ATTRIB);
              continue;
            case v.ATTRIB:
              if (D(I))
                continue;
              I === ">" ? ce(m) : I === "/" ? m.state = v.OPEN_TAG_SLASH : S(p, I) ? (m.attribName = I, m.attribValue = "", m.state = v.ATTRIB_NAME) : $(m, "Invalid attribute name");
              continue;
            case v.ATTRIB_NAME:
              I === "=" ? m.state = v.ATTRIB_VALUE : I === ">" ? ($(m, "Attribute without value"), m.attribValue = m.attribName, ne(m), ce(m)) : D(I) ? m.state = v.ATTRIB_NAME_SAW_WHITE : S(T, I) ? m.attribName += I : $(m, "Invalid attribute name");
              continue;
            case v.ATTRIB_NAME_SAW_WHITE:
              if (I === "=")
                m.state = v.ATTRIB_VALUE;
              else {
                if (D(I))
                  continue;
                $(m, "Attribute without value"), m.tag.attributes[m.attribName] = "", m.attribValue = "", x(m, "onattribute", {
                  name: m.attribName,
                  value: ""
                }), m.attribName = "", I === ">" ? ce(m) : S(p, I) ? (m.attribName = I, m.state = v.ATTRIB_NAME) : ($(m, "Invalid attribute name"), m.state = v.ATTRIB);
              }
              continue;
            case v.ATTRIB_VALUE:
              if (D(I))
                continue;
              q(I) ? (m.q = I, m.state = v.ATTRIB_VALUE_QUOTED) : (m.opt.unquotedAttributeValues || P(m, "Unquoted attribute value"), m.state = v.ATTRIB_VALUE_UNQUOTED, m.attribValue = I);
              continue;
            case v.ATTRIB_VALUE_QUOTED:
              if (I !== m.q) {
                I === "&" ? m.state = v.ATTRIB_VALUE_ENTITY_Q : m.attribValue += I;
                continue;
              }
              ne(m), m.q = "", m.state = v.ATTRIB_VALUE_CLOSED;
              continue;
            case v.ATTRIB_VALUE_CLOSED:
              D(I) ? m.state = v.ATTRIB : I === ">" ? ce(m) : I === "/" ? m.state = v.OPEN_TAG_SLASH : S(p, I) ? ($(m, "No whitespace between attributes"), m.attribName = I, m.attribValue = "", m.state = v.ATTRIB_NAME) : $(m, "Invalid attribute name");
              continue;
            case v.ATTRIB_VALUE_UNQUOTED:
              if (!A(I)) {
                I === "&" ? m.state = v.ATTRIB_VALUE_ENTITY_U : m.attribValue += I;
                continue;
              }
              ne(m), I === ">" ? ce(m) : m.state = v.ATTRIB;
              continue;
            case v.CLOSE_TAG:
              if (m.tagName)
                I === ">" ? ue(m) : S(T, I) ? m.tagName += I : m.script ? (m.script += "</" + m.tagName, m.tagName = "", m.state = v.SCRIPT) : (D(I) || $(m, "Invalid tagname in closing tag"), m.state = v.CLOSE_TAG_SAW_WHITE);
              else {
                if (D(I))
                  continue;
                R(p, I) ? m.script ? (m.script += "</" + I, m.state = v.SCRIPT) : $(m, "Invalid tagname in closing tag.") : m.tagName = I;
              }
              continue;
            case v.CLOSE_TAG_SAW_WHITE:
              if (D(I))
                continue;
              I === ">" ? ue(m) : $(m, "Invalid characters in closing tag");
              continue;
            case v.TEXT_ENTITY:
            case v.ATTRIB_VALUE_ENTITY_Q:
            case v.ATTRIB_VALUE_ENTITY_U:
              var pe, _e;
              switch (m.state) {
                case v.TEXT_ENTITY:
                  pe = v.TEXT, _e = "textNode";
                  break;
                case v.ATTRIB_VALUE_ENTITY_Q:
                  pe = v.ATTRIB_VALUE_QUOTED, _e = "attribValue";
                  break;
                case v.ATTRIB_VALUE_ENTITY_U:
                  pe = v.ATTRIB_VALUE_UNQUOTED, _e = "attribValue";
                  break;
              }
              if (I === ";") {
                var ve = ie(m);
                m.opt.unparsedEntities && !Object.values(e.XML_ENTITIES).includes(ve) ? (m.entity = "", m.state = pe, m.write(ve)) : (m[_e] += ve, m.entity = "", m.state = pe);
              } else S(m.entity.length ? O : b, I) ? m.entity += I : ($(m, "Invalid character in entity name"), m[_e] += "&" + m.entity + I, m.entity = "", m.state = pe);
              continue;
            default:
              throw new Error(m, "Unknown state: " + m.state);
          }
        return m.position >= m.bufferCheckPosition && d(m), m;
      }
      /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
      String.fromCodePoint || function() {
        var _ = String.fromCharCode, m = Math.floor, j = function() {
          var I = 16384, le = [], ge, pe, _e = -1, ve = arguments.length;
          if (!ve)
            return "";
          for (var Ue = ""; ++_e < ve; ) {
            var De = Number(arguments[_e]);
            if (!isFinite(De) || // `NaN`, `+Infinity`, or `-Infinity`
            De < 0 || // not a valid Unicode code point
            De > 1114111 || // not a valid Unicode code point
            m(De) !== De)
              throw RangeError("Invalid code point: " + De);
            De <= 65535 ? le.push(De) : (De -= 65536, ge = (De >> 10) + 55296, pe = De % 1024 + 56320, le.push(ge, pe)), (_e + 1 === ve || le.length > I) && (Ue += _.apply(null, le), le.length = 0);
          }
          return Ue;
        };
        Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
          value: j,
          configurable: !0,
          writable: !0
        }) : String.fromCodePoint = j;
      }();
    })(t);
  }(kn)), kn;
}
var Co;
function Yc() {
  if (Co) return xt;
  Co = 1, Object.defineProperty(xt, "__esModule", { value: !0 }), xt.XElement = void 0, xt.parseXml = n;
  const t = zc(), e = Gr();
  class a {
    constructor(o) {
      if (this.name = o, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !o)
        throw (0, e.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
      if (!d(o))
        throw (0, e.newError)(`Invalid element name: ${o}`, "ERR_XML_ELEMENT_INVALID_NAME");
    }
    attribute(o) {
      const u = this.attributes === null ? null : this.attributes[o];
      if (u == null)
        throw (0, e.newError)(`No attribute "${o}"`, "ERR_XML_MISSED_ATTRIBUTE");
      return u;
    }
    removeAttribute(o) {
      this.attributes !== null && delete this.attributes[o];
    }
    element(o, u = !1, s = null) {
      const f = this.elementOrNull(o, u);
      if (f === null)
        throw (0, e.newError)(s || `No element "${o}"`, "ERR_XML_MISSED_ELEMENT");
      return f;
    }
    elementOrNull(o, u = !1) {
      if (this.elements === null)
        return null;
      for (const s of this.elements)
        if (l(s, o, u))
          return s;
      return null;
    }
    getElements(o, u = !1) {
      return this.elements === null ? [] : this.elements.filter((s) => l(s, o, u));
    }
    elementValueOrEmpty(o, u = !1) {
      const s = this.elementOrNull(o, u);
      return s === null ? "" : s.value;
    }
  }
  xt.XElement = a;
  const c = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
  function d(h) {
    return c.test(h);
  }
  function l(h, o, u) {
    const s = h.name;
    return s === o || u === !0 && s.length === o.length && s.toLowerCase() === o.toLowerCase();
  }
  function n(h) {
    let o = null;
    const u = t.parser(!0, {}), s = [];
    return u.onopentag = (f) => {
      const i = new a(f.name);
      if (i.attributes = f.attributes, o === null)
        o = i;
      else {
        const g = s[s.length - 1];
        g.elements == null && (g.elements = []), g.elements.push(i);
      }
      s.push(i);
    }, u.onclosetag = () => {
      s.pop();
    }, u.ontext = (f) => {
      s.length > 0 && (s[s.length - 1].value = f);
    }, u.oncdata = (f) => {
      const i = s[s.length - 1];
      i.value = f, i.isCData = !0;
    }, u.onerror = (f) => {
      throw f;
    }, u.write(h), o;
  }
  return xt;
}
var Oo;
function Be() {
  return Oo || (Oo = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.CURRENT_APP_PACKAGE_FILE_NAME = t.CURRENT_APP_INSTALLER_FILE_NAME = t.XElement = t.parseXml = t.UUID = t.parseDn = t.retry = t.githubUrl = t.getS3LikeProviderBaseUrl = t.ProgressCallbackTransform = t.MemoLazy = t.safeStringifyJson = t.safeGetHeader = t.parseJson = t.HttpExecutor = t.HttpError = t.DigestTransform = t.createHttpError = t.configureRequestUrl = t.configureRequestOptionsFromUrl = t.configureRequestOptions = t.newError = t.CancellationToken = t.CancellationError = void 0, t.asArray = f;
    var e = aa();
    Object.defineProperty(t, "CancellationError", { enumerable: !0, get: function() {
      return e.CancellationError;
    } }), Object.defineProperty(t, "CancellationToken", { enumerable: !0, get: function() {
      return e.CancellationToken;
    } });
    var a = Gr();
    Object.defineProperty(t, "newError", { enumerable: !0, get: function() {
      return a.newError;
    } });
    var c = qc();
    Object.defineProperty(t, "configureRequestOptions", { enumerable: !0, get: function() {
      return c.configureRequestOptions;
    } }), Object.defineProperty(t, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
      return c.configureRequestOptionsFromUrl;
    } }), Object.defineProperty(t, "configureRequestUrl", { enumerable: !0, get: function() {
      return c.configureRequestUrl;
    } }), Object.defineProperty(t, "createHttpError", { enumerable: !0, get: function() {
      return c.createHttpError;
    } }), Object.defineProperty(t, "DigestTransform", { enumerable: !0, get: function() {
      return c.DigestTransform;
    } }), Object.defineProperty(t, "HttpError", { enumerable: !0, get: function() {
      return c.HttpError;
    } }), Object.defineProperty(t, "HttpExecutor", { enumerable: !0, get: function() {
      return c.HttpExecutor;
    } }), Object.defineProperty(t, "parseJson", { enumerable: !0, get: function() {
      return c.parseJson;
    } }), Object.defineProperty(t, "safeGetHeader", { enumerable: !0, get: function() {
      return c.safeGetHeader;
    } }), Object.defineProperty(t, "safeStringifyJson", { enumerable: !0, get: function() {
      return c.safeStringifyJson;
    } });
    var d = Bc();
    Object.defineProperty(t, "MemoLazy", { enumerable: !0, get: function() {
      return d.MemoLazy;
    } });
    var l = $l();
    Object.defineProperty(t, "ProgressCallbackTransform", { enumerable: !0, get: function() {
      return l.ProgressCallbackTransform;
    } });
    var n = jc();
    Object.defineProperty(t, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
      return n.getS3LikeProviderBaseUrl;
    } }), Object.defineProperty(t, "githubUrl", { enumerable: !0, get: function() {
      return n.githubUrl;
    } });
    var h = Hc();
    Object.defineProperty(t, "retry", { enumerable: !0, get: function() {
      return h.retry;
    } });
    var o = Gc();
    Object.defineProperty(t, "parseDn", { enumerable: !0, get: function() {
      return o.parseDn;
    } });
    var u = Wc();
    Object.defineProperty(t, "UUID", { enumerable: !0, get: function() {
      return u.UUID;
    } });
    var s = Yc();
    Object.defineProperty(t, "parseXml", { enumerable: !0, get: function() {
      return s.parseXml;
    } }), Object.defineProperty(t, "XElement", { enumerable: !0, get: function() {
      return s.XElement;
    } }), t.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", t.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
    function f(i) {
      return i == null ? [] : Array.isArray(i) ? i : [i];
    }
  }(Fn)), Fn;
}
var We = {}, Ur = {}, gt = {}, Do;
function yr() {
  if (Do) return gt;
  Do = 1;
  function t(n) {
    return typeof n > "u" || n === null;
  }
  function e(n) {
    return typeof n == "object" && n !== null;
  }
  function a(n) {
    return Array.isArray(n) ? n : t(n) ? [] : [n];
  }
  function c(n, h) {
    var o, u, s, f;
    if (h)
      for (f = Object.keys(h), o = 0, u = f.length; o < u; o += 1)
        s = f[o], n[s] = h[s];
    return n;
  }
  function d(n, h) {
    var o = "", u;
    for (u = 0; u < h; u += 1)
      o += n;
    return o;
  }
  function l(n) {
    return n === 0 && Number.NEGATIVE_INFINITY === 1 / n;
  }
  return gt.isNothing = t, gt.isObject = e, gt.toArray = a, gt.repeat = d, gt.isNegativeZero = l, gt.extend = c, gt;
}
var Mn, Po;
function vr() {
  if (Po) return Mn;
  Po = 1;
  function t(a, c) {
    var d = "", l = a.reason || "(unknown reason)";
    return a.mark ? (a.mark.name && (d += 'in "' + a.mark.name + '" '), d += "(" + (a.mark.line + 1) + ":" + (a.mark.column + 1) + ")", !c && a.mark.snippet && (d += `

` + a.mark.snippet), l + " " + d) : l;
  }
  function e(a, c) {
    Error.call(this), this.name = "YAMLException", this.reason = a, this.mark = c, this.message = t(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return e.prototype = Object.create(Error.prototype), e.prototype.constructor = e, e.prototype.toString = function(c) {
    return this.name + ": " + t(this, c);
  }, Mn = e, Mn;
}
var qn, Io;
function Vc() {
  if (Io) return qn;
  Io = 1;
  var t = yr();
  function e(d, l, n, h, o) {
    var u = "", s = "", f = Math.floor(o / 2) - 1;
    return h - l > f && (u = " ... ", l = h - f + u.length), n - h > f && (s = " ...", n = h + f - s.length), {
      str: u + d.slice(l, n).replace(/\t/g, "→") + s,
      pos: h - l + u.length
      // relative position
    };
  }
  function a(d, l) {
    return t.repeat(" ", l - d.length) + d;
  }
  function c(d, l) {
    if (l = Object.create(l || null), !d.buffer) return null;
    l.maxLength || (l.maxLength = 79), typeof l.indent != "number" && (l.indent = 1), typeof l.linesBefore != "number" && (l.linesBefore = 3), typeof l.linesAfter != "number" && (l.linesAfter = 2);
    for (var n = /\r?\n|\r|\0/g, h = [0], o = [], u, s = -1; u = n.exec(d.buffer); )
      o.push(u.index), h.push(u.index + u[0].length), d.position <= u.index && s < 0 && (s = h.length - 2);
    s < 0 && (s = h.length - 1);
    var f = "", i, g, E = Math.min(d.line + l.linesAfter, o.length).toString().length, y = l.maxLength - (l.indent + E + 3);
    for (i = 1; i <= l.linesBefore && !(s - i < 0); i++)
      g = e(
        d.buffer,
        h[s - i],
        o[s - i],
        d.position - (h[s] - h[s - i]),
        y
      ), f = t.repeat(" ", l.indent) + a((d.line - i + 1).toString(), E) + " | " + g.str + `
` + f;
    for (g = e(d.buffer, h[s], o[s], d.position, y), f += t.repeat(" ", l.indent) + a((d.line + 1).toString(), E) + " | " + g.str + `
`, f += t.repeat("-", l.indent + E + 3 + g.pos) + `^
`, i = 1; i <= l.linesAfter && !(s + i >= o.length); i++)
      g = e(
        d.buffer,
        h[s + i],
        o[s + i],
        d.position - (h[s] - h[s + i]),
        y
      ), f += t.repeat(" ", l.indent) + a((d.line + i + 1).toString(), E) + " | " + g.str + `
`;
    return f.replace(/\n$/, "");
  }
  return qn = c, qn;
}
var Bn, No;
function ze() {
  if (No) return Bn;
  No = 1;
  var t = vr(), e = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ], a = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function c(l) {
    var n = {};
    return l !== null && Object.keys(l).forEach(function(h) {
      l[h].forEach(function(o) {
        n[String(o)] = h;
      });
    }), n;
  }
  function d(l, n) {
    if (n = n || {}, Object.keys(n).forEach(function(h) {
      if (e.indexOf(h) === -1)
        throw new t('Unknown option "' + h + '" is met in definition of "' + l + '" YAML type.');
    }), this.options = n, this.tag = l, this.kind = n.kind || null, this.resolve = n.resolve || function() {
      return !0;
    }, this.construct = n.construct || function(h) {
      return h;
    }, this.instanceOf = n.instanceOf || null, this.predicate = n.predicate || null, this.represent = n.represent || null, this.representName = n.representName || null, this.defaultStyle = n.defaultStyle || null, this.multi = n.multi || !1, this.styleAliases = c(n.styleAliases || null), a.indexOf(this.kind) === -1)
      throw new t('Unknown kind "' + this.kind + '" is specified for "' + l + '" YAML type.');
  }
  return Bn = d, Bn;
}
var jn, Fo;
function kl() {
  if (Fo) return jn;
  Fo = 1;
  var t = vr(), e = ze();
  function a(l, n) {
    var h = [];
    return l[n].forEach(function(o) {
      var u = h.length;
      h.forEach(function(s, f) {
        s.tag === o.tag && s.kind === o.kind && s.multi === o.multi && (u = f);
      }), h[u] = o;
    }), h;
  }
  function c() {
    var l = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    }, n, h;
    function o(u) {
      u.multi ? (l.multi[u.kind].push(u), l.multi.fallback.push(u)) : l[u.kind][u.tag] = l.fallback[u.tag] = u;
    }
    for (n = 0, h = arguments.length; n < h; n += 1)
      arguments[n].forEach(o);
    return l;
  }
  function d(l) {
    return this.extend(l);
  }
  return d.prototype.extend = function(n) {
    var h = [], o = [];
    if (n instanceof e)
      o.push(n);
    else if (Array.isArray(n))
      o = o.concat(n);
    else if (n && (Array.isArray(n.implicit) || Array.isArray(n.explicit)))
      n.implicit && (h = h.concat(n.implicit)), n.explicit && (o = o.concat(n.explicit));
    else
      throw new t("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    h.forEach(function(s) {
      if (!(s instanceof e))
        throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (s.loadKind && s.loadKind !== "scalar")
        throw new t("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (s.multi)
        throw new t("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), o.forEach(function(s) {
      if (!(s instanceof e))
        throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    var u = Object.create(d.prototype);
    return u.implicit = (this.implicit || []).concat(h), u.explicit = (this.explicit || []).concat(o), u.compiledImplicit = a(u, "implicit"), u.compiledExplicit = a(u, "explicit"), u.compiledTypeMap = c(u.compiledImplicit, u.compiledExplicit), u;
  }, jn = d, jn;
}
var Hn, Lo;
function Ml() {
  if (Lo) return Hn;
  Lo = 1;
  var t = ze();
  return Hn = new t("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(e) {
      return e !== null ? e : "";
    }
  }), Hn;
}
var Gn, xo;
function ql() {
  if (xo) return Gn;
  xo = 1;
  var t = ze();
  return Gn = new t("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(e) {
      return e !== null ? e : [];
    }
  }), Gn;
}
var Wn, Uo;
function Bl() {
  if (Uo) return Wn;
  Uo = 1;
  var t = ze();
  return Wn = new t("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(e) {
      return e !== null ? e : {};
    }
  }), Wn;
}
var zn, $o;
function jl() {
  if ($o) return zn;
  $o = 1;
  var t = kl();
  return zn = new t({
    explicit: [
      Ml(),
      ql(),
      Bl()
    ]
  }), zn;
}
var Yn, ko;
function Hl() {
  if (ko) return Yn;
  ko = 1;
  var t = ze();
  function e(d) {
    if (d === null) return !0;
    var l = d.length;
    return l === 1 && d === "~" || l === 4 && (d === "null" || d === "Null" || d === "NULL");
  }
  function a() {
    return null;
  }
  function c(d) {
    return d === null;
  }
  return Yn = new t("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: e,
    construct: a,
    predicate: c,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  }), Yn;
}
var Vn, Mo;
function Gl() {
  if (Mo) return Vn;
  Mo = 1;
  var t = ze();
  function e(d) {
    if (d === null) return !1;
    var l = d.length;
    return l === 4 && (d === "true" || d === "True" || d === "TRUE") || l === 5 && (d === "false" || d === "False" || d === "FALSE");
  }
  function a(d) {
    return d === "true" || d === "True" || d === "TRUE";
  }
  function c(d) {
    return Object.prototype.toString.call(d) === "[object Boolean]";
  }
  return Vn = new t("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: e,
    construct: a,
    predicate: c,
    represent: {
      lowercase: function(d) {
        return d ? "true" : "false";
      },
      uppercase: function(d) {
        return d ? "TRUE" : "FALSE";
      },
      camelcase: function(d) {
        return d ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  }), Vn;
}
var Xn, qo;
function Wl() {
  if (qo) return Xn;
  qo = 1;
  var t = yr(), e = ze();
  function a(o) {
    return 48 <= o && o <= 57 || 65 <= o && o <= 70 || 97 <= o && o <= 102;
  }
  function c(o) {
    return 48 <= o && o <= 55;
  }
  function d(o) {
    return 48 <= o && o <= 57;
  }
  function l(o) {
    if (o === null) return !1;
    var u = o.length, s = 0, f = !1, i;
    if (!u) return !1;
    if (i = o[s], (i === "-" || i === "+") && (i = o[++s]), i === "0") {
      if (s + 1 === u) return !0;
      if (i = o[++s], i === "b") {
        for (s++; s < u; s++)
          if (i = o[s], i !== "_") {
            if (i !== "0" && i !== "1") return !1;
            f = !0;
          }
        return f && i !== "_";
      }
      if (i === "x") {
        for (s++; s < u; s++)
          if (i = o[s], i !== "_") {
            if (!a(o.charCodeAt(s))) return !1;
            f = !0;
          }
        return f && i !== "_";
      }
      if (i === "o") {
        for (s++; s < u; s++)
          if (i = o[s], i !== "_") {
            if (!c(o.charCodeAt(s))) return !1;
            f = !0;
          }
        return f && i !== "_";
      }
    }
    if (i === "_") return !1;
    for (; s < u; s++)
      if (i = o[s], i !== "_") {
        if (!d(o.charCodeAt(s)))
          return !1;
        f = !0;
      }
    return !(!f || i === "_");
  }
  function n(o) {
    var u = o, s = 1, f;
    if (u.indexOf("_") !== -1 && (u = u.replace(/_/g, "")), f = u[0], (f === "-" || f === "+") && (f === "-" && (s = -1), u = u.slice(1), f = u[0]), u === "0") return 0;
    if (f === "0") {
      if (u[1] === "b") return s * parseInt(u.slice(2), 2);
      if (u[1] === "x") return s * parseInt(u.slice(2), 16);
      if (u[1] === "o") return s * parseInt(u.slice(2), 8);
    }
    return s * parseInt(u, 10);
  }
  function h(o) {
    return Object.prototype.toString.call(o) === "[object Number]" && o % 1 === 0 && !t.isNegativeZero(o);
  }
  return Xn = new e("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: l,
    construct: n,
    predicate: h,
    represent: {
      binary: function(o) {
        return o >= 0 ? "0b" + o.toString(2) : "-0b" + o.toString(2).slice(1);
      },
      octal: function(o) {
        return o >= 0 ? "0o" + o.toString(8) : "-0o" + o.toString(8).slice(1);
      },
      decimal: function(o) {
        return o.toString(10);
      },
      /* eslint-disable max-len */
      hexadecimal: function(o) {
        return o >= 0 ? "0x" + o.toString(16).toUpperCase() : "-0x" + o.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  }), Xn;
}
var Kn, Bo;
function zl() {
  if (Bo) return Kn;
  Bo = 1;
  var t = yr(), e = ze(), a = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function c(o) {
    return !(o === null || !a.test(o) || // Quick hack to not allow integers end with `_`
    // Probably should update regexp & check speed
    o[o.length - 1] === "_");
  }
  function d(o) {
    var u, s;
    return u = o.replace(/_/g, "").toLowerCase(), s = u[0] === "-" ? -1 : 1, "+-".indexOf(u[0]) >= 0 && (u = u.slice(1)), u === ".inf" ? s === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : u === ".nan" ? NaN : s * parseFloat(u, 10);
  }
  var l = /^[-+]?[0-9]+e/;
  function n(o, u) {
    var s;
    if (isNaN(o))
      switch (u) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    else if (Number.POSITIVE_INFINITY === o)
      switch (u) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    else if (Number.NEGATIVE_INFINITY === o)
      switch (u) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    else if (t.isNegativeZero(o))
      return "-0.0";
    return s = o.toString(10), l.test(s) ? s.replace("e", ".e") : s;
  }
  function h(o) {
    return Object.prototype.toString.call(o) === "[object Number]" && (o % 1 !== 0 || t.isNegativeZero(o));
  }
  return Kn = new e("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: c,
    construct: d,
    predicate: h,
    represent: n,
    defaultStyle: "lowercase"
  }), Kn;
}
var Jn, jo;
function Yl() {
  return jo || (jo = 1, Jn = jl().extend({
    implicit: [
      Hl(),
      Gl(),
      Wl(),
      zl()
    ]
  })), Jn;
}
var Qn, Ho;
function Vl() {
  return Ho || (Ho = 1, Qn = Yl()), Qn;
}
var Zn, Go;
function Xl() {
  if (Go) return Zn;
  Go = 1;
  var t = ze(), e = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), a = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function c(n) {
    return n === null ? !1 : e.exec(n) !== null || a.exec(n) !== null;
  }
  function d(n) {
    var h, o, u, s, f, i, g, E = 0, y = null, p, T, b;
    if (h = e.exec(n), h === null && (h = a.exec(n)), h === null) throw new Error("Date resolve error");
    if (o = +h[1], u = +h[2] - 1, s = +h[3], !h[4])
      return new Date(Date.UTC(o, u, s));
    if (f = +h[4], i = +h[5], g = +h[6], h[7]) {
      for (E = h[7].slice(0, 3); E.length < 3; )
        E += "0";
      E = +E;
    }
    return h[9] && (p = +h[10], T = +(h[11] || 0), y = (p * 60 + T) * 6e4, h[9] === "-" && (y = -y)), b = new Date(Date.UTC(o, u, s, f, i, g, E)), y && b.setTime(b.getTime() - y), b;
  }
  function l(n) {
    return n.toISOString();
  }
  return Zn = new t("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: c,
    construct: d,
    instanceOf: Date,
    represent: l
  }), Zn;
}
var ei, Wo;
function Kl() {
  if (Wo) return ei;
  Wo = 1;
  var t = ze();
  function e(a) {
    return a === "<<" || a === null;
  }
  return ei = new t("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: e
  }), ei;
}
var ti, zo;
function Jl() {
  if (zo) return ti;
  zo = 1;
  var t = ze(), e = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function a(n) {
    if (n === null) return !1;
    var h, o, u = 0, s = n.length, f = e;
    for (o = 0; o < s; o++)
      if (h = f.indexOf(n.charAt(o)), !(h > 64)) {
        if (h < 0) return !1;
        u += 6;
      }
    return u % 8 === 0;
  }
  function c(n) {
    var h, o, u = n.replace(/[\r\n=]/g, ""), s = u.length, f = e, i = 0, g = [];
    for (h = 0; h < s; h++)
      h % 4 === 0 && h && (g.push(i >> 16 & 255), g.push(i >> 8 & 255), g.push(i & 255)), i = i << 6 | f.indexOf(u.charAt(h));
    return o = s % 4 * 6, o === 0 ? (g.push(i >> 16 & 255), g.push(i >> 8 & 255), g.push(i & 255)) : o === 18 ? (g.push(i >> 10 & 255), g.push(i >> 2 & 255)) : o === 12 && g.push(i >> 4 & 255), new Uint8Array(g);
  }
  function d(n) {
    var h = "", o = 0, u, s, f = n.length, i = e;
    for (u = 0; u < f; u++)
      u % 3 === 0 && u && (h += i[o >> 18 & 63], h += i[o >> 12 & 63], h += i[o >> 6 & 63], h += i[o & 63]), o = (o << 8) + n[u];
    return s = f % 3, s === 0 ? (h += i[o >> 18 & 63], h += i[o >> 12 & 63], h += i[o >> 6 & 63], h += i[o & 63]) : s === 2 ? (h += i[o >> 10 & 63], h += i[o >> 4 & 63], h += i[o << 2 & 63], h += i[64]) : s === 1 && (h += i[o >> 2 & 63], h += i[o << 4 & 63], h += i[64], h += i[64]), h;
  }
  function l(n) {
    return Object.prototype.toString.call(n) === "[object Uint8Array]";
  }
  return ti = new t("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: a,
    construct: c,
    predicate: l,
    represent: d
  }), ti;
}
var ri, Yo;
function Ql() {
  if (Yo) return ri;
  Yo = 1;
  var t = ze(), e = Object.prototype.hasOwnProperty, a = Object.prototype.toString;
  function c(l) {
    if (l === null) return !0;
    var n = [], h, o, u, s, f, i = l;
    for (h = 0, o = i.length; h < o; h += 1) {
      if (u = i[h], f = !1, a.call(u) !== "[object Object]") return !1;
      for (s in u)
        if (e.call(u, s))
          if (!f) f = !0;
          else return !1;
      if (!f) return !1;
      if (n.indexOf(s) === -1) n.push(s);
      else return !1;
    }
    return !0;
  }
  function d(l) {
    return l !== null ? l : [];
  }
  return ri = new t("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: c,
    construct: d
  }), ri;
}
var ni, Vo;
function Zl() {
  if (Vo) return ni;
  Vo = 1;
  var t = ze(), e = Object.prototype.toString;
  function a(d) {
    if (d === null) return !0;
    var l, n, h, o, u, s = d;
    for (u = new Array(s.length), l = 0, n = s.length; l < n; l += 1) {
      if (h = s[l], e.call(h) !== "[object Object]" || (o = Object.keys(h), o.length !== 1)) return !1;
      u[l] = [o[0], h[o[0]]];
    }
    return !0;
  }
  function c(d) {
    if (d === null) return [];
    var l, n, h, o, u, s = d;
    for (u = new Array(s.length), l = 0, n = s.length; l < n; l += 1)
      h = s[l], o = Object.keys(h), u[l] = [o[0], h[o[0]]];
    return u;
  }
  return ni = new t("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: a,
    construct: c
  }), ni;
}
var ii, Xo;
function eu() {
  if (Xo) return ii;
  Xo = 1;
  var t = ze(), e = Object.prototype.hasOwnProperty;
  function a(d) {
    if (d === null) return !0;
    var l, n = d;
    for (l in n)
      if (e.call(n, l) && n[l] !== null)
        return !1;
    return !0;
  }
  function c(d) {
    return d !== null ? d : {};
  }
  return ii = new t("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: a,
    construct: c
  }), ii;
}
var ai, Ko;
function oa() {
  return Ko || (Ko = 1, ai = Vl().extend({
    implicit: [
      Xl(),
      Kl()
    ],
    explicit: [
      Jl(),
      Ql(),
      Zl(),
      eu()
    ]
  })), ai;
}
var Jo;
function Xc() {
  if (Jo) return Ur;
  Jo = 1;
  var t = yr(), e = vr(), a = Vc(), c = oa(), d = Object.prototype.hasOwnProperty, l = 1, n = 2, h = 3, o = 4, u = 1, s = 2, f = 3, i = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, g = /[\x85\u2028\u2029]/, E = /[,\[\]\{\}]/, y = /^(?:!|!!|![a-z\-]+!)$/i, p = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
  function T(r) {
    return Object.prototype.toString.call(r);
  }
  function b(r) {
    return r === 10 || r === 13;
  }
  function O(r) {
    return r === 9 || r === 32;
  }
  function D(r) {
    return r === 9 || r === 32 || r === 10 || r === 13;
  }
  function q(r) {
    return r === 44 || r === 91 || r === 93 || r === 123 || r === 125;
  }
  function A(r) {
    var B;
    return 48 <= r && r <= 57 ? r - 48 : (B = r | 32, 97 <= B && B <= 102 ? B - 97 + 10 : -1);
  }
  function S(r) {
    return r === 120 ? 2 : r === 117 ? 4 : r === 85 ? 8 : 0;
  }
  function R(r) {
    return 48 <= r && r <= 57 ? r - 48 : -1;
  }
  function v(r) {
    return r === 48 ? "\0" : r === 97 ? "\x07" : r === 98 ? "\b" : r === 116 || r === 9 ? "	" : r === 110 ? `
` : r === 118 ? "\v" : r === 102 ? "\f" : r === 114 ? "\r" : r === 101 ? "\x1B" : r === 32 ? " " : r === 34 ? '"' : r === 47 ? "/" : r === 92 ? "\\" : r === 78 ? "" : r === 95 ? " " : r === 76 ? "\u2028" : r === 80 ? "\u2029" : "";
  }
  function M(r) {
    return r <= 65535 ? String.fromCharCode(r) : String.fromCharCode(
      (r - 65536 >> 10) + 55296,
      (r - 65536 & 1023) + 56320
    );
  }
  for (var U = new Array(256), x = new Array(256), k = 0; k < 256; k++)
    U[k] = v(k) ? 1 : 0, x[k] = v(k);
  function N(r, B) {
    this.input = r, this.filename = B.filename || null, this.schema = B.schema || c, this.onWarning = B.onWarning || null, this.legacy = B.legacy || !1, this.json = B.json || !1, this.listener = B.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = r.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
  }
  function P(r, B) {
    var G = {
      name: r.filename,
      buffer: r.input.slice(0, -1),
      // omit trailing \0
      position: r.position,
      line: r.line,
      column: r.position - r.lineStart
    };
    return G.snippet = a(G), new e(B, G);
  }
  function F(r, B) {
    throw P(r, B);
  }
  function $(r, B) {
    r.onWarning && r.onWarning.call(null, P(r, B));
  }
  var J = {
    YAML: function(B, G, re) {
      var z, te, Z;
      B.version !== null && F(B, "duplication of %YAML directive"), re.length !== 1 && F(B, "YAML directive accepts exactly one argument"), z = /^([0-9]+)\.([0-9]+)$/.exec(re[0]), z === null && F(B, "ill-formed argument of the YAML directive"), te = parseInt(z[1], 10), Z = parseInt(z[2], 10), te !== 1 && F(B, "unacceptable YAML version of the document"), B.version = re[0], B.checkLineBreaks = Z < 2, Z !== 1 && Z !== 2 && $(B, "unsupported YAML version of the document");
    },
    TAG: function(B, G, re) {
      var z, te;
      re.length !== 2 && F(B, "TAG directive accepts exactly two arguments"), z = re[0], te = re[1], y.test(z) || F(B, "ill-formed tag handle (first argument) of the TAG directive"), d.call(B.tagMap, z) && F(B, 'there is a previously declared suffix for "' + z + '" tag handle'), p.test(te) || F(B, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        te = decodeURIComponent(te);
      } catch {
        F(B, "tag prefix is malformed: " + te);
      }
      B.tagMap[z] = te;
    }
  };
  function W(r, B, G, re) {
    var z, te, Z, ae;
    if (B < G) {
      if (ae = r.input.slice(B, G), re)
        for (z = 0, te = ae.length; z < te; z += 1)
          Z = ae.charCodeAt(z), Z === 9 || 32 <= Z && Z <= 1114111 || F(r, "expected valid JSON character");
      else i.test(ae) && F(r, "the stream contains non-printable characters");
      r.result += ae;
    }
  }
  function ne(r, B, G, re) {
    var z, te, Z, ae;
    for (t.isObject(G) || F(r, "cannot merge mappings; the provided source object is unacceptable"), z = Object.keys(G), Z = 0, ae = z.length; Z < ae; Z += 1)
      te = z[Z], d.call(B, te) || (B[te] = G[te], re[te] = !0);
  }
  function ce(r, B, G, re, z, te, Z, ae, me) {
    var Ee, Ae;
    if (Array.isArray(z))
      for (z = Array.prototype.slice.call(z), Ee = 0, Ae = z.length; Ee < Ae; Ee += 1)
        Array.isArray(z[Ee]) && F(r, "nested arrays are not supported inside keys"), typeof z == "object" && T(z[Ee]) === "[object Object]" && (z[Ee] = "[object Object]");
    if (typeof z == "object" && T(z) === "[object Object]" && (z = "[object Object]"), z = String(z), B === null && (B = {}), re === "tag:yaml.org,2002:merge")
      if (Array.isArray(te))
        for (Ee = 0, Ae = te.length; Ee < Ae; Ee += 1)
          ne(r, B, te[Ee], G);
      else
        ne(r, B, te, G);
    else
      !r.json && !d.call(G, z) && d.call(B, z) && (r.line = Z || r.line, r.lineStart = ae || r.lineStart, r.position = me || r.position, F(r, "duplicated mapping key")), z === "__proto__" ? Object.defineProperty(B, z, {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        value: te
      }) : B[z] = te, delete G[z];
    return B;
  }
  function ue(r) {
    var B;
    B = r.input.charCodeAt(r.position), B === 10 ? r.position++ : B === 13 ? (r.position++, r.input.charCodeAt(r.position) === 10 && r.position++) : F(r, "a line break is expected"), r.line += 1, r.lineStart = r.position, r.firstTabInLine = -1;
  }
  function ie(r, B, G) {
    for (var re = 0, z = r.input.charCodeAt(r.position); z !== 0; ) {
      for (; O(z); )
        z === 9 && r.firstTabInLine === -1 && (r.firstTabInLine = r.position), z = r.input.charCodeAt(++r.position);
      if (B && z === 35)
        do
          z = r.input.charCodeAt(++r.position);
        while (z !== 10 && z !== 13 && z !== 0);
      if (b(z))
        for (ue(r), z = r.input.charCodeAt(r.position), re++, r.lineIndent = 0; z === 32; )
          r.lineIndent++, z = r.input.charCodeAt(++r.position);
      else
        break;
    }
    return G !== -1 && re !== 0 && r.lineIndent < G && $(r, "deficient indentation"), re;
  }
  function be(r) {
    var B = r.position, G;
    return G = r.input.charCodeAt(B), !!((G === 45 || G === 46) && G === r.input.charCodeAt(B + 1) && G === r.input.charCodeAt(B + 2) && (B += 3, G = r.input.charCodeAt(B), G === 0 || D(G)));
  }
  function K(r, B) {
    B === 1 ? r.result += " " : B > 1 && (r.result += t.repeat(`
`, B - 1));
  }
  function ye(r, B, G) {
    var re, z, te, Z, ae, me, Ee, Ae, de = r.kind, $e = r.result, w;
    if (w = r.input.charCodeAt(r.position), D(w) || q(w) || w === 35 || w === 38 || w === 42 || w === 33 || w === 124 || w === 62 || w === 39 || w === 34 || w === 37 || w === 64 || w === 96 || (w === 63 || w === 45) && (z = r.input.charCodeAt(r.position + 1), D(z) || G && q(z)))
      return !1;
    for (r.kind = "scalar", r.result = "", te = Z = r.position, ae = !1; w !== 0; ) {
      if (w === 58) {
        if (z = r.input.charCodeAt(r.position + 1), D(z) || G && q(z))
          break;
      } else if (w === 35) {
        if (re = r.input.charCodeAt(r.position - 1), D(re))
          break;
      } else {
        if (r.position === r.lineStart && be(r) || G && q(w))
          break;
        if (b(w))
          if (me = r.line, Ee = r.lineStart, Ae = r.lineIndent, ie(r, !1, -1), r.lineIndent >= B) {
            ae = !0, w = r.input.charCodeAt(r.position);
            continue;
          } else {
            r.position = Z, r.line = me, r.lineStart = Ee, r.lineIndent = Ae;
            break;
          }
      }
      ae && (W(r, te, Z, !1), K(r, r.line - me), te = Z = r.position, ae = !1), O(w) || (Z = r.position + 1), w = r.input.charCodeAt(++r.position);
    }
    return W(r, te, Z, !1), r.result ? !0 : (r.kind = de, r.result = $e, !1);
  }
  function _(r, B) {
    var G, re, z;
    if (G = r.input.charCodeAt(r.position), G !== 39)
      return !1;
    for (r.kind = "scalar", r.result = "", r.position++, re = z = r.position; (G = r.input.charCodeAt(r.position)) !== 0; )
      if (G === 39)
        if (W(r, re, r.position, !0), G = r.input.charCodeAt(++r.position), G === 39)
          re = r.position, r.position++, z = r.position;
        else
          return !0;
      else b(G) ? (W(r, re, z, !0), K(r, ie(r, !1, B)), re = z = r.position) : r.position === r.lineStart && be(r) ? F(r, "unexpected end of the document within a single quoted scalar") : (r.position++, z = r.position);
    F(r, "unexpected end of the stream within a single quoted scalar");
  }
  function m(r, B) {
    var G, re, z, te, Z, ae;
    if (ae = r.input.charCodeAt(r.position), ae !== 34)
      return !1;
    for (r.kind = "scalar", r.result = "", r.position++, G = re = r.position; (ae = r.input.charCodeAt(r.position)) !== 0; ) {
      if (ae === 34)
        return W(r, G, r.position, !0), r.position++, !0;
      if (ae === 92) {
        if (W(r, G, r.position, !0), ae = r.input.charCodeAt(++r.position), b(ae))
          ie(r, !1, B);
        else if (ae < 256 && U[ae])
          r.result += x[ae], r.position++;
        else if ((Z = S(ae)) > 0) {
          for (z = Z, te = 0; z > 0; z--)
            ae = r.input.charCodeAt(++r.position), (Z = A(ae)) >= 0 ? te = (te << 4) + Z : F(r, "expected hexadecimal character");
          r.result += M(te), r.position++;
        } else
          F(r, "unknown escape sequence");
        G = re = r.position;
      } else b(ae) ? (W(r, G, re, !0), K(r, ie(r, !1, B)), G = re = r.position) : r.position === r.lineStart && be(r) ? F(r, "unexpected end of the document within a double quoted scalar") : (r.position++, re = r.position);
    }
    F(r, "unexpected end of the stream within a double quoted scalar");
  }
  function j(r, B) {
    var G = !0, re, z, te, Z = r.tag, ae, me = r.anchor, Ee, Ae, de, $e, w, H = /* @__PURE__ */ Object.create(null), X, Y, Q, ee;
    if (ee = r.input.charCodeAt(r.position), ee === 91)
      Ae = 93, w = !1, ae = [];
    else if (ee === 123)
      Ae = 125, w = !0, ae = {};
    else
      return !1;
    for (r.anchor !== null && (r.anchorMap[r.anchor] = ae), ee = r.input.charCodeAt(++r.position); ee !== 0; ) {
      if (ie(r, !0, B), ee = r.input.charCodeAt(r.position), ee === Ae)
        return r.position++, r.tag = Z, r.anchor = me, r.kind = w ? "mapping" : "sequence", r.result = ae, !0;
      G ? ee === 44 && F(r, "expected the node content, but found ','") : F(r, "missed comma between flow collection entries"), Y = X = Q = null, de = $e = !1, ee === 63 && (Ee = r.input.charCodeAt(r.position + 1), D(Ee) && (de = $e = !0, r.position++, ie(r, !0, B))), re = r.line, z = r.lineStart, te = r.position, Ue(r, B, l, !1, !0), Y = r.tag, X = r.result, ie(r, !0, B), ee = r.input.charCodeAt(r.position), ($e || r.line === re) && ee === 58 && (de = !0, ee = r.input.charCodeAt(++r.position), ie(r, !0, B), Ue(r, B, l, !1, !0), Q = r.result), w ? ce(r, ae, H, Y, X, Q, re, z, te) : de ? ae.push(ce(r, null, H, Y, X, Q, re, z, te)) : ae.push(X), ie(r, !0, B), ee = r.input.charCodeAt(r.position), ee === 44 ? (G = !0, ee = r.input.charCodeAt(++r.position)) : G = !1;
    }
    F(r, "unexpected end of the stream within a flow collection");
  }
  function I(r, B) {
    var G, re, z = u, te = !1, Z = !1, ae = B, me = 0, Ee = !1, Ae, de;
    if (de = r.input.charCodeAt(r.position), de === 124)
      re = !1;
    else if (de === 62)
      re = !0;
    else
      return !1;
    for (r.kind = "scalar", r.result = ""; de !== 0; )
      if (de = r.input.charCodeAt(++r.position), de === 43 || de === 45)
        u === z ? z = de === 43 ? f : s : F(r, "repeat of a chomping mode identifier");
      else if ((Ae = R(de)) >= 0)
        Ae === 0 ? F(r, "bad explicit indentation width of a block scalar; it cannot be less than one") : Z ? F(r, "repeat of an indentation width identifier") : (ae = B + Ae - 1, Z = !0);
      else
        break;
    if (O(de)) {
      do
        de = r.input.charCodeAt(++r.position);
      while (O(de));
      if (de === 35)
        do
          de = r.input.charCodeAt(++r.position);
        while (!b(de) && de !== 0);
    }
    for (; de !== 0; ) {
      for (ue(r), r.lineIndent = 0, de = r.input.charCodeAt(r.position); (!Z || r.lineIndent < ae) && de === 32; )
        r.lineIndent++, de = r.input.charCodeAt(++r.position);
      if (!Z && r.lineIndent > ae && (ae = r.lineIndent), b(de)) {
        me++;
        continue;
      }
      if (r.lineIndent < ae) {
        z === f ? r.result += t.repeat(`
`, te ? 1 + me : me) : z === u && te && (r.result += `
`);
        break;
      }
      for (re ? O(de) ? (Ee = !0, r.result += t.repeat(`
`, te ? 1 + me : me)) : Ee ? (Ee = !1, r.result += t.repeat(`
`, me + 1)) : me === 0 ? te && (r.result += " ") : r.result += t.repeat(`
`, me) : r.result += t.repeat(`
`, te ? 1 + me : me), te = !0, Z = !0, me = 0, G = r.position; !b(de) && de !== 0; )
        de = r.input.charCodeAt(++r.position);
      W(r, G, r.position, !1);
    }
    return !0;
  }
  function le(r, B) {
    var G, re = r.tag, z = r.anchor, te = [], Z, ae = !1, me;
    if (r.firstTabInLine !== -1) return !1;
    for (r.anchor !== null && (r.anchorMap[r.anchor] = te), me = r.input.charCodeAt(r.position); me !== 0 && (r.firstTabInLine !== -1 && (r.position = r.firstTabInLine, F(r, "tab characters must not be used in indentation")), !(me !== 45 || (Z = r.input.charCodeAt(r.position + 1), !D(Z)))); ) {
      if (ae = !0, r.position++, ie(r, !0, -1) && r.lineIndent <= B) {
        te.push(null), me = r.input.charCodeAt(r.position);
        continue;
      }
      if (G = r.line, Ue(r, B, h, !1, !0), te.push(r.result), ie(r, !0, -1), me = r.input.charCodeAt(r.position), (r.line === G || r.lineIndent > B) && me !== 0)
        F(r, "bad indentation of a sequence entry");
      else if (r.lineIndent < B)
        break;
    }
    return ae ? (r.tag = re, r.anchor = z, r.kind = "sequence", r.result = te, !0) : !1;
  }
  function ge(r, B, G) {
    var re, z, te, Z, ae, me, Ee = r.tag, Ae = r.anchor, de = {}, $e = /* @__PURE__ */ Object.create(null), w = null, H = null, X = null, Y = !1, Q = !1, ee;
    if (r.firstTabInLine !== -1) return !1;
    for (r.anchor !== null && (r.anchorMap[r.anchor] = de), ee = r.input.charCodeAt(r.position); ee !== 0; ) {
      if (!Y && r.firstTabInLine !== -1 && (r.position = r.firstTabInLine, F(r, "tab characters must not be used in indentation")), re = r.input.charCodeAt(r.position + 1), te = r.line, (ee === 63 || ee === 58) && D(re))
        ee === 63 ? (Y && (ce(r, de, $e, w, H, null, Z, ae, me), w = H = X = null), Q = !0, Y = !0, z = !0) : Y ? (Y = !1, z = !0) : F(r, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), r.position += 1, ee = re;
      else {
        if (Z = r.line, ae = r.lineStart, me = r.position, !Ue(r, G, n, !1, !0))
          break;
        if (r.line === te) {
          for (ee = r.input.charCodeAt(r.position); O(ee); )
            ee = r.input.charCodeAt(++r.position);
          if (ee === 58)
            ee = r.input.charCodeAt(++r.position), D(ee) || F(r, "a whitespace character is expected after the key-value separator within a block mapping"), Y && (ce(r, de, $e, w, H, null, Z, ae, me), w = H = X = null), Q = !0, Y = !1, z = !1, w = r.tag, H = r.result;
          else if (Q)
            F(r, "can not read an implicit mapping pair; a colon is missed");
          else
            return r.tag = Ee, r.anchor = Ae, !0;
        } else if (Q)
          F(r, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return r.tag = Ee, r.anchor = Ae, !0;
      }
      if ((r.line === te || r.lineIndent > B) && (Y && (Z = r.line, ae = r.lineStart, me = r.position), Ue(r, B, o, !0, z) && (Y ? H = r.result : X = r.result), Y || (ce(r, de, $e, w, H, X, Z, ae, me), w = H = X = null), ie(r, !0, -1), ee = r.input.charCodeAt(r.position)), (r.line === te || r.lineIndent > B) && ee !== 0)
        F(r, "bad indentation of a mapping entry");
      else if (r.lineIndent < B)
        break;
    }
    return Y && ce(r, de, $e, w, H, null, Z, ae, me), Q && (r.tag = Ee, r.anchor = Ae, r.kind = "mapping", r.result = de), Q;
  }
  function pe(r) {
    var B, G = !1, re = !1, z, te, Z;
    if (Z = r.input.charCodeAt(r.position), Z !== 33) return !1;
    if (r.tag !== null && F(r, "duplication of a tag property"), Z = r.input.charCodeAt(++r.position), Z === 60 ? (G = !0, Z = r.input.charCodeAt(++r.position)) : Z === 33 ? (re = !0, z = "!!", Z = r.input.charCodeAt(++r.position)) : z = "!", B = r.position, G) {
      do
        Z = r.input.charCodeAt(++r.position);
      while (Z !== 0 && Z !== 62);
      r.position < r.length ? (te = r.input.slice(B, r.position), Z = r.input.charCodeAt(++r.position)) : F(r, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; Z !== 0 && !D(Z); )
        Z === 33 && (re ? F(r, "tag suffix cannot contain exclamation marks") : (z = r.input.slice(B - 1, r.position + 1), y.test(z) || F(r, "named tag handle cannot contain such characters"), re = !0, B = r.position + 1)), Z = r.input.charCodeAt(++r.position);
      te = r.input.slice(B, r.position), E.test(te) && F(r, "tag suffix cannot contain flow indicator characters");
    }
    te && !p.test(te) && F(r, "tag name cannot contain such characters: " + te);
    try {
      te = decodeURIComponent(te);
    } catch {
      F(r, "tag name is malformed: " + te);
    }
    return G ? r.tag = te : d.call(r.tagMap, z) ? r.tag = r.tagMap[z] + te : z === "!" ? r.tag = "!" + te : z === "!!" ? r.tag = "tag:yaml.org,2002:" + te : F(r, 'undeclared tag handle "' + z + '"'), !0;
  }
  function _e(r) {
    var B, G;
    if (G = r.input.charCodeAt(r.position), G !== 38) return !1;
    for (r.anchor !== null && F(r, "duplication of an anchor property"), G = r.input.charCodeAt(++r.position), B = r.position; G !== 0 && !D(G) && !q(G); )
      G = r.input.charCodeAt(++r.position);
    return r.position === B && F(r, "name of an anchor node must contain at least one character"), r.anchor = r.input.slice(B, r.position), !0;
  }
  function ve(r) {
    var B, G, re;
    if (re = r.input.charCodeAt(r.position), re !== 42) return !1;
    for (re = r.input.charCodeAt(++r.position), B = r.position; re !== 0 && !D(re) && !q(re); )
      re = r.input.charCodeAt(++r.position);
    return r.position === B && F(r, "name of an alias node must contain at least one character"), G = r.input.slice(B, r.position), d.call(r.anchorMap, G) || F(r, 'unidentified alias "' + G + '"'), r.result = r.anchorMap[G], ie(r, !0, -1), !0;
  }
  function Ue(r, B, G, re, z) {
    var te, Z, ae, me = 1, Ee = !1, Ae = !1, de, $e, w, H, X, Y;
    if (r.listener !== null && r.listener("open", r), r.tag = null, r.anchor = null, r.kind = null, r.result = null, te = Z = ae = o === G || h === G, re && ie(r, !0, -1) && (Ee = !0, r.lineIndent > B ? me = 1 : r.lineIndent === B ? me = 0 : r.lineIndent < B && (me = -1)), me === 1)
      for (; pe(r) || _e(r); )
        ie(r, !0, -1) ? (Ee = !0, ae = te, r.lineIndent > B ? me = 1 : r.lineIndent === B ? me = 0 : r.lineIndent < B && (me = -1)) : ae = !1;
    if (ae && (ae = Ee || z), (me === 1 || o === G) && (l === G || n === G ? X = B : X = B + 1, Y = r.position - r.lineStart, me === 1 ? ae && (le(r, Y) || ge(r, Y, X)) || j(r, X) ? Ae = !0 : (Z && I(r, X) || _(r, X) || m(r, X) ? Ae = !0 : ve(r) ? (Ae = !0, (r.tag !== null || r.anchor !== null) && F(r, "alias node should not have any properties")) : ye(r, X, l === G) && (Ae = !0, r.tag === null && (r.tag = "?")), r.anchor !== null && (r.anchorMap[r.anchor] = r.result)) : me === 0 && (Ae = ae && le(r, Y))), r.tag === null)
      r.anchor !== null && (r.anchorMap[r.anchor] = r.result);
    else if (r.tag === "?") {
      for (r.result !== null && r.kind !== "scalar" && F(r, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + r.kind + '"'), de = 0, $e = r.implicitTypes.length; de < $e; de += 1)
        if (H = r.implicitTypes[de], H.resolve(r.result)) {
          r.result = H.construct(r.result), r.tag = H.tag, r.anchor !== null && (r.anchorMap[r.anchor] = r.result);
          break;
        }
    } else if (r.tag !== "!") {
      if (d.call(r.typeMap[r.kind || "fallback"], r.tag))
        H = r.typeMap[r.kind || "fallback"][r.tag];
      else
        for (H = null, w = r.typeMap.multi[r.kind || "fallback"], de = 0, $e = w.length; de < $e; de += 1)
          if (r.tag.slice(0, w[de].tag.length) === w[de].tag) {
            H = w[de];
            break;
          }
      H || F(r, "unknown tag !<" + r.tag + ">"), r.result !== null && H.kind !== r.kind && F(r, "unacceptable node kind for !<" + r.tag + '> tag; it should be "' + H.kind + '", not "' + r.kind + '"'), H.resolve(r.result, r.tag) ? (r.result = H.construct(r.result, r.tag), r.anchor !== null && (r.anchorMap[r.anchor] = r.result)) : F(r, "cannot resolve a node with !<" + r.tag + "> explicit tag");
    }
    return r.listener !== null && r.listener("close", r), r.tag !== null || r.anchor !== null || Ae;
  }
  function De(r) {
    var B = r.position, G, re, z, te = !1, Z;
    for (r.version = null, r.checkLineBreaks = r.legacy, r.tagMap = /* @__PURE__ */ Object.create(null), r.anchorMap = /* @__PURE__ */ Object.create(null); (Z = r.input.charCodeAt(r.position)) !== 0 && (ie(r, !0, -1), Z = r.input.charCodeAt(r.position), !(r.lineIndent > 0 || Z !== 37)); ) {
      for (te = !0, Z = r.input.charCodeAt(++r.position), G = r.position; Z !== 0 && !D(Z); )
        Z = r.input.charCodeAt(++r.position);
      for (re = r.input.slice(G, r.position), z = [], re.length < 1 && F(r, "directive name must not be less than one character in length"); Z !== 0; ) {
        for (; O(Z); )
          Z = r.input.charCodeAt(++r.position);
        if (Z === 35) {
          do
            Z = r.input.charCodeAt(++r.position);
          while (Z !== 0 && !b(Z));
          break;
        }
        if (b(Z)) break;
        for (G = r.position; Z !== 0 && !D(Z); )
          Z = r.input.charCodeAt(++r.position);
        z.push(r.input.slice(G, r.position));
      }
      Z !== 0 && ue(r), d.call(J, re) ? J[re](r, re, z) : $(r, 'unknown document directive "' + re + '"');
    }
    if (ie(r, !0, -1), r.lineIndent === 0 && r.input.charCodeAt(r.position) === 45 && r.input.charCodeAt(r.position + 1) === 45 && r.input.charCodeAt(r.position + 2) === 45 ? (r.position += 3, ie(r, !0, -1)) : te && F(r, "directives end mark is expected"), Ue(r, r.lineIndent - 1, o, !1, !0), ie(r, !0, -1), r.checkLineBreaks && g.test(r.input.slice(B, r.position)) && $(r, "non-ASCII line breaks are interpreted as content"), r.documents.push(r.result), r.position === r.lineStart && be(r)) {
      r.input.charCodeAt(r.position) === 46 && (r.position += 3, ie(r, !0, -1));
      return;
    }
    if (r.position < r.length - 1)
      F(r, "end of the stream or a document separator is expected");
    else
      return;
  }
  function je(r, B) {
    r = String(r), B = B || {}, r.length !== 0 && (r.charCodeAt(r.length - 1) !== 10 && r.charCodeAt(r.length - 1) !== 13 && (r += `
`), r.charCodeAt(0) === 65279 && (r = r.slice(1)));
    var G = new N(r, B), re = r.indexOf("\0");
    for (re !== -1 && (G.position = re, F(G, "null byte is not allowed in input")), G.input += "\0"; G.input.charCodeAt(G.position) === 32; )
      G.lineIndent += 1, G.position += 1;
    for (; G.position < G.length - 1; )
      De(G);
    return G.documents;
  }
  function yt(r, B, G) {
    B !== null && typeof B == "object" && typeof G > "u" && (G = B, B = null);
    var re = je(r, G);
    if (typeof B != "function")
      return re;
    for (var z = 0, te = re.length; z < te; z += 1)
      B(re[z]);
  }
  function lt(r, B) {
    var G = je(r, B);
    if (G.length !== 0) {
      if (G.length === 1)
        return G[0];
      throw new e("expected a single document in the stream, but found more");
    }
  }
  return Ur.loadAll = yt, Ur.load = lt, Ur;
}
var oi = {}, Qo;
function Kc() {
  if (Qo) return oi;
  Qo = 1;
  var t = yr(), e = vr(), a = oa(), c = Object.prototype.toString, d = Object.prototype.hasOwnProperty, l = 65279, n = 9, h = 10, o = 13, u = 32, s = 33, f = 34, i = 35, g = 37, E = 38, y = 39, p = 42, T = 44, b = 45, O = 58, D = 61, q = 62, A = 63, S = 64, R = 91, v = 93, M = 96, U = 123, x = 124, k = 125, N = {};
  N[0] = "\\0", N[7] = "\\a", N[8] = "\\b", N[9] = "\\t", N[10] = "\\n", N[11] = "\\v", N[12] = "\\f", N[13] = "\\r", N[27] = "\\e", N[34] = '\\"', N[92] = "\\\\", N[133] = "\\N", N[160] = "\\_", N[8232] = "\\L", N[8233] = "\\P";
  var P = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ], F = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function $(w, H) {
    var X, Y, Q, ee, fe, oe, he;
    if (H === null) return {};
    for (X = {}, Y = Object.keys(H), Q = 0, ee = Y.length; Q < ee; Q += 1)
      fe = Y[Q], oe = String(H[fe]), fe.slice(0, 2) === "!!" && (fe = "tag:yaml.org,2002:" + fe.slice(2)), he = w.compiledTypeMap.fallback[fe], he && d.call(he.styleAliases, oe) && (oe = he.styleAliases[oe]), X[fe] = oe;
    return X;
  }
  function J(w) {
    var H, X, Y;
    if (H = w.toString(16).toUpperCase(), w <= 255)
      X = "x", Y = 2;
    else if (w <= 65535)
      X = "u", Y = 4;
    else if (w <= 4294967295)
      X = "U", Y = 8;
    else
      throw new e("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + X + t.repeat("0", Y - H.length) + H;
  }
  var W = 1, ne = 2;
  function ce(w) {
    this.schema = w.schema || a, this.indent = Math.max(1, w.indent || 2), this.noArrayIndent = w.noArrayIndent || !1, this.skipInvalid = w.skipInvalid || !1, this.flowLevel = t.isNothing(w.flowLevel) ? -1 : w.flowLevel, this.styleMap = $(this.schema, w.styles || null), this.sortKeys = w.sortKeys || !1, this.lineWidth = w.lineWidth || 80, this.noRefs = w.noRefs || !1, this.noCompatMode = w.noCompatMode || !1, this.condenseFlow = w.condenseFlow || !1, this.quotingType = w.quotingType === '"' ? ne : W, this.forceQuotes = w.forceQuotes || !1, this.replacer = typeof w.replacer == "function" ? w.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function ue(w, H) {
    for (var X = t.repeat(" ", H), Y = 0, Q = -1, ee = "", fe, oe = w.length; Y < oe; )
      Q = w.indexOf(`
`, Y), Q === -1 ? (fe = w.slice(Y), Y = oe) : (fe = w.slice(Y, Q + 1), Y = Q + 1), fe.length && fe !== `
` && (ee += X), ee += fe;
    return ee;
  }
  function ie(w, H) {
    return `
` + t.repeat(" ", w.indent * H);
  }
  function be(w, H) {
    var X, Y, Q;
    for (X = 0, Y = w.implicitTypes.length; X < Y; X += 1)
      if (Q = w.implicitTypes[X], Q.resolve(H))
        return !0;
    return !1;
  }
  function K(w) {
    return w === u || w === n;
  }
  function ye(w) {
    return 32 <= w && w <= 126 || 161 <= w && w <= 55295 && w !== 8232 && w !== 8233 || 57344 <= w && w <= 65533 && w !== l || 65536 <= w && w <= 1114111;
  }
  function _(w) {
    return ye(w) && w !== l && w !== o && w !== h;
  }
  function m(w, H, X) {
    var Y = _(w), Q = Y && !K(w);
    return (
      // ns-plain-safe
      (X ? (
        // c = flow-in
        Y
      ) : Y && w !== T && w !== R && w !== v && w !== U && w !== k) && w !== i && !(H === O && !Q) || _(H) && !K(H) && w === i || H === O && Q
    );
  }
  function j(w) {
    return ye(w) && w !== l && !K(w) && w !== b && w !== A && w !== O && w !== T && w !== R && w !== v && w !== U && w !== k && w !== i && w !== E && w !== p && w !== s && w !== x && w !== D && w !== q && w !== y && w !== f && w !== g && w !== S && w !== M;
  }
  function I(w) {
    return !K(w) && w !== O;
  }
  function le(w, H) {
    var X = w.charCodeAt(H), Y;
    return X >= 55296 && X <= 56319 && H + 1 < w.length && (Y = w.charCodeAt(H + 1), Y >= 56320 && Y <= 57343) ? (X - 55296) * 1024 + Y - 56320 + 65536 : X;
  }
  function ge(w) {
    var H = /^\n* /;
    return H.test(w);
  }
  var pe = 1, _e = 2, ve = 3, Ue = 4, De = 5;
  function je(w, H, X, Y, Q, ee, fe, oe) {
    var he, we = 0, Pe = null, Fe = !1, Ce = !1, Ft = Y !== -1, tt = -1, vt = j(le(w, 0)) && I(le(w, w.length - 1));
    if (H || fe)
      for (he = 0; he < w.length; we >= 65536 ? he += 2 : he++) {
        if (we = le(w, he), !ye(we))
          return De;
        vt = vt && m(we, Pe, oe), Pe = we;
      }
    else {
      for (he = 0; he < w.length; we >= 65536 ? he += 2 : he++) {
        if (we = le(w, he), we === h)
          Fe = !0, Ft && (Ce = Ce || // Foldable line = too long, and not more-indented.
          he - tt - 1 > Y && w[tt + 1] !== " ", tt = he);
        else if (!ye(we))
          return De;
        vt = vt && m(we, Pe, oe), Pe = we;
      }
      Ce = Ce || Ft && he - tt - 1 > Y && w[tt + 1] !== " ";
    }
    return !Fe && !Ce ? vt && !fe && !Q(w) ? pe : ee === ne ? De : _e : X > 9 && ge(w) ? De : fe ? ee === ne ? De : _e : Ce ? Ue : ve;
  }
  function yt(w, H, X, Y, Q) {
    w.dump = function() {
      if (H.length === 0)
        return w.quotingType === ne ? '""' : "''";
      if (!w.noCompatMode && (P.indexOf(H) !== -1 || F.test(H)))
        return w.quotingType === ne ? '"' + H + '"' : "'" + H + "'";
      var ee = w.indent * Math.max(1, X), fe = w.lineWidth === -1 ? -1 : Math.max(Math.min(w.lineWidth, 40), w.lineWidth - ee), oe = Y || w.flowLevel > -1 && X >= w.flowLevel;
      function he(we) {
        return be(w, we);
      }
      switch (je(
        H,
        oe,
        w.indent,
        fe,
        he,
        w.quotingType,
        w.forceQuotes && !Y,
        Q
      )) {
        case pe:
          return H;
        case _e:
          return "'" + H.replace(/'/g, "''") + "'";
        case ve:
          return "|" + lt(H, w.indent) + r(ue(H, ee));
        case Ue:
          return ">" + lt(H, w.indent) + r(ue(B(H, fe), ee));
        case De:
          return '"' + re(H) + '"';
        default:
          throw new e("impossible error: invalid scalar style");
      }
    }();
  }
  function lt(w, H) {
    var X = ge(w) ? String(H) : "", Y = w[w.length - 1] === `
`, Q = Y && (w[w.length - 2] === `
` || w === `
`), ee = Q ? "+" : Y ? "" : "-";
    return X + ee + `
`;
  }
  function r(w) {
    return w[w.length - 1] === `
` ? w.slice(0, -1) : w;
  }
  function B(w, H) {
    for (var X = /(\n+)([^\n]*)/g, Y = function() {
      var we = w.indexOf(`
`);
      return we = we !== -1 ? we : w.length, X.lastIndex = we, G(w.slice(0, we), H);
    }(), Q = w[0] === `
` || w[0] === " ", ee, fe; fe = X.exec(w); ) {
      var oe = fe[1], he = fe[2];
      ee = he[0] === " ", Y += oe + (!Q && !ee && he !== "" ? `
` : "") + G(he, H), Q = ee;
    }
    return Y;
  }
  function G(w, H) {
    if (w === "" || w[0] === " ") return w;
    for (var X = / [^ ]/g, Y, Q = 0, ee, fe = 0, oe = 0, he = ""; Y = X.exec(w); )
      oe = Y.index, oe - Q > H && (ee = fe > Q ? fe : oe, he += `
` + w.slice(Q, ee), Q = ee + 1), fe = oe;
    return he += `
`, w.length - Q > H && fe > Q ? he += w.slice(Q, fe) + `
` + w.slice(fe + 1) : he += w.slice(Q), he.slice(1);
  }
  function re(w) {
    for (var H = "", X = 0, Y, Q = 0; Q < w.length; X >= 65536 ? Q += 2 : Q++)
      X = le(w, Q), Y = N[X], !Y && ye(X) ? (H += w[Q], X >= 65536 && (H += w[Q + 1])) : H += Y || J(X);
    return H;
  }
  function z(w, H, X) {
    var Y = "", Q = w.tag, ee, fe, oe;
    for (ee = 0, fe = X.length; ee < fe; ee += 1)
      oe = X[ee], w.replacer && (oe = w.replacer.call(X, String(ee), oe)), (Ee(w, H, oe, !1, !1) || typeof oe > "u" && Ee(w, H, null, !1, !1)) && (Y !== "" && (Y += "," + (w.condenseFlow ? "" : " ")), Y += w.dump);
    w.tag = Q, w.dump = "[" + Y + "]";
  }
  function te(w, H, X, Y) {
    var Q = "", ee = w.tag, fe, oe, he;
    for (fe = 0, oe = X.length; fe < oe; fe += 1)
      he = X[fe], w.replacer && (he = w.replacer.call(X, String(fe), he)), (Ee(w, H + 1, he, !0, !0, !1, !0) || typeof he > "u" && Ee(w, H + 1, null, !0, !0, !1, !0)) && ((!Y || Q !== "") && (Q += ie(w, H)), w.dump && h === w.dump.charCodeAt(0) ? Q += "-" : Q += "- ", Q += w.dump);
    w.tag = ee, w.dump = Q || "[]";
  }
  function Z(w, H, X) {
    var Y = "", Q = w.tag, ee = Object.keys(X), fe, oe, he, we, Pe;
    for (fe = 0, oe = ee.length; fe < oe; fe += 1)
      Pe = "", Y !== "" && (Pe += ", "), w.condenseFlow && (Pe += '"'), he = ee[fe], we = X[he], w.replacer && (we = w.replacer.call(X, he, we)), Ee(w, H, he, !1, !1) && (w.dump.length > 1024 && (Pe += "? "), Pe += w.dump + (w.condenseFlow ? '"' : "") + ":" + (w.condenseFlow ? "" : " "), Ee(w, H, we, !1, !1) && (Pe += w.dump, Y += Pe));
    w.tag = Q, w.dump = "{" + Y + "}";
  }
  function ae(w, H, X, Y) {
    var Q = "", ee = w.tag, fe = Object.keys(X), oe, he, we, Pe, Fe, Ce;
    if (w.sortKeys === !0)
      fe.sort();
    else if (typeof w.sortKeys == "function")
      fe.sort(w.sortKeys);
    else if (w.sortKeys)
      throw new e("sortKeys must be a boolean or a function");
    for (oe = 0, he = fe.length; oe < he; oe += 1)
      Ce = "", (!Y || Q !== "") && (Ce += ie(w, H)), we = fe[oe], Pe = X[we], w.replacer && (Pe = w.replacer.call(X, we, Pe)), Ee(w, H + 1, we, !0, !0, !0) && (Fe = w.tag !== null && w.tag !== "?" || w.dump && w.dump.length > 1024, Fe && (w.dump && h === w.dump.charCodeAt(0) ? Ce += "?" : Ce += "? "), Ce += w.dump, Fe && (Ce += ie(w, H)), Ee(w, H + 1, Pe, !0, Fe) && (w.dump && h === w.dump.charCodeAt(0) ? Ce += ":" : Ce += ": ", Ce += w.dump, Q += Ce));
    w.tag = ee, w.dump = Q || "{}";
  }
  function me(w, H, X) {
    var Y, Q, ee, fe, oe, he;
    for (Q = X ? w.explicitTypes : w.implicitTypes, ee = 0, fe = Q.length; ee < fe; ee += 1)
      if (oe = Q[ee], (oe.instanceOf || oe.predicate) && (!oe.instanceOf || typeof H == "object" && H instanceof oe.instanceOf) && (!oe.predicate || oe.predicate(H))) {
        if (X ? oe.multi && oe.representName ? w.tag = oe.representName(H) : w.tag = oe.tag : w.tag = "?", oe.represent) {
          if (he = w.styleMap[oe.tag] || oe.defaultStyle, c.call(oe.represent) === "[object Function]")
            Y = oe.represent(H, he);
          else if (d.call(oe.represent, he))
            Y = oe.represent[he](H, he);
          else
            throw new e("!<" + oe.tag + '> tag resolver accepts not "' + he + '" style');
          w.dump = Y;
        }
        return !0;
      }
    return !1;
  }
  function Ee(w, H, X, Y, Q, ee, fe) {
    w.tag = null, w.dump = X, me(w, X, !1) || me(w, X, !0);
    var oe = c.call(w.dump), he = Y, we;
    Y && (Y = w.flowLevel < 0 || w.flowLevel > H);
    var Pe = oe === "[object Object]" || oe === "[object Array]", Fe, Ce;
    if (Pe && (Fe = w.duplicates.indexOf(X), Ce = Fe !== -1), (w.tag !== null && w.tag !== "?" || Ce || w.indent !== 2 && H > 0) && (Q = !1), Ce && w.usedDuplicates[Fe])
      w.dump = "*ref_" + Fe;
    else {
      if (Pe && Ce && !w.usedDuplicates[Fe] && (w.usedDuplicates[Fe] = !0), oe === "[object Object]")
        Y && Object.keys(w.dump).length !== 0 ? (ae(w, H, w.dump, Q), Ce && (w.dump = "&ref_" + Fe + w.dump)) : (Z(w, H, w.dump), Ce && (w.dump = "&ref_" + Fe + " " + w.dump));
      else if (oe === "[object Array]")
        Y && w.dump.length !== 0 ? (w.noArrayIndent && !fe && H > 0 ? te(w, H - 1, w.dump, Q) : te(w, H, w.dump, Q), Ce && (w.dump = "&ref_" + Fe + w.dump)) : (z(w, H, w.dump), Ce && (w.dump = "&ref_" + Fe + " " + w.dump));
      else if (oe === "[object String]")
        w.tag !== "?" && yt(w, w.dump, H, ee, he);
      else {
        if (oe === "[object Undefined]")
          return !1;
        if (w.skipInvalid) return !1;
        throw new e("unacceptable kind of an object to dump " + oe);
      }
      w.tag !== null && w.tag !== "?" && (we = encodeURI(
        w.tag[0] === "!" ? w.tag.slice(1) : w.tag
      ).replace(/!/g, "%21"), w.tag[0] === "!" ? we = "!" + we : we.slice(0, 18) === "tag:yaml.org,2002:" ? we = "!!" + we.slice(18) : we = "!<" + we + ">", w.dump = we + " " + w.dump);
    }
    return !0;
  }
  function Ae(w, H) {
    var X = [], Y = [], Q, ee;
    for (de(w, X, Y), Q = 0, ee = Y.length; Q < ee; Q += 1)
      H.duplicates.push(X[Y[Q]]);
    H.usedDuplicates = new Array(ee);
  }
  function de(w, H, X) {
    var Y, Q, ee;
    if (w !== null && typeof w == "object")
      if (Q = H.indexOf(w), Q !== -1)
        X.indexOf(Q) === -1 && X.push(Q);
      else if (H.push(w), Array.isArray(w))
        for (Q = 0, ee = w.length; Q < ee; Q += 1)
          de(w[Q], H, X);
      else
        for (Y = Object.keys(w), Q = 0, ee = Y.length; Q < ee; Q += 1)
          de(w[Y[Q]], H, X);
  }
  function $e(w, H) {
    H = H || {};
    var X = new ce(H);
    X.noRefs || Ae(w, X);
    var Y = w;
    return X.replacer && (Y = X.replacer.call({ "": Y }, "", Y)), Ee(X, 0, Y, !0, !0) ? X.dump + `
` : "";
  }
  return oi.dump = $e, oi;
}
var Zo;
function sa() {
  if (Zo) return We;
  Zo = 1;
  var t = Xc(), e = Kc();
  function a(c, d) {
    return function() {
      throw new Error("Function yaml." + c + " is removed in js-yaml 4. Use yaml." + d + " instead, which is now safe by default.");
    };
  }
  return We.Type = ze(), We.Schema = kl(), We.FAILSAFE_SCHEMA = jl(), We.JSON_SCHEMA = Yl(), We.CORE_SCHEMA = Vl(), We.DEFAULT_SCHEMA = oa(), We.load = t.load, We.loadAll = t.loadAll, We.dump = e.dump, We.YAMLException = vr(), We.types = {
    binary: Jl(),
    float: zl(),
    map: Bl(),
    null: Hl(),
    pairs: Zl(),
    set: eu(),
    timestamp: Xl(),
    bool: Gl(),
    int: Wl(),
    merge: Kl(),
    omap: Ql(),
    seq: ql(),
    str: Ml()
  }, We.safeLoad = a("safeLoad", "load"), We.safeLoadAll = a("safeLoadAll", "loadAll"), We.safeDump = a("safeDump", "dump"), We;
}
var Jt = {}, es;
function Jc() {
  if (es) return Jt;
  es = 1, Object.defineProperty(Jt, "__esModule", { value: !0 }), Jt.Lazy = void 0;
  class t {
    constructor(a) {
      this._value = null, this.creator = a;
    }
    get hasValue() {
      return this.creator == null;
    }
    get value() {
      if (this.creator == null)
        return this._value;
      const a = this.creator();
      return this.value = a, a;
    }
    set value(a) {
      this._value = a, this.creator = null;
    }
  }
  return Jt.Lazy = t, Jt;
}
var $r = { exports: {} }, si, ts;
function Wr() {
  if (ts) return si;
  ts = 1;
  const t = "2.0.0", e = 256, a = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991, c = 16, d = e - 6;
  return si = {
    MAX_LENGTH: e,
    MAX_SAFE_COMPONENT_LENGTH: c,
    MAX_SAFE_BUILD_LENGTH: d,
    MAX_SAFE_INTEGER: a,
    RELEASE_TYPES: [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ],
    SEMVER_SPEC_VERSION: t,
    FLAG_INCLUDE_PRERELEASE: 1,
    FLAG_LOOSE: 2
  }, si;
}
var li, rs;
function zr() {
  return rs || (rs = 1, li = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
  }), li;
}
var ns;
function wr() {
  return ns || (ns = 1, function(t, e) {
    const {
      MAX_SAFE_COMPONENT_LENGTH: a,
      MAX_SAFE_BUILD_LENGTH: c,
      MAX_LENGTH: d
    } = Wr(), l = zr();
    e = t.exports = {};
    const n = e.re = [], h = e.safeRe = [], o = e.src = [], u = e.safeSrc = [], s = e.t = {};
    let f = 0;
    const i = "[a-zA-Z0-9-]", g = [
      ["\\s", 1],
      ["\\d", d],
      [i, c]
    ], E = (p) => {
      for (const [T, b] of g)
        p = p.split(`${T}*`).join(`${T}{0,${b}}`).split(`${T}+`).join(`${T}{1,${b}}`);
      return p;
    }, y = (p, T, b) => {
      const O = E(T), D = f++;
      l(p, D, T), s[p] = D, o[D] = T, u[D] = O, n[D] = new RegExp(T, b ? "g" : void 0), h[D] = new RegExp(O, b ? "g" : void 0);
    };
    y("NUMERICIDENTIFIER", "0|[1-9]\\d*"), y("NUMERICIDENTIFIERLOOSE", "\\d+"), y("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${i}*`), y("MAINVERSION", `(${o[s.NUMERICIDENTIFIER]})\\.(${o[s.NUMERICIDENTIFIER]})\\.(${o[s.NUMERICIDENTIFIER]})`), y("MAINVERSIONLOOSE", `(${o[s.NUMERICIDENTIFIERLOOSE]})\\.(${o[s.NUMERICIDENTIFIERLOOSE]})\\.(${o[s.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASEIDENTIFIER", `(?:${o[s.NONNUMERICIDENTIFIER]}|${o[s.NUMERICIDENTIFIER]})`), y("PRERELEASEIDENTIFIERLOOSE", `(?:${o[s.NONNUMERICIDENTIFIER]}|${o[s.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASE", `(?:-(${o[s.PRERELEASEIDENTIFIER]}(?:\\.${o[s.PRERELEASEIDENTIFIER]})*))`), y("PRERELEASELOOSE", `(?:-?(${o[s.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${o[s.PRERELEASEIDENTIFIERLOOSE]})*))`), y("BUILDIDENTIFIER", `${i}+`), y("BUILD", `(?:\\+(${o[s.BUILDIDENTIFIER]}(?:\\.${o[s.BUILDIDENTIFIER]})*))`), y("FULLPLAIN", `v?${o[s.MAINVERSION]}${o[s.PRERELEASE]}?${o[s.BUILD]}?`), y("FULL", `^${o[s.FULLPLAIN]}$`), y("LOOSEPLAIN", `[v=\\s]*${o[s.MAINVERSIONLOOSE]}${o[s.PRERELEASELOOSE]}?${o[s.BUILD]}?`), y("LOOSE", `^${o[s.LOOSEPLAIN]}$`), y("GTLT", "((?:<|>)?=?)"), y("XRANGEIDENTIFIERLOOSE", `${o[s.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), y("XRANGEIDENTIFIER", `${o[s.NUMERICIDENTIFIER]}|x|X|\\*`), y("XRANGEPLAIN", `[v=\\s]*(${o[s.XRANGEIDENTIFIER]})(?:\\.(${o[s.XRANGEIDENTIFIER]})(?:\\.(${o[s.XRANGEIDENTIFIER]})(?:${o[s.PRERELEASE]})?${o[s.BUILD]}?)?)?`), y("XRANGEPLAINLOOSE", `[v=\\s]*(${o[s.XRANGEIDENTIFIERLOOSE]})(?:\\.(${o[s.XRANGEIDENTIFIERLOOSE]})(?:\\.(${o[s.XRANGEIDENTIFIERLOOSE]})(?:${o[s.PRERELEASELOOSE]})?${o[s.BUILD]}?)?)?`), y("XRANGE", `^${o[s.GTLT]}\\s*${o[s.XRANGEPLAIN]}$`), y("XRANGELOOSE", `^${o[s.GTLT]}\\s*${o[s.XRANGEPLAINLOOSE]}$`), y("COERCEPLAIN", `(^|[^\\d])(\\d{1,${a}})(?:\\.(\\d{1,${a}}))?(?:\\.(\\d{1,${a}}))?`), y("COERCE", `${o[s.COERCEPLAIN]}(?:$|[^\\d])`), y("COERCEFULL", o[s.COERCEPLAIN] + `(?:${o[s.PRERELEASE]})?(?:${o[s.BUILD]})?(?:$|[^\\d])`), y("COERCERTL", o[s.COERCE], !0), y("COERCERTLFULL", o[s.COERCEFULL], !0), y("LONETILDE", "(?:~>?)"), y("TILDETRIM", `(\\s*)${o[s.LONETILDE]}\\s+`, !0), e.tildeTrimReplace = "$1~", y("TILDE", `^${o[s.LONETILDE]}${o[s.XRANGEPLAIN]}$`), y("TILDELOOSE", `^${o[s.LONETILDE]}${o[s.XRANGEPLAINLOOSE]}$`), y("LONECARET", "(?:\\^)"), y("CARETTRIM", `(\\s*)${o[s.LONECARET]}\\s+`, !0), e.caretTrimReplace = "$1^", y("CARET", `^${o[s.LONECARET]}${o[s.XRANGEPLAIN]}$`), y("CARETLOOSE", `^${o[s.LONECARET]}${o[s.XRANGEPLAINLOOSE]}$`), y("COMPARATORLOOSE", `^${o[s.GTLT]}\\s*(${o[s.LOOSEPLAIN]})$|^$`), y("COMPARATOR", `^${o[s.GTLT]}\\s*(${o[s.FULLPLAIN]})$|^$`), y("COMPARATORTRIM", `(\\s*)${o[s.GTLT]}\\s*(${o[s.LOOSEPLAIN]}|${o[s.XRANGEPLAIN]})`, !0), e.comparatorTrimReplace = "$1$2$3", y("HYPHENRANGE", `^\\s*(${o[s.XRANGEPLAIN]})\\s+-\\s+(${o[s.XRANGEPLAIN]})\\s*$`), y("HYPHENRANGELOOSE", `^\\s*(${o[s.XRANGEPLAINLOOSE]})\\s+-\\s+(${o[s.XRANGEPLAINLOOSE]})\\s*$`), y("STAR", "(<|>)?=?\\s*\\*"), y("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), y("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }($r, $r.exports)), $r.exports;
}
var ui, is;
function la() {
  if (is) return ui;
  is = 1;
  const t = Object.freeze({ loose: !0 }), e = Object.freeze({});
  return ui = (c) => c ? typeof c != "object" ? t : c : e, ui;
}
var ci, as;
function tu() {
  if (as) return ci;
  as = 1;
  const t = /^[0-9]+$/, e = (c, d) => {
    const l = t.test(c), n = t.test(d);
    return l && n && (c = +c, d = +d), c === d ? 0 : l && !n ? -1 : n && !l ? 1 : c < d ? -1 : 1;
  };
  return ci = {
    compareIdentifiers: e,
    rcompareIdentifiers: (c, d) => e(d, c)
  }, ci;
}
var fi, os;
function Ye() {
  if (os) return fi;
  os = 1;
  const t = zr(), { MAX_LENGTH: e, MAX_SAFE_INTEGER: a } = Wr(), { safeRe: c, t: d } = wr(), l = la(), { compareIdentifiers: n } = tu();
  class h {
    constructor(u, s) {
      if (s = l(s), u instanceof h) {
        if (u.loose === !!s.loose && u.includePrerelease === !!s.includePrerelease)
          return u;
        u = u.version;
      } else if (typeof u != "string")
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof u}".`);
      if (u.length > e)
        throw new TypeError(
          `version is longer than ${e} characters`
        );
      t("SemVer", u, s), this.options = s, this.loose = !!s.loose, this.includePrerelease = !!s.includePrerelease;
      const f = u.trim().match(s.loose ? c[d.LOOSE] : c[d.FULL]);
      if (!f)
        throw new TypeError(`Invalid Version: ${u}`);
      if (this.raw = u, this.major = +f[1], this.minor = +f[2], this.patch = +f[3], this.major > a || this.major < 0)
        throw new TypeError("Invalid major version");
      if (this.minor > a || this.minor < 0)
        throw new TypeError("Invalid minor version");
      if (this.patch > a || this.patch < 0)
        throw new TypeError("Invalid patch version");
      f[4] ? this.prerelease = f[4].split(".").map((i) => {
        if (/^[0-9]+$/.test(i)) {
          const g = +i;
          if (g >= 0 && g < a)
            return g;
        }
        return i;
      }) : this.prerelease = [], this.build = f[5] ? f[5].split(".") : [], this.format();
    }
    format() {
      return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
    }
    toString() {
      return this.version;
    }
    compare(u) {
      if (t("SemVer.compare", this.version, this.options, u), !(u instanceof h)) {
        if (typeof u == "string" && u === this.version)
          return 0;
        u = new h(u, this.options);
      }
      return u.version === this.version ? 0 : this.compareMain(u) || this.comparePre(u);
    }
    compareMain(u) {
      return u instanceof h || (u = new h(u, this.options)), n(this.major, u.major) || n(this.minor, u.minor) || n(this.patch, u.patch);
    }
    comparePre(u) {
      if (u instanceof h || (u = new h(u, this.options)), this.prerelease.length && !u.prerelease.length)
        return -1;
      if (!this.prerelease.length && u.prerelease.length)
        return 1;
      if (!this.prerelease.length && !u.prerelease.length)
        return 0;
      let s = 0;
      do {
        const f = this.prerelease[s], i = u.prerelease[s];
        if (t("prerelease compare", s, f, i), f === void 0 && i === void 0)
          return 0;
        if (i === void 0)
          return 1;
        if (f === void 0)
          return -1;
        if (f === i)
          continue;
        return n(f, i);
      } while (++s);
    }
    compareBuild(u) {
      u instanceof h || (u = new h(u, this.options));
      let s = 0;
      do {
        const f = this.build[s], i = u.build[s];
        if (t("build compare", s, f, i), f === void 0 && i === void 0)
          return 0;
        if (i === void 0)
          return 1;
        if (f === void 0)
          return -1;
        if (f === i)
          continue;
        return n(f, i);
      } while (++s);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(u, s, f) {
      if (u.startsWith("pre")) {
        if (!s && f === !1)
          throw new Error("invalid increment argument: identifier is empty");
        if (s) {
          const i = `-${s}`.match(this.options.loose ? c[d.PRERELEASELOOSE] : c[d.PRERELEASE]);
          if (!i || i[1] !== s)
            throw new Error(`invalid identifier: ${s}`);
        }
      }
      switch (u) {
        case "premajor":
          this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", s, f);
          break;
        case "preminor":
          this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", s, f);
          break;
        case "prepatch":
          this.prerelease.length = 0, this.inc("patch", s, f), this.inc("pre", s, f);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          this.prerelease.length === 0 && this.inc("patch", s, f), this.inc("pre", s, f);
          break;
        case "release":
          if (this.prerelease.length === 0)
            throw new Error(`version ${this.raw} is not a prerelease`);
          this.prerelease.length = 0;
          break;
        case "major":
          (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
          break;
        case "minor":
          (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
          break;
        case "patch":
          this.prerelease.length === 0 && this.patch++, this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
        case "pre": {
          const i = Number(f) ? 1 : 0;
          if (this.prerelease.length === 0)
            this.prerelease = [i];
          else {
            let g = this.prerelease.length;
            for (; --g >= 0; )
              typeof this.prerelease[g] == "number" && (this.prerelease[g]++, g = -2);
            if (g === -1) {
              if (s === this.prerelease.join(".") && f === !1)
                throw new Error("invalid increment argument: identifier already exists");
              this.prerelease.push(i);
            }
          }
          if (s) {
            let g = [s, i];
            f === !1 && (g = [s]), n(this.prerelease[0], s) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = g) : this.prerelease = g;
          }
          break;
        }
        default:
          throw new Error(`invalid increment argument: ${u}`);
      }
      return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
    }
  }
  return fi = h, fi;
}
var di, ss;
function Ht() {
  if (ss) return di;
  ss = 1;
  const t = Ye();
  return di = (a, c, d = !1) => {
    if (a instanceof t)
      return a;
    try {
      return new t(a, c);
    } catch (l) {
      if (!d)
        return null;
      throw l;
    }
  }, di;
}
var hi, ls;
function Qc() {
  if (ls) return hi;
  ls = 1;
  const t = Ht();
  return hi = (a, c) => {
    const d = t(a, c);
    return d ? d.version : null;
  }, hi;
}
var pi, us;
function Zc() {
  if (us) return pi;
  us = 1;
  const t = Ht();
  return pi = (a, c) => {
    const d = t(a.trim().replace(/^[=v]+/, ""), c);
    return d ? d.version : null;
  }, pi;
}
var gi, cs;
function ef() {
  if (cs) return gi;
  cs = 1;
  const t = Ye();
  return gi = (a, c, d, l, n) => {
    typeof d == "string" && (n = l, l = d, d = void 0);
    try {
      return new t(
        a instanceof t ? a.version : a,
        d
      ).inc(c, l, n).version;
    } catch {
      return null;
    }
  }, gi;
}
var mi, fs;
function tf() {
  if (fs) return mi;
  fs = 1;
  const t = Ht();
  return mi = (a, c) => {
    const d = t(a, null, !0), l = t(c, null, !0), n = d.compare(l);
    if (n === 0)
      return null;
    const h = n > 0, o = h ? d : l, u = h ? l : d, s = !!o.prerelease.length;
    if (!!u.prerelease.length && !s) {
      if (!u.patch && !u.minor)
        return "major";
      if (u.compareMain(o) === 0)
        return u.minor && !u.patch ? "minor" : "patch";
    }
    const i = s ? "pre" : "";
    return d.major !== l.major ? i + "major" : d.minor !== l.minor ? i + "minor" : d.patch !== l.patch ? i + "patch" : "prerelease";
  }, mi;
}
var Ei, ds;
function rf() {
  if (ds) return Ei;
  ds = 1;
  const t = Ye();
  return Ei = (a, c) => new t(a, c).major, Ei;
}
var yi, hs;
function nf() {
  if (hs) return yi;
  hs = 1;
  const t = Ye();
  return yi = (a, c) => new t(a, c).minor, yi;
}
var vi, ps;
function af() {
  if (ps) return vi;
  ps = 1;
  const t = Ye();
  return vi = (a, c) => new t(a, c).patch, vi;
}
var wi, gs;
function of() {
  if (gs) return wi;
  gs = 1;
  const t = Ht();
  return wi = (a, c) => {
    const d = t(a, c);
    return d && d.prerelease.length ? d.prerelease : null;
  }, wi;
}
var _i, ms;
function at() {
  if (ms) return _i;
  ms = 1;
  const t = Ye();
  return _i = (a, c, d) => new t(a, d).compare(new t(c, d)), _i;
}
var Ti, Es;
function sf() {
  if (Es) return Ti;
  Es = 1;
  const t = at();
  return Ti = (a, c, d) => t(c, a, d), Ti;
}
var Si, ys;
function lf() {
  if (ys) return Si;
  ys = 1;
  const t = at();
  return Si = (a, c) => t(a, c, !0), Si;
}
var Ri, vs;
function ua() {
  if (vs) return Ri;
  vs = 1;
  const t = Ye();
  return Ri = (a, c, d) => {
    const l = new t(a, d), n = new t(c, d);
    return l.compare(n) || l.compareBuild(n);
  }, Ri;
}
var bi, ws;
function uf() {
  if (ws) return bi;
  ws = 1;
  const t = ua();
  return bi = (a, c) => a.sort((d, l) => t(d, l, c)), bi;
}
var Ai, _s;
function cf() {
  if (_s) return Ai;
  _s = 1;
  const t = ua();
  return Ai = (a, c) => a.sort((d, l) => t(l, d, c)), Ai;
}
var Ci, Ts;
function Yr() {
  if (Ts) return Ci;
  Ts = 1;
  const t = at();
  return Ci = (a, c, d) => t(a, c, d) > 0, Ci;
}
var Oi, Ss;
function ca() {
  if (Ss) return Oi;
  Ss = 1;
  const t = at();
  return Oi = (a, c, d) => t(a, c, d) < 0, Oi;
}
var Di, Rs;
function ru() {
  if (Rs) return Di;
  Rs = 1;
  const t = at();
  return Di = (a, c, d) => t(a, c, d) === 0, Di;
}
var Pi, bs;
function nu() {
  if (bs) return Pi;
  bs = 1;
  const t = at();
  return Pi = (a, c, d) => t(a, c, d) !== 0, Pi;
}
var Ii, As;
function fa() {
  if (As) return Ii;
  As = 1;
  const t = at();
  return Ii = (a, c, d) => t(a, c, d) >= 0, Ii;
}
var Ni, Cs;
function da() {
  if (Cs) return Ni;
  Cs = 1;
  const t = at();
  return Ni = (a, c, d) => t(a, c, d) <= 0, Ni;
}
var Fi, Os;
function iu() {
  if (Os) return Fi;
  Os = 1;
  const t = ru(), e = nu(), a = Yr(), c = fa(), d = ca(), l = da();
  return Fi = (h, o, u, s) => {
    switch (o) {
      case "===":
        return typeof h == "object" && (h = h.version), typeof u == "object" && (u = u.version), h === u;
      case "!==":
        return typeof h == "object" && (h = h.version), typeof u == "object" && (u = u.version), h !== u;
      case "":
      case "=":
      case "==":
        return t(h, u, s);
      case "!=":
        return e(h, u, s);
      case ">":
        return a(h, u, s);
      case ">=":
        return c(h, u, s);
      case "<":
        return d(h, u, s);
      case "<=":
        return l(h, u, s);
      default:
        throw new TypeError(`Invalid operator: ${o}`);
    }
  }, Fi;
}
var Li, Ds;
function ff() {
  if (Ds) return Li;
  Ds = 1;
  const t = Ye(), e = Ht(), { safeRe: a, t: c } = wr();
  return Li = (l, n) => {
    if (l instanceof t)
      return l;
    if (typeof l == "number" && (l = String(l)), typeof l != "string")
      return null;
    n = n || {};
    let h = null;
    if (!n.rtl)
      h = l.match(n.includePrerelease ? a[c.COERCEFULL] : a[c.COERCE]);
    else {
      const g = n.includePrerelease ? a[c.COERCERTLFULL] : a[c.COERCERTL];
      let E;
      for (; (E = g.exec(l)) && (!h || h.index + h[0].length !== l.length); )
        (!h || E.index + E[0].length !== h.index + h[0].length) && (h = E), g.lastIndex = E.index + E[1].length + E[2].length;
      g.lastIndex = -1;
    }
    if (h === null)
      return null;
    const o = h[2], u = h[3] || "0", s = h[4] || "0", f = n.includePrerelease && h[5] ? `-${h[5]}` : "", i = n.includePrerelease && h[6] ? `+${h[6]}` : "";
    return e(`${o}.${u}.${s}${f}${i}`, n);
  }, Li;
}
var xi, Ps;
function df() {
  if (Ps) return xi;
  Ps = 1;
  class t {
    constructor() {
      this.max = 1e3, this.map = /* @__PURE__ */ new Map();
    }
    get(a) {
      const c = this.map.get(a);
      if (c !== void 0)
        return this.map.delete(a), this.map.set(a, c), c;
    }
    delete(a) {
      return this.map.delete(a);
    }
    set(a, c) {
      if (!this.delete(a) && c !== void 0) {
        if (this.map.size >= this.max) {
          const l = this.map.keys().next().value;
          this.delete(l);
        }
        this.map.set(a, c);
      }
      return this;
    }
  }
  return xi = t, xi;
}
var Ui, Is;
function ot() {
  if (Is) return Ui;
  Is = 1;
  const t = /\s+/g;
  class e {
    constructor(P, F) {
      if (F = d(F), P instanceof e)
        return P.loose === !!F.loose && P.includePrerelease === !!F.includePrerelease ? P : new e(P.raw, F);
      if (P instanceof l)
        return this.raw = P.value, this.set = [[P]], this.formatted = void 0, this;
      if (this.options = F, this.loose = !!F.loose, this.includePrerelease = !!F.includePrerelease, this.raw = P.trim().replace(t, " "), this.set = this.raw.split("||").map(($) => this.parseRange($.trim())).filter(($) => $.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const $ = this.set[0];
        if (this.set = this.set.filter((J) => !y(J[0])), this.set.length === 0)
          this.set = [$];
        else if (this.set.length > 1) {
          for (const J of this.set)
            if (J.length === 1 && p(J[0])) {
              this.set = [J];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let P = 0; P < this.set.length; P++) {
          P > 0 && (this.formatted += "||");
          const F = this.set[P];
          for (let $ = 0; $ < F.length; $++)
            $ > 0 && (this.formatted += " "), this.formatted += F[$].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(P) {
      const $ = ((this.options.includePrerelease && g) | (this.options.loose && E)) + ":" + P, J = c.get($);
      if (J)
        return J;
      const W = this.options.loose, ne = W ? o[u.HYPHENRANGELOOSE] : o[u.HYPHENRANGE];
      P = P.replace(ne, x(this.options.includePrerelease)), n("hyphen replace", P), P = P.replace(o[u.COMPARATORTRIM], s), n("comparator trim", P), P = P.replace(o[u.TILDETRIM], f), n("tilde trim", P), P = P.replace(o[u.CARETTRIM], i), n("caret trim", P);
      let ce = P.split(" ").map((K) => b(K, this.options)).join(" ").split(/\s+/).map((K) => U(K, this.options));
      W && (ce = ce.filter((K) => (n("loose invalid filter", K, this.options), !!K.match(o[u.COMPARATORLOOSE])))), n("range list", ce);
      const ue = /* @__PURE__ */ new Map(), ie = ce.map((K) => new l(K, this.options));
      for (const K of ie) {
        if (y(K))
          return [K];
        ue.set(K.value, K);
      }
      ue.size > 1 && ue.has("") && ue.delete("");
      const be = [...ue.values()];
      return c.set($, be), be;
    }
    intersects(P, F) {
      if (!(P instanceof e))
        throw new TypeError("a Range is required");
      return this.set.some(($) => T($, F) && P.set.some((J) => T(J, F) && $.every((W) => J.every((ne) => W.intersects(ne, F)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(P) {
      if (!P)
        return !1;
      if (typeof P == "string")
        try {
          P = new h(P, this.options);
        } catch {
          return !1;
        }
      for (let F = 0; F < this.set.length; F++)
        if (k(this.set[F], P, this.options))
          return !0;
      return !1;
    }
  }
  Ui = e;
  const a = df(), c = new a(), d = la(), l = Vr(), n = zr(), h = Ye(), {
    safeRe: o,
    t: u,
    comparatorTrimReplace: s,
    tildeTrimReplace: f,
    caretTrimReplace: i
  } = wr(), { FLAG_INCLUDE_PRERELEASE: g, FLAG_LOOSE: E } = Wr(), y = (N) => N.value === "<0.0.0-0", p = (N) => N.value === "", T = (N, P) => {
    let F = !0;
    const $ = N.slice();
    let J = $.pop();
    for (; F && $.length; )
      F = $.every((W) => J.intersects(W, P)), J = $.pop();
    return F;
  }, b = (N, P) => (n("comp", N, P), N = A(N, P), n("caret", N), N = D(N, P), n("tildes", N), N = R(N, P), n("xrange", N), N = M(N, P), n("stars", N), N), O = (N) => !N || N.toLowerCase() === "x" || N === "*", D = (N, P) => N.trim().split(/\s+/).map((F) => q(F, P)).join(" "), q = (N, P) => {
    const F = P.loose ? o[u.TILDELOOSE] : o[u.TILDE];
    return N.replace(F, ($, J, W, ne, ce) => {
      n("tilde", N, $, J, W, ne, ce);
      let ue;
      return O(J) ? ue = "" : O(W) ? ue = `>=${J}.0.0 <${+J + 1}.0.0-0` : O(ne) ? ue = `>=${J}.${W}.0 <${J}.${+W + 1}.0-0` : ce ? (n("replaceTilde pr", ce), ue = `>=${J}.${W}.${ne}-${ce} <${J}.${+W + 1}.0-0`) : ue = `>=${J}.${W}.${ne} <${J}.${+W + 1}.0-0`, n("tilde return", ue), ue;
    });
  }, A = (N, P) => N.trim().split(/\s+/).map((F) => S(F, P)).join(" "), S = (N, P) => {
    n("caret", N, P);
    const F = P.loose ? o[u.CARETLOOSE] : o[u.CARET], $ = P.includePrerelease ? "-0" : "";
    return N.replace(F, (J, W, ne, ce, ue) => {
      n("caret", N, J, W, ne, ce, ue);
      let ie;
      return O(W) ? ie = "" : O(ne) ? ie = `>=${W}.0.0${$} <${+W + 1}.0.0-0` : O(ce) ? W === "0" ? ie = `>=${W}.${ne}.0${$} <${W}.${+ne + 1}.0-0` : ie = `>=${W}.${ne}.0${$} <${+W + 1}.0.0-0` : ue ? (n("replaceCaret pr", ue), W === "0" ? ne === "0" ? ie = `>=${W}.${ne}.${ce}-${ue} <${W}.${ne}.${+ce + 1}-0` : ie = `>=${W}.${ne}.${ce}-${ue} <${W}.${+ne + 1}.0-0` : ie = `>=${W}.${ne}.${ce}-${ue} <${+W + 1}.0.0-0`) : (n("no pr"), W === "0" ? ne === "0" ? ie = `>=${W}.${ne}.${ce}${$} <${W}.${ne}.${+ce + 1}-0` : ie = `>=${W}.${ne}.${ce}${$} <${W}.${+ne + 1}.0-0` : ie = `>=${W}.${ne}.${ce} <${+W + 1}.0.0-0`), n("caret return", ie), ie;
    });
  }, R = (N, P) => (n("replaceXRanges", N, P), N.split(/\s+/).map((F) => v(F, P)).join(" ")), v = (N, P) => {
    N = N.trim();
    const F = P.loose ? o[u.XRANGELOOSE] : o[u.XRANGE];
    return N.replace(F, ($, J, W, ne, ce, ue) => {
      n("xRange", N, $, J, W, ne, ce, ue);
      const ie = O(W), be = ie || O(ne), K = be || O(ce), ye = K;
      return J === "=" && ye && (J = ""), ue = P.includePrerelease ? "-0" : "", ie ? J === ">" || J === "<" ? $ = "<0.0.0-0" : $ = "*" : J && ye ? (be && (ne = 0), ce = 0, J === ">" ? (J = ">=", be ? (W = +W + 1, ne = 0, ce = 0) : (ne = +ne + 1, ce = 0)) : J === "<=" && (J = "<", be ? W = +W + 1 : ne = +ne + 1), J === "<" && (ue = "-0"), $ = `${J + W}.${ne}.${ce}${ue}`) : be ? $ = `>=${W}.0.0${ue} <${+W + 1}.0.0-0` : K && ($ = `>=${W}.${ne}.0${ue} <${W}.${+ne + 1}.0-0`), n("xRange return", $), $;
    });
  }, M = (N, P) => (n("replaceStars", N, P), N.trim().replace(o[u.STAR], "")), U = (N, P) => (n("replaceGTE0", N, P), N.trim().replace(o[P.includePrerelease ? u.GTE0PRE : u.GTE0], "")), x = (N) => (P, F, $, J, W, ne, ce, ue, ie, be, K, ye) => (O($) ? F = "" : O(J) ? F = `>=${$}.0.0${N ? "-0" : ""}` : O(W) ? F = `>=${$}.${J}.0${N ? "-0" : ""}` : ne ? F = `>=${F}` : F = `>=${F}${N ? "-0" : ""}`, O(ie) ? ue = "" : O(be) ? ue = `<${+ie + 1}.0.0-0` : O(K) ? ue = `<${ie}.${+be + 1}.0-0` : ye ? ue = `<=${ie}.${be}.${K}-${ye}` : N ? ue = `<${ie}.${be}.${+K + 1}-0` : ue = `<=${ue}`, `${F} ${ue}`.trim()), k = (N, P, F) => {
    for (let $ = 0; $ < N.length; $++)
      if (!N[$].test(P))
        return !1;
    if (P.prerelease.length && !F.includePrerelease) {
      for (let $ = 0; $ < N.length; $++)
        if (n(N[$].semver), N[$].semver !== l.ANY && N[$].semver.prerelease.length > 0) {
          const J = N[$].semver;
          if (J.major === P.major && J.minor === P.minor && J.patch === P.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Ui;
}
var $i, Ns;
function Vr() {
  if (Ns) return $i;
  Ns = 1;
  const t = Symbol("SemVer ANY");
  class e {
    static get ANY() {
      return t;
    }
    constructor(s, f) {
      if (f = a(f), s instanceof e) {
        if (s.loose === !!f.loose)
          return s;
        s = s.value;
      }
      s = s.trim().split(/\s+/).join(" "), n("comparator", s, f), this.options = f, this.loose = !!f.loose, this.parse(s), this.semver === t ? this.value = "" : this.value = this.operator + this.semver.version, n("comp", this);
    }
    parse(s) {
      const f = this.options.loose ? c[d.COMPARATORLOOSE] : c[d.COMPARATOR], i = s.match(f);
      if (!i)
        throw new TypeError(`Invalid comparator: ${s}`);
      this.operator = i[1] !== void 0 ? i[1] : "", this.operator === "=" && (this.operator = ""), i[2] ? this.semver = new h(i[2], this.options.loose) : this.semver = t;
    }
    toString() {
      return this.value;
    }
    test(s) {
      if (n("Comparator.test", s, this.options.loose), this.semver === t || s === t)
        return !0;
      if (typeof s == "string")
        try {
          s = new h(s, this.options);
        } catch {
          return !1;
        }
      return l(s, this.operator, this.semver, this.options);
    }
    intersects(s, f) {
      if (!(s instanceof e))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new o(s.value, f).test(this.value) : s.operator === "" ? s.value === "" ? !0 : new o(this.value, f).test(s.semver) : (f = a(f), f.includePrerelease && (this.value === "<0.0.0-0" || s.value === "<0.0.0-0") || !f.includePrerelease && (this.value.startsWith("<0.0.0") || s.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && s.operator.startsWith(">") || this.operator.startsWith("<") && s.operator.startsWith("<") || this.semver.version === s.semver.version && this.operator.includes("=") && s.operator.includes("=") || l(this.semver, "<", s.semver, f) && this.operator.startsWith(">") && s.operator.startsWith("<") || l(this.semver, ">", s.semver, f) && this.operator.startsWith("<") && s.operator.startsWith(">")));
    }
  }
  $i = e;
  const a = la(), { safeRe: c, t: d } = wr(), l = iu(), n = zr(), h = Ye(), o = ot();
  return $i;
}
var ki, Fs;
function Xr() {
  if (Fs) return ki;
  Fs = 1;
  const t = ot();
  return ki = (a, c, d) => {
    try {
      c = new t(c, d);
    } catch {
      return !1;
    }
    return c.test(a);
  }, ki;
}
var Mi, Ls;
function hf() {
  if (Ls) return Mi;
  Ls = 1;
  const t = ot();
  return Mi = (a, c) => new t(a, c).set.map((d) => d.map((l) => l.value).join(" ").trim().split(" ")), Mi;
}
var qi, xs;
function pf() {
  if (xs) return qi;
  xs = 1;
  const t = Ye(), e = ot();
  return qi = (c, d, l) => {
    let n = null, h = null, o = null;
    try {
      o = new e(d, l);
    } catch {
      return null;
    }
    return c.forEach((u) => {
      o.test(u) && (!n || h.compare(u) === -1) && (n = u, h = new t(n, l));
    }), n;
  }, qi;
}
var Bi, Us;
function gf() {
  if (Us) return Bi;
  Us = 1;
  const t = Ye(), e = ot();
  return Bi = (c, d, l) => {
    let n = null, h = null, o = null;
    try {
      o = new e(d, l);
    } catch {
      return null;
    }
    return c.forEach((u) => {
      o.test(u) && (!n || h.compare(u) === 1) && (n = u, h = new t(n, l));
    }), n;
  }, Bi;
}
var ji, $s;
function mf() {
  if ($s) return ji;
  $s = 1;
  const t = Ye(), e = ot(), a = Yr();
  return ji = (d, l) => {
    d = new e(d, l);
    let n = new t("0.0.0");
    if (d.test(n) || (n = new t("0.0.0-0"), d.test(n)))
      return n;
    n = null;
    for (let h = 0; h < d.set.length; ++h) {
      const o = d.set[h];
      let u = null;
      o.forEach((s) => {
        const f = new t(s.semver.version);
        switch (s.operator) {
          case ">":
            f.prerelease.length === 0 ? f.patch++ : f.prerelease.push(0), f.raw = f.format();
          /* fallthrough */
          case "":
          case ">=":
            (!u || a(f, u)) && (u = f);
            break;
          case "<":
          case "<=":
            break;
          /* istanbul ignore next */
          default:
            throw new Error(`Unexpected operation: ${s.operator}`);
        }
      }), u && (!n || a(n, u)) && (n = u);
    }
    return n && d.test(n) ? n : null;
  }, ji;
}
var Hi, ks;
function Ef() {
  if (ks) return Hi;
  ks = 1;
  const t = ot();
  return Hi = (a, c) => {
    try {
      return new t(a, c).range || "*";
    } catch {
      return null;
    }
  }, Hi;
}
var Gi, Ms;
function ha() {
  if (Ms) return Gi;
  Ms = 1;
  const t = Ye(), e = Vr(), { ANY: a } = e, c = ot(), d = Xr(), l = Yr(), n = ca(), h = da(), o = fa();
  return Gi = (s, f, i, g) => {
    s = new t(s, g), f = new c(f, g);
    let E, y, p, T, b;
    switch (i) {
      case ">":
        E = l, y = h, p = n, T = ">", b = ">=";
        break;
      case "<":
        E = n, y = o, p = l, T = "<", b = "<=";
        break;
      default:
        throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (d(s, f, g))
      return !1;
    for (let O = 0; O < f.set.length; ++O) {
      const D = f.set[O];
      let q = null, A = null;
      if (D.forEach((S) => {
        S.semver === a && (S = new e(">=0.0.0")), q = q || S, A = A || S, E(S.semver, q.semver, g) ? q = S : p(S.semver, A.semver, g) && (A = S);
      }), q.operator === T || q.operator === b || (!A.operator || A.operator === T) && y(s, A.semver))
        return !1;
      if (A.operator === b && p(s, A.semver))
        return !1;
    }
    return !0;
  }, Gi;
}
var Wi, qs;
function yf() {
  if (qs) return Wi;
  qs = 1;
  const t = ha();
  return Wi = (a, c, d) => t(a, c, ">", d), Wi;
}
var zi, Bs;
function vf() {
  if (Bs) return zi;
  Bs = 1;
  const t = ha();
  return zi = (a, c, d) => t(a, c, "<", d), zi;
}
var Yi, js;
function wf() {
  if (js) return Yi;
  js = 1;
  const t = ot();
  return Yi = (a, c, d) => (a = new t(a, d), c = new t(c, d), a.intersects(c, d)), Yi;
}
var Vi, Hs;
function _f() {
  if (Hs) return Vi;
  Hs = 1;
  const t = Xr(), e = at();
  return Vi = (a, c, d) => {
    const l = [];
    let n = null, h = null;
    const o = a.sort((i, g) => e(i, g, d));
    for (const i of o)
      t(i, c, d) ? (h = i, n || (n = i)) : (h && l.push([n, h]), h = null, n = null);
    n && l.push([n, null]);
    const u = [];
    for (const [i, g] of l)
      i === g ? u.push(i) : !g && i === o[0] ? u.push("*") : g ? i === o[0] ? u.push(`<=${g}`) : u.push(`${i} - ${g}`) : u.push(`>=${i}`);
    const s = u.join(" || "), f = typeof c.raw == "string" ? c.raw : String(c);
    return s.length < f.length ? s : c;
  }, Vi;
}
var Xi, Gs;
function Tf() {
  if (Gs) return Xi;
  Gs = 1;
  const t = ot(), e = Vr(), { ANY: a } = e, c = Xr(), d = at(), l = (f, i, g = {}) => {
    if (f === i)
      return !0;
    f = new t(f, g), i = new t(i, g);
    let E = !1;
    e: for (const y of f.set) {
      for (const p of i.set) {
        const T = o(y, p, g);
        if (E = E || T !== null, T)
          continue e;
      }
      if (E)
        return !1;
    }
    return !0;
  }, n = [new e(">=0.0.0-0")], h = [new e(">=0.0.0")], o = (f, i, g) => {
    if (f === i)
      return !0;
    if (f.length === 1 && f[0].semver === a) {
      if (i.length === 1 && i[0].semver === a)
        return !0;
      g.includePrerelease ? f = n : f = h;
    }
    if (i.length === 1 && i[0].semver === a) {
      if (g.includePrerelease)
        return !0;
      i = h;
    }
    const E = /* @__PURE__ */ new Set();
    let y, p;
    for (const R of f)
      R.operator === ">" || R.operator === ">=" ? y = u(y, R, g) : R.operator === "<" || R.operator === "<=" ? p = s(p, R, g) : E.add(R.semver);
    if (E.size > 1)
      return null;
    let T;
    if (y && p) {
      if (T = d(y.semver, p.semver, g), T > 0)
        return null;
      if (T === 0 && (y.operator !== ">=" || p.operator !== "<="))
        return null;
    }
    for (const R of E) {
      if (y && !c(R, String(y), g) || p && !c(R, String(p), g))
        return null;
      for (const v of i)
        if (!c(R, String(v), g))
          return !1;
      return !0;
    }
    let b, O, D, q, A = p && !g.includePrerelease && p.semver.prerelease.length ? p.semver : !1, S = y && !g.includePrerelease && y.semver.prerelease.length ? y.semver : !1;
    A && A.prerelease.length === 1 && p.operator === "<" && A.prerelease[0] === 0 && (A = !1);
    for (const R of i) {
      if (q = q || R.operator === ">" || R.operator === ">=", D = D || R.operator === "<" || R.operator === "<=", y) {
        if (S && R.semver.prerelease && R.semver.prerelease.length && R.semver.major === S.major && R.semver.minor === S.minor && R.semver.patch === S.patch && (S = !1), R.operator === ">" || R.operator === ">=") {
          if (b = u(y, R, g), b === R && b !== y)
            return !1;
        } else if (y.operator === ">=" && !c(y.semver, String(R), g))
          return !1;
      }
      if (p) {
        if (A && R.semver.prerelease && R.semver.prerelease.length && R.semver.major === A.major && R.semver.minor === A.minor && R.semver.patch === A.patch && (A = !1), R.operator === "<" || R.operator === "<=") {
          if (O = s(p, R, g), O === R && O !== p)
            return !1;
        } else if (p.operator === "<=" && !c(p.semver, String(R), g))
          return !1;
      }
      if (!R.operator && (p || y) && T !== 0)
        return !1;
    }
    return !(y && D && !p && T !== 0 || p && q && !y && T !== 0 || S || A);
  }, u = (f, i, g) => {
    if (!f)
      return i;
    const E = d(f.semver, i.semver, g);
    return E > 0 ? f : E < 0 || i.operator === ">" && f.operator === ">=" ? i : f;
  }, s = (f, i, g) => {
    if (!f)
      return i;
    const E = d(f.semver, i.semver, g);
    return E < 0 ? f : E > 0 || i.operator === "<" && f.operator === "<=" ? i : f;
  };
  return Xi = l, Xi;
}
var Ki, Ws;
function au() {
  if (Ws) return Ki;
  Ws = 1;
  const t = wr(), e = Wr(), a = Ye(), c = tu(), d = Ht(), l = Qc(), n = Zc(), h = ef(), o = tf(), u = rf(), s = nf(), f = af(), i = of(), g = at(), E = sf(), y = lf(), p = ua(), T = uf(), b = cf(), O = Yr(), D = ca(), q = ru(), A = nu(), S = fa(), R = da(), v = iu(), M = ff(), U = Vr(), x = ot(), k = Xr(), N = hf(), P = pf(), F = gf(), $ = mf(), J = Ef(), W = ha(), ne = yf(), ce = vf(), ue = wf(), ie = _f(), be = Tf();
  return Ki = {
    parse: d,
    valid: l,
    clean: n,
    inc: h,
    diff: o,
    major: u,
    minor: s,
    patch: f,
    prerelease: i,
    compare: g,
    rcompare: E,
    compareLoose: y,
    compareBuild: p,
    sort: T,
    rsort: b,
    gt: O,
    lt: D,
    eq: q,
    neq: A,
    gte: S,
    lte: R,
    cmp: v,
    coerce: M,
    Comparator: U,
    Range: x,
    satisfies: k,
    toComparators: N,
    maxSatisfying: P,
    minSatisfying: F,
    minVersion: $,
    validRange: J,
    outside: W,
    gtr: ne,
    ltr: ce,
    intersects: ue,
    simplifyRange: ie,
    subset: be,
    SemVer: a,
    re: t.re,
    src: t.src,
    tokens: t.t,
    SEMVER_SPEC_VERSION: e.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: e.RELEASE_TYPES,
    compareIdentifiers: c.compareIdentifiers,
    rcompareIdentifiers: c.rcompareIdentifiers
  }, Ki;
}
var Ut = {}, gr = { exports: {} };
gr.exports;
var zs;
function Sf() {
  return zs || (zs = 1, function(t, e) {
    var a = 200, c = "__lodash_hash_undefined__", d = 1, l = 2, n = 9007199254740991, h = "[object Arguments]", o = "[object Array]", u = "[object AsyncFunction]", s = "[object Boolean]", f = "[object Date]", i = "[object Error]", g = "[object Function]", E = "[object GeneratorFunction]", y = "[object Map]", p = "[object Number]", T = "[object Null]", b = "[object Object]", O = "[object Promise]", D = "[object Proxy]", q = "[object RegExp]", A = "[object Set]", S = "[object String]", R = "[object Symbol]", v = "[object Undefined]", M = "[object WeakMap]", U = "[object ArrayBuffer]", x = "[object DataView]", k = "[object Float32Array]", N = "[object Float64Array]", P = "[object Int8Array]", F = "[object Int16Array]", $ = "[object Int32Array]", J = "[object Uint8Array]", W = "[object Uint8ClampedArray]", ne = "[object Uint16Array]", ce = "[object Uint32Array]", ue = /[\\^$.*+?()[\]{}|]/g, ie = /^\[object .+?Constructor\]$/, be = /^(?:0|[1-9]\d*)$/, K = {};
    K[k] = K[N] = K[P] = K[F] = K[$] = K[J] = K[W] = K[ne] = K[ce] = !0, K[h] = K[o] = K[U] = K[s] = K[x] = K[f] = K[i] = K[g] = K[y] = K[p] = K[b] = K[q] = K[A] = K[S] = K[M] = !1;
    var ye = typeof it == "object" && it && it.Object === Object && it, _ = typeof self == "object" && self && self.Object === Object && self, m = ye || _ || Function("return this")(), j = e && !e.nodeType && e, I = j && !0 && t && !t.nodeType && t, le = I && I.exports === j, ge = le && ye.process, pe = function() {
      try {
        return ge && ge.binding && ge.binding("util");
      } catch {
      }
    }(), _e = pe && pe.isTypedArray;
    function ve(C, L) {
      for (var V = -1, se = C == null ? 0 : C.length, Ie = 0, Te = []; ++V < se; ) {
        var Le = C[V];
        L(Le, V, C) && (Te[Ie++] = Le);
      }
      return Te;
    }
    function Ue(C, L) {
      for (var V = -1, se = L.length, Ie = C.length; ++V < se; )
        C[Ie + V] = L[V];
      return C;
    }
    function De(C, L) {
      for (var V = -1, se = C == null ? 0 : C.length; ++V < se; )
        if (L(C[V], V, C))
          return !0;
      return !1;
    }
    function je(C, L) {
      for (var V = -1, se = Array(C); ++V < C; )
        se[V] = L(V);
      return se;
    }
    function yt(C) {
      return function(L) {
        return C(L);
      };
    }
    function lt(C, L) {
      return C.has(L);
    }
    function r(C, L) {
      return C?.[L];
    }
    function B(C) {
      var L = -1, V = Array(C.size);
      return C.forEach(function(se, Ie) {
        V[++L] = [Ie, se];
      }), V;
    }
    function G(C, L) {
      return function(V) {
        return C(L(V));
      };
    }
    function re(C) {
      var L = -1, V = Array(C.size);
      return C.forEach(function(se) {
        V[++L] = se;
      }), V;
    }
    var z = Array.prototype, te = Function.prototype, Z = Object.prototype, ae = m["__core-js_shared__"], me = te.toString, Ee = Z.hasOwnProperty, Ae = function() {
      var C = /[^.]+$/.exec(ae && ae.keys && ae.keys.IE_PROTO || "");
      return C ? "Symbol(src)_1." + C : "";
    }(), de = Z.toString, $e = RegExp(
      "^" + me.call(Ee).replace(ue, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    ), w = le ? m.Buffer : void 0, H = m.Symbol, X = m.Uint8Array, Y = Z.propertyIsEnumerable, Q = z.splice, ee = H ? H.toStringTag : void 0, fe = Object.getOwnPropertySymbols, oe = w ? w.isBuffer : void 0, he = G(Object.keys, Object), we = Lt(m, "DataView"), Pe = Lt(m, "Map"), Fe = Lt(m, "Promise"), Ce = Lt(m, "Set"), Ft = Lt(m, "WeakMap"), tt = Lt(Object, "create"), vt = Tt(we), du = Tt(Pe), hu = Tt(Fe), pu = Tt(Ce), gu = Tt(Ft), ma = H ? H.prototype : void 0, Kr = ma ? ma.valueOf : void 0;
    function wt(C) {
      var L = -1, V = C == null ? 0 : C.length;
      for (this.clear(); ++L < V; ) {
        var se = C[L];
        this.set(se[0], se[1]);
      }
    }
    function mu() {
      this.__data__ = tt ? tt(null) : {}, this.size = 0;
    }
    function Eu(C) {
      var L = this.has(C) && delete this.__data__[C];
      return this.size -= L ? 1 : 0, L;
    }
    function yu(C) {
      var L = this.__data__;
      if (tt) {
        var V = L[C];
        return V === c ? void 0 : V;
      }
      return Ee.call(L, C) ? L[C] : void 0;
    }
    function vu(C) {
      var L = this.__data__;
      return tt ? L[C] !== void 0 : Ee.call(L, C);
    }
    function wu(C, L) {
      var V = this.__data__;
      return this.size += this.has(C) ? 0 : 1, V[C] = tt && L === void 0 ? c : L, this;
    }
    wt.prototype.clear = mu, wt.prototype.delete = Eu, wt.prototype.get = yu, wt.prototype.has = vu, wt.prototype.set = wu;
    function ut(C) {
      var L = -1, V = C == null ? 0 : C.length;
      for (this.clear(); ++L < V; ) {
        var se = C[L];
        this.set(se[0], se[1]);
      }
    }
    function _u() {
      this.__data__ = [], this.size = 0;
    }
    function Tu(C) {
      var L = this.__data__, V = Tr(L, C);
      if (V < 0)
        return !1;
      var se = L.length - 1;
      return V == se ? L.pop() : Q.call(L, V, 1), --this.size, !0;
    }
    function Su(C) {
      var L = this.__data__, V = Tr(L, C);
      return V < 0 ? void 0 : L[V][1];
    }
    function Ru(C) {
      return Tr(this.__data__, C) > -1;
    }
    function bu(C, L) {
      var V = this.__data__, se = Tr(V, C);
      return se < 0 ? (++this.size, V.push([C, L])) : V[se][1] = L, this;
    }
    ut.prototype.clear = _u, ut.prototype.delete = Tu, ut.prototype.get = Su, ut.prototype.has = Ru, ut.prototype.set = bu;
    function _t(C) {
      var L = -1, V = C == null ? 0 : C.length;
      for (this.clear(); ++L < V; ) {
        var se = C[L];
        this.set(se[0], se[1]);
      }
    }
    function Au() {
      this.size = 0, this.__data__ = {
        hash: new wt(),
        map: new (Pe || ut)(),
        string: new wt()
      };
    }
    function Cu(C) {
      var L = Sr(this, C).delete(C);
      return this.size -= L ? 1 : 0, L;
    }
    function Ou(C) {
      return Sr(this, C).get(C);
    }
    function Du(C) {
      return Sr(this, C).has(C);
    }
    function Pu(C, L) {
      var V = Sr(this, C), se = V.size;
      return V.set(C, L), this.size += V.size == se ? 0 : 1, this;
    }
    _t.prototype.clear = Au, _t.prototype.delete = Cu, _t.prototype.get = Ou, _t.prototype.has = Du, _t.prototype.set = Pu;
    function _r(C) {
      var L = -1, V = C == null ? 0 : C.length;
      for (this.__data__ = new _t(); ++L < V; )
        this.add(C[L]);
    }
    function Iu(C) {
      return this.__data__.set(C, c), this;
    }
    function Nu(C) {
      return this.__data__.has(C);
    }
    _r.prototype.add = _r.prototype.push = Iu, _r.prototype.has = Nu;
    function dt(C) {
      var L = this.__data__ = new ut(C);
      this.size = L.size;
    }
    function Fu() {
      this.__data__ = new ut(), this.size = 0;
    }
    function Lu(C) {
      var L = this.__data__, V = L.delete(C);
      return this.size = L.size, V;
    }
    function xu(C) {
      return this.__data__.get(C);
    }
    function Uu(C) {
      return this.__data__.has(C);
    }
    function $u(C, L) {
      var V = this.__data__;
      if (V instanceof ut) {
        var se = V.__data__;
        if (!Pe || se.length < a - 1)
          return se.push([C, L]), this.size = ++V.size, this;
        V = this.__data__ = new _t(se);
      }
      return V.set(C, L), this.size = V.size, this;
    }
    dt.prototype.clear = Fu, dt.prototype.delete = Lu, dt.prototype.get = xu, dt.prototype.has = Uu, dt.prototype.set = $u;
    function ku(C, L) {
      var V = Rr(C), se = !V && Zu(C), Ie = !V && !se && Jr(C), Te = !V && !se && !Ie && ba(C), Le = V || se || Ie || Te, ke = Le ? je(C.length, String) : [], Me = ke.length;
      for (var Ne in C)
        Ee.call(C, Ne) && !(Le && // Safari 9 has enumerable `arguments.length` in strict mode.
        (Ne == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        Ie && (Ne == "offset" || Ne == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        Te && (Ne == "buffer" || Ne == "byteLength" || Ne == "byteOffset") || // Skip index properties.
        Vu(Ne, Me))) && ke.push(Ne);
      return ke;
    }
    function Tr(C, L) {
      for (var V = C.length; V--; )
        if (_a(C[V][0], L))
          return V;
      return -1;
    }
    function Mu(C, L, V) {
      var se = L(C);
      return Rr(C) ? se : Ue(se, V(C));
    }
    function Wt(C) {
      return C == null ? C === void 0 ? v : T : ee && ee in Object(C) ? zu(C) : Qu(C);
    }
    function Ea(C) {
      return zt(C) && Wt(C) == h;
    }
    function ya(C, L, V, se, Ie) {
      return C === L ? !0 : C == null || L == null || !zt(C) && !zt(L) ? C !== C && L !== L : qu(C, L, V, se, ya, Ie);
    }
    function qu(C, L, V, se, Ie, Te) {
      var Le = Rr(C), ke = Rr(L), Me = Le ? o : ht(C), Ne = ke ? o : ht(L);
      Me = Me == h ? b : Me, Ne = Ne == h ? b : Ne;
      var Xe = Me == b, rt = Ne == b, He = Me == Ne;
      if (He && Jr(C)) {
        if (!Jr(L))
          return !1;
        Le = !0, Xe = !1;
      }
      if (He && !Xe)
        return Te || (Te = new dt()), Le || ba(C) ? va(C, L, V, se, Ie, Te) : Gu(C, L, Me, V, se, Ie, Te);
      if (!(V & d)) {
        var Je = Xe && Ee.call(C, "__wrapped__"), Qe = rt && Ee.call(L, "__wrapped__");
        if (Je || Qe) {
          var pt = Je ? C.value() : C, ct = Qe ? L.value() : L;
          return Te || (Te = new dt()), Ie(pt, ct, V, se, Te);
        }
      }
      return He ? (Te || (Te = new dt()), Wu(C, L, V, se, Ie, Te)) : !1;
    }
    function Bu(C) {
      if (!Ra(C) || Ku(C))
        return !1;
      var L = Ta(C) ? $e : ie;
      return L.test(Tt(C));
    }
    function ju(C) {
      return zt(C) && Sa(C.length) && !!K[Wt(C)];
    }
    function Hu(C) {
      if (!Ju(C))
        return he(C);
      var L = [];
      for (var V in Object(C))
        Ee.call(C, V) && V != "constructor" && L.push(V);
      return L;
    }
    function va(C, L, V, se, Ie, Te) {
      var Le = V & d, ke = C.length, Me = L.length;
      if (ke != Me && !(Le && Me > ke))
        return !1;
      var Ne = Te.get(C);
      if (Ne && Te.get(L))
        return Ne == L;
      var Xe = -1, rt = !0, He = V & l ? new _r() : void 0;
      for (Te.set(C, L), Te.set(L, C); ++Xe < ke; ) {
        var Je = C[Xe], Qe = L[Xe];
        if (se)
          var pt = Le ? se(Qe, Je, Xe, L, C, Te) : se(Je, Qe, Xe, C, L, Te);
        if (pt !== void 0) {
          if (pt)
            continue;
          rt = !1;
          break;
        }
        if (He) {
          if (!De(L, function(ct, St) {
            if (!lt(He, St) && (Je === ct || Ie(Je, ct, V, se, Te)))
              return He.push(St);
          })) {
            rt = !1;
            break;
          }
        } else if (!(Je === Qe || Ie(Je, Qe, V, se, Te))) {
          rt = !1;
          break;
        }
      }
      return Te.delete(C), Te.delete(L), rt;
    }
    function Gu(C, L, V, se, Ie, Te, Le) {
      switch (V) {
        case x:
          if (C.byteLength != L.byteLength || C.byteOffset != L.byteOffset)
            return !1;
          C = C.buffer, L = L.buffer;
        case U:
          return !(C.byteLength != L.byteLength || !Te(new X(C), new X(L)));
        case s:
        case f:
        case p:
          return _a(+C, +L);
        case i:
          return C.name == L.name && C.message == L.message;
        case q:
        case S:
          return C == L + "";
        case y:
          var ke = B;
        case A:
          var Me = se & d;
          if (ke || (ke = re), C.size != L.size && !Me)
            return !1;
          var Ne = Le.get(C);
          if (Ne)
            return Ne == L;
          se |= l, Le.set(C, L);
          var Xe = va(ke(C), ke(L), se, Ie, Te, Le);
          return Le.delete(C), Xe;
        case R:
          if (Kr)
            return Kr.call(C) == Kr.call(L);
      }
      return !1;
    }
    function Wu(C, L, V, se, Ie, Te) {
      var Le = V & d, ke = wa(C), Me = ke.length, Ne = wa(L), Xe = Ne.length;
      if (Me != Xe && !Le)
        return !1;
      for (var rt = Me; rt--; ) {
        var He = ke[rt];
        if (!(Le ? He in L : Ee.call(L, He)))
          return !1;
      }
      var Je = Te.get(C);
      if (Je && Te.get(L))
        return Je == L;
      var Qe = !0;
      Te.set(C, L), Te.set(L, C);
      for (var pt = Le; ++rt < Me; ) {
        He = ke[rt];
        var ct = C[He], St = L[He];
        if (se)
          var Aa = Le ? se(St, ct, He, L, C, Te) : se(ct, St, He, C, L, Te);
        if (!(Aa === void 0 ? ct === St || Ie(ct, St, V, se, Te) : Aa)) {
          Qe = !1;
          break;
        }
        pt || (pt = He == "constructor");
      }
      if (Qe && !pt) {
        var br = C.constructor, Ar = L.constructor;
        br != Ar && "constructor" in C && "constructor" in L && !(typeof br == "function" && br instanceof br && typeof Ar == "function" && Ar instanceof Ar) && (Qe = !1);
      }
      return Te.delete(C), Te.delete(L), Qe;
    }
    function wa(C) {
      return Mu(C, rc, Yu);
    }
    function Sr(C, L) {
      var V = C.__data__;
      return Xu(L) ? V[typeof L == "string" ? "string" : "hash"] : V.map;
    }
    function Lt(C, L) {
      var V = r(C, L);
      return Bu(V) ? V : void 0;
    }
    function zu(C) {
      var L = Ee.call(C, ee), V = C[ee];
      try {
        C[ee] = void 0;
        var se = !0;
      } catch {
      }
      var Ie = de.call(C);
      return se && (L ? C[ee] = V : delete C[ee]), Ie;
    }
    var Yu = fe ? function(C) {
      return C == null ? [] : (C = Object(C), ve(fe(C), function(L) {
        return Y.call(C, L);
      }));
    } : nc, ht = Wt;
    (we && ht(new we(new ArrayBuffer(1))) != x || Pe && ht(new Pe()) != y || Fe && ht(Fe.resolve()) != O || Ce && ht(new Ce()) != A || Ft && ht(new Ft()) != M) && (ht = function(C) {
      var L = Wt(C), V = L == b ? C.constructor : void 0, se = V ? Tt(V) : "";
      if (se)
        switch (se) {
          case vt:
            return x;
          case du:
            return y;
          case hu:
            return O;
          case pu:
            return A;
          case gu:
            return M;
        }
      return L;
    });
    function Vu(C, L) {
      return L = L ?? n, !!L && (typeof C == "number" || be.test(C)) && C > -1 && C % 1 == 0 && C < L;
    }
    function Xu(C) {
      var L = typeof C;
      return L == "string" || L == "number" || L == "symbol" || L == "boolean" ? C !== "__proto__" : C === null;
    }
    function Ku(C) {
      return !!Ae && Ae in C;
    }
    function Ju(C) {
      var L = C && C.constructor, V = typeof L == "function" && L.prototype || Z;
      return C === V;
    }
    function Qu(C) {
      return de.call(C);
    }
    function Tt(C) {
      if (C != null) {
        try {
          return me.call(C);
        } catch {
        }
        try {
          return C + "";
        } catch {
        }
      }
      return "";
    }
    function _a(C, L) {
      return C === L || C !== C && L !== L;
    }
    var Zu = Ea(/* @__PURE__ */ function() {
      return arguments;
    }()) ? Ea : function(C) {
      return zt(C) && Ee.call(C, "callee") && !Y.call(C, "callee");
    }, Rr = Array.isArray;
    function ec(C) {
      return C != null && Sa(C.length) && !Ta(C);
    }
    var Jr = oe || ic;
    function tc(C, L) {
      return ya(C, L);
    }
    function Ta(C) {
      if (!Ra(C))
        return !1;
      var L = Wt(C);
      return L == g || L == E || L == u || L == D;
    }
    function Sa(C) {
      return typeof C == "number" && C > -1 && C % 1 == 0 && C <= n;
    }
    function Ra(C) {
      var L = typeof C;
      return C != null && (L == "object" || L == "function");
    }
    function zt(C) {
      return C != null && typeof C == "object";
    }
    var ba = _e ? yt(_e) : ju;
    function rc(C) {
      return ec(C) ? ku(C) : Hu(C);
    }
    function nc() {
      return [];
    }
    function ic() {
      return !1;
    }
    t.exports = tc;
  }(gr, gr.exports)), gr.exports;
}
var Ys;
function Rf() {
  if (Ys) return Ut;
  Ys = 1, Object.defineProperty(Ut, "__esModule", { value: !0 }), Ut.DownloadedUpdateHelper = void 0, Ut.createTempUpdateFile = h;
  const t = Er, e = xe, a = Sf(), c = /* @__PURE__ */ Et(), d = Se;
  let l = class {
    constructor(u) {
      this.cacheDir = u, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
    }
    get downloadedFileInfo() {
      return this._downloadedFileInfo;
    }
    get file() {
      return this._file;
    }
    get packageFile() {
      return this._packageFile;
    }
    get cacheDirForPendingUpdate() {
      return d.join(this.cacheDir, "pending");
    }
    async validateDownloadedPath(u, s, f, i) {
      if (this.versionInfo != null && this.file === u && this.fileInfo != null)
        return a(this.versionInfo, s) && a(this.fileInfo.info, f.info) && await (0, c.pathExists)(u) ? u : null;
      const g = await this.getValidCachedUpdateFile(f, i);
      return g === null ? null : (i.info(`Update has already been downloaded to ${u}).`), this._file = g, g);
    }
    async setDownloadedFile(u, s, f, i, g, E) {
      this._file = u, this._packageFile = s, this.versionInfo = f, this.fileInfo = i, this._downloadedFileInfo = {
        fileName: g,
        sha512: i.info.sha512,
        isAdminRightsRequired: i.info.isAdminRightsRequired === !0
      }, E && await (0, c.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
    }
    async clear() {
      this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
    }
    async cleanCacheDirForPendingUpdate() {
      try {
        await (0, c.emptyDir)(this.cacheDirForPendingUpdate);
      } catch {
      }
    }
    /**
     * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
     * @param fileInfo
     * @param logger
     */
    async getValidCachedUpdateFile(u, s) {
      const f = this.getUpdateInfoFile();
      if (!await (0, c.pathExists)(f))
        return null;
      let g;
      try {
        g = await (0, c.readJson)(f);
      } catch (T) {
        let b = "No cached update info available";
        return T.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), b += ` (error on read: ${T.message})`), s.info(b), null;
      }
      if (!(g?.fileName !== null))
        return s.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
      if (u.info.sha512 !== g.sha512)
        return s.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${g.sha512}, expected: ${u.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
      const y = d.join(this.cacheDirForPendingUpdate, g.fileName);
      if (!await (0, c.pathExists)(y))
        return s.info("Cached update file doesn't exist"), null;
      const p = await n(y);
      return u.info.sha512 !== p ? (s.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${p}, expected: ${u.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = g, y);
    }
    getUpdateInfoFile() {
      return d.join(this.cacheDirForPendingUpdate, "update-info.json");
    }
  };
  Ut.DownloadedUpdateHelper = l;
  function n(o, u = "sha512", s = "base64", f) {
    return new Promise((i, g) => {
      const E = (0, t.createHash)(u);
      E.on("error", g).setEncoding(s), (0, e.createReadStream)(o, {
        ...f,
        highWaterMark: 1024 * 1024
        /* better to use more memory but hash faster */
      }).on("error", g).on("end", () => {
        E.end(), i(E.read());
      }).pipe(E, { end: !1 });
    });
  }
  async function h(o, u, s) {
    let f = 0, i = d.join(u, o);
    for (let g = 0; g < 3; g++)
      try {
        return await (0, c.unlink)(i), i;
      } catch (E) {
        if (E.code === "ENOENT")
          return i;
        s.warn(`Error on remove temp update file: ${E}`), i = d.join(u, `${f++}-${o}`);
      }
    return i;
  }
  return Ut;
}
var Qt = {}, kr = {}, Vs;
function bf() {
  if (Vs) return kr;
  Vs = 1, Object.defineProperty(kr, "__esModule", { value: !0 }), kr.getAppCacheDir = a;
  const t = Se, e = jr;
  function a() {
    const c = (0, e.homedir)();
    let d;
    return process.platform === "win32" ? d = process.env.LOCALAPPDATA || t.join(c, "AppData", "Local") : process.platform === "darwin" ? d = t.join(c, "Library", "Caches") : d = process.env.XDG_CACHE_HOME || t.join(c, ".cache"), d;
  }
  return kr;
}
var Xs;
function Af() {
  if (Xs) return Qt;
  Xs = 1, Object.defineProperty(Qt, "__esModule", { value: !0 }), Qt.ElectronAppAdapter = void 0;
  const t = Se, e = bf();
  let a = class {
    constructor(d = Dt.app) {
      this.app = d;
    }
    whenReady() {
      return this.app.whenReady();
    }
    get version() {
      return this.app.getVersion();
    }
    get name() {
      return this.app.getName();
    }
    get isPackaged() {
      return this.app.isPackaged === !0;
    }
    get appUpdateConfigPath() {
      return this.isPackaged ? t.join(process.resourcesPath, "app-update.yml") : t.join(this.app.getAppPath(), "dev-app-update.yml");
    }
    get userDataPath() {
      return this.app.getPath("userData");
    }
    get baseCachePath() {
      return (0, e.getAppCacheDir)();
    }
    quit() {
      this.app.quit();
    }
    relaunch() {
      this.app.relaunch();
    }
    onQuit(d) {
      this.app.once("quit", (l, n) => d(n));
    }
  };
  return Qt.ElectronAppAdapter = a, Qt;
}
var Ji = {}, Ks;
function Cf() {
  return Ks || (Ks = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.ElectronHttpExecutor = t.NET_SESSION_NAME = void 0, t.getNetSession = a;
    const e = Be();
    t.NET_SESSION_NAME = "electron-updater";
    function a() {
      return Dt.session.fromPartition(t.NET_SESSION_NAME, {
        cache: !1
      });
    }
    class c extends e.HttpExecutor {
      constructor(l) {
        super(), this.proxyLoginCallback = l, this.cachedSession = null;
      }
      async download(l, n, h) {
        return await h.cancellationToken.createPromise((o, u, s) => {
          const f = {
            headers: h.headers || void 0,
            redirect: "manual"
          };
          (0, e.configureRequestUrl)(l, f), (0, e.configureRequestOptions)(f), this.doDownload(f, {
            destination: n,
            options: h,
            onCancel: s,
            callback: (i) => {
              i == null ? o(n) : u(i);
            },
            responseHandler: null
          }, 0);
        });
      }
      createRequest(l, n) {
        l.headers && l.headers.Host && (l.host = l.headers.Host, delete l.headers.Host), this.cachedSession == null && (this.cachedSession = a());
        const h = Dt.net.request({
          ...l,
          session: this.cachedSession
        });
        return h.on("response", n), this.proxyLoginCallback != null && h.on("login", this.proxyLoginCallback), h;
      }
      addRedirectHandlers(l, n, h, o, u) {
        l.on("redirect", (s, f, i) => {
          l.abort(), o > this.maxRedirects ? h(this.createMaxRedirectError()) : u(e.HttpExecutor.prepareRedirectUrlOptions(i, n));
        });
      }
    }
    t.ElectronHttpExecutor = c;
  }(Ji)), Ji;
}
var Zt = {}, Ot = {}, Qi, Js;
function Of() {
  if (Js) return Qi;
  Js = 1;
  var t = "[object Symbol]", e = /[\\^$.*+?()[\]{}|]/g, a = RegExp(e.source), c = typeof it == "object" && it && it.Object === Object && it, d = typeof self == "object" && self && self.Object === Object && self, l = c || d || Function("return this")(), n = Object.prototype, h = n.toString, o = l.Symbol, u = o ? o.prototype : void 0, s = u ? u.toString : void 0;
  function f(p) {
    if (typeof p == "string")
      return p;
    if (g(p))
      return s ? s.call(p) : "";
    var T = p + "";
    return T == "0" && 1 / p == -1 / 0 ? "-0" : T;
  }
  function i(p) {
    return !!p && typeof p == "object";
  }
  function g(p) {
    return typeof p == "symbol" || i(p) && h.call(p) == t;
  }
  function E(p) {
    return p == null ? "" : f(p);
  }
  function y(p) {
    return p = E(p), p && a.test(p) ? p.replace(e, "\\$&") : p;
  }
  return Qi = y, Qi;
}
var Qs;
function It() {
  if (Qs) return Ot;
  Qs = 1, Object.defineProperty(Ot, "__esModule", { value: !0 }), Ot.newBaseUrl = a, Ot.newUrlFromBase = c, Ot.getChannelFilename = d, Ot.blockmapFiles = l;
  const t = qt, e = Of();
  function a(n) {
    const h = new t.URL(n);
    return h.pathname.endsWith("/") || (h.pathname += "/"), h;
  }
  function c(n, h, o = !1) {
    const u = new t.URL(n, h), s = h.search;
    return s != null && s.length !== 0 ? u.search = s : o && (u.search = `noCache=${Date.now().toString(32)}`), u;
  }
  function d(n) {
    return `${n}.yml`;
  }
  function l(n, h, o) {
    const u = c(`${n.pathname}.blockmap`, n);
    return [c(`${n.pathname.replace(new RegExp(e(o), "g"), h)}.blockmap`, n), u];
  }
  return Ot;
}
var ft = {}, Zs;
function et() {
  if (Zs) return ft;
  Zs = 1, Object.defineProperty(ft, "__esModule", { value: !0 }), ft.Provider = void 0, ft.findFile = d, ft.parseUpdateInfo = l, ft.getFileList = n, ft.resolveFiles = h;
  const t = Be(), e = sa(), a = It();
  let c = class {
    constructor(u) {
      this.runtimeOptions = u, this.requestHeaders = null, this.executor = u.executor;
    }
    get isUseMultipleRangeRequest() {
      return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
    }
    getChannelFilePrefix() {
      if (this.runtimeOptions.platform === "linux") {
        const u = process.env.TEST_UPDATER_ARCH || process.arch;
        return "-linux" + (u === "x64" ? "" : `-${u}`);
      } else
        return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
    }
    // due to historical reasons for windows we use channel name without platform specifier
    getDefaultChannelName() {
      return this.getCustomChannelName("latest");
    }
    getCustomChannelName(u) {
      return `${u}${this.getChannelFilePrefix()}`;
    }
    get fileExtraDownloadHeaders() {
      return null;
    }
    setRequestHeaders(u) {
      this.requestHeaders = u;
    }
    /**
     * Method to perform API request only to resolve update info, but not to download update.
     */
    httpRequest(u, s, f) {
      return this.executor.request(this.createRequestOptions(u, s), f);
    }
    createRequestOptions(u, s) {
      const f = {};
      return this.requestHeaders == null ? s != null && (f.headers = s) : f.headers = s == null ? this.requestHeaders : { ...this.requestHeaders, ...s }, (0, t.configureRequestUrl)(u, f), f;
    }
  };
  ft.Provider = c;
  function d(o, u, s) {
    if (o.length === 0)
      throw (0, t.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
    const f = o.find((i) => i.url.pathname.toLowerCase().endsWith(`.${u}`));
    return f ?? (s == null ? o[0] : o.find((i) => !s.some((g) => i.url.pathname.toLowerCase().endsWith(`.${g}`))));
  }
  function l(o, u, s) {
    if (o == null)
      throw (0, t.newError)(`Cannot parse update info from ${u} in the latest release artifacts (${s}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    let f;
    try {
      f = (0, e.load)(o);
    } catch (i) {
      throw (0, t.newError)(`Cannot parse update info from ${u} in the latest release artifacts (${s}): ${i.stack || i.message}, rawData: ${o}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    }
    return f;
  }
  function n(o) {
    const u = o.files;
    if (u != null && u.length > 0)
      return u;
    if (o.path != null)
      return [
        {
          url: o.path,
          sha2: o.sha2,
          sha512: o.sha512
        }
      ];
    throw (0, t.newError)(`No files provided: ${(0, t.safeStringifyJson)(o)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
  }
  function h(o, u, s = (f) => f) {
    const i = n(o).map((y) => {
      if (y.sha2 == null && y.sha512 == null)
        throw (0, t.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, t.safeStringifyJson)(y)}`, "ERR_UPDATER_NO_CHECKSUM");
      return {
        url: (0, a.newUrlFromBase)(s(y.url), u),
        info: y
      };
    }), g = o.packages, E = g == null ? null : g[process.arch] || g.ia32;
    return E != null && (i[0].packageInfo = {
      ...E,
      path: (0, a.newUrlFromBase)(s(E.path), u).href
    }), i;
  }
  return ft;
}
var el;
function ou() {
  if (el) return Zt;
  el = 1, Object.defineProperty(Zt, "__esModule", { value: !0 }), Zt.GenericProvider = void 0;
  const t = Be(), e = It(), a = et();
  let c = class extends a.Provider {
    constructor(l, n, h) {
      super(h), this.configuration = l, this.updater = n, this.baseUrl = (0, e.newBaseUrl)(this.configuration.url);
    }
    get channel() {
      const l = this.updater.channel || this.configuration.channel;
      return l == null ? this.getDefaultChannelName() : this.getCustomChannelName(l);
    }
    async getLatestVersion() {
      const l = (0, e.getChannelFilename)(this.channel), n = (0, e.newUrlFromBase)(l, this.baseUrl, this.updater.isAddNoCacheQuery);
      for (let h = 0; ; h++)
        try {
          return (0, a.parseUpdateInfo)(await this.httpRequest(n), l, n);
        } catch (o) {
          if (o instanceof t.HttpError && o.statusCode === 404)
            throw (0, t.newError)(`Cannot find channel "${l}" update info: ${o.stack || o.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
          if (o.code === "ECONNREFUSED" && h < 3) {
            await new Promise((u, s) => {
              try {
                setTimeout(u, 1e3 * h);
              } catch (f) {
                s(f);
              }
            });
            continue;
          }
          throw o;
        }
    }
    resolveFiles(l) {
      return (0, a.resolveFiles)(l, this.baseUrl);
    }
  };
  return Zt.GenericProvider = c, Zt;
}
var er = {}, tr = {}, tl;
function Df() {
  if (tl) return tr;
  tl = 1, Object.defineProperty(tr, "__esModule", { value: !0 }), tr.BitbucketProvider = void 0;
  const t = Be(), e = It(), a = et();
  let c = class extends a.Provider {
    constructor(l, n, h) {
      super({
        ...h,
        isUseMultipleRangeRequest: !1
      }), this.configuration = l, this.updater = n;
      const { owner: o, slug: u } = l;
      this.baseUrl = (0, e.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${o}/${u}/downloads`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "latest";
    }
    async getLatestVersion() {
      const l = new t.CancellationToken(), n = (0, e.getChannelFilename)(this.getCustomChannelName(this.channel)), h = (0, e.newUrlFromBase)(n, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const o = await this.httpRequest(h, void 0, l);
        return (0, a.parseUpdateInfo)(o, n, h);
      } catch (o) {
        throw (0, t.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${o.stack || o.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(l) {
      return (0, a.resolveFiles)(l, this.baseUrl);
    }
    toString() {
      const { owner: l, slug: n } = this.configuration;
      return `Bitbucket (owner: ${l}, slug: ${n}, channel: ${this.channel})`;
    }
  };
  return tr.BitbucketProvider = c, tr;
}
var mt = {}, rl;
function su() {
  if (rl) return mt;
  rl = 1, Object.defineProperty(mt, "__esModule", { value: !0 }), mt.GitHubProvider = mt.BaseGitHubProvider = void 0, mt.computeReleaseNotes = u;
  const t = Be(), e = au(), a = qt, c = It(), d = et(), l = /\/tag\/([^/]+)$/;
  class n extends d.Provider {
    constructor(f, i, g) {
      super({
        ...g,
        /* because GitHib uses S3 */
        isUseMultipleRangeRequest: !1
      }), this.options = f, this.baseUrl = (0, c.newBaseUrl)((0, t.githubUrl)(f, i));
      const E = i === "github.com" ? "api.github.com" : i;
      this.baseApiUrl = (0, c.newBaseUrl)((0, t.githubUrl)(f, E));
    }
    computeGithubBasePath(f) {
      const i = this.options.host;
      return i && !["github.com", "api.github.com"].includes(i) ? `/api/v3${f}` : f;
    }
  }
  mt.BaseGitHubProvider = n;
  let h = class extends n {
    constructor(f, i, g) {
      super(f, "github.com", g), this.options = f, this.updater = i;
    }
    get channel() {
      const f = this.updater.channel || this.options.channel;
      return f == null ? this.getDefaultChannelName() : this.getCustomChannelName(f);
    }
    async getLatestVersion() {
      var f, i, g, E, y;
      const p = new t.CancellationToken(), T = await this.httpRequest((0, c.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
        accept: "application/xml, application/atom+xml, text/xml, */*"
      }, p), b = (0, t.parseXml)(T);
      let O = b.element("entry", !1, "No published versions on GitHub"), D = null;
      try {
        if (this.updater.allowPrerelease) {
          const M = ((f = this.updater) === null || f === void 0 ? void 0 : f.channel) || ((i = e.prerelease(this.updater.currentVersion)) === null || i === void 0 ? void 0 : i[0]) || null;
          if (M === null)
            D = l.exec(O.element("link").attribute("href"))[1];
          else
            for (const U of b.getElements("entry")) {
              const x = l.exec(U.element("link").attribute("href"));
              if (x === null)
                continue;
              const k = x[1], N = ((g = e.prerelease(k)) === null || g === void 0 ? void 0 : g[0]) || null, P = !M || ["alpha", "beta"].includes(M), F = N !== null && !["alpha", "beta"].includes(String(N));
              if (P && !F && !(M === "beta" && N === "alpha")) {
                D = k;
                break;
              }
              if (N && N === M) {
                D = k;
                break;
              }
            }
        } else {
          D = await this.getLatestTagName(p);
          for (const M of b.getElements("entry"))
            if (l.exec(M.element("link").attribute("href"))[1] === D) {
              O = M;
              break;
            }
        }
      } catch (M) {
        throw (0, t.newError)(`Cannot parse releases feed: ${M.stack || M.message},
XML:
${T}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
      }
      if (D == null)
        throw (0, t.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
      let q, A = "", S = "";
      const R = async (M) => {
        A = (0, c.getChannelFilename)(M), S = (0, c.newUrlFromBase)(this.getBaseDownloadPath(String(D), A), this.baseUrl);
        const U = this.createRequestOptions(S);
        try {
          return await this.executor.request(U, p);
        } catch (x) {
          throw x instanceof t.HttpError && x.statusCode === 404 ? (0, t.newError)(`Cannot find ${A} in the latest release artifacts (${S}): ${x.stack || x.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : x;
        }
      };
      try {
        let M = this.channel;
        this.updater.allowPrerelease && (!((E = e.prerelease(D)) === null || E === void 0) && E[0]) && (M = this.getCustomChannelName(String((y = e.prerelease(D)) === null || y === void 0 ? void 0 : y[0]))), q = await R(M);
      } catch (M) {
        if (this.updater.allowPrerelease)
          q = await R(this.getDefaultChannelName());
        else
          throw M;
      }
      const v = (0, d.parseUpdateInfo)(q, A, S);
      return v.releaseName == null && (v.releaseName = O.elementValueOrEmpty("title")), v.releaseNotes == null && (v.releaseNotes = u(this.updater.currentVersion, this.updater.fullChangelog, b, O)), {
        tag: D,
        ...v
      };
    }
    async getLatestTagName(f) {
      const i = this.options, g = i.host == null || i.host === "github.com" ? (0, c.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new a.URL(`${this.computeGithubBasePath(`/repos/${i.owner}/${i.repo}/releases`)}/latest`, this.baseApiUrl);
      try {
        const E = await this.httpRequest(g, { Accept: "application/json" }, f);
        return E == null ? null : JSON.parse(E).tag_name;
      } catch (E) {
        throw (0, t.newError)(`Unable to find latest version on GitHub (${g}), please ensure a production release exists: ${E.stack || E.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return `/${this.options.owner}/${this.options.repo}/releases`;
    }
    resolveFiles(f) {
      return (0, d.resolveFiles)(f, this.baseUrl, (i) => this.getBaseDownloadPath(f.tag, i.replace(/ /g, "-")));
    }
    getBaseDownloadPath(f, i) {
      return `${this.basePath}/download/${f}/${i}`;
    }
  };
  mt.GitHubProvider = h;
  function o(s) {
    const f = s.elementValueOrEmpty("content");
    return f === "No content." ? "" : f;
  }
  function u(s, f, i, g) {
    if (!f)
      return o(g);
    const E = [];
    for (const y of i.getElements("entry")) {
      const p = /\/tag\/v?([^/]+)$/.exec(y.element("link").attribute("href"))[1];
      e.lt(s, p) && E.push({
        version: p,
        note: o(y)
      });
    }
    return E.sort((y, p) => e.rcompare(y.version, p.version));
  }
  return mt;
}
var rr = {}, nl;
function Pf() {
  if (nl) return rr;
  nl = 1, Object.defineProperty(rr, "__esModule", { value: !0 }), rr.KeygenProvider = void 0;
  const t = Be(), e = It(), a = et();
  let c = class extends a.Provider {
    constructor(l, n, h) {
      super({
        ...h,
        isUseMultipleRangeRequest: !1
      }), this.configuration = l, this.updater = n, this.defaultHostname = "api.keygen.sh";
      const o = this.configuration.host || this.defaultHostname;
      this.baseUrl = (0, e.newBaseUrl)(`https://${o}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "stable";
    }
    async getLatestVersion() {
      const l = new t.CancellationToken(), n = (0, e.getChannelFilename)(this.getCustomChannelName(this.channel)), h = (0, e.newUrlFromBase)(n, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const o = await this.httpRequest(h, {
          Accept: "application/vnd.api+json",
          "Keygen-Version": "1.1"
        }, l);
        return (0, a.parseUpdateInfo)(o, n, h);
      } catch (o) {
        throw (0, t.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${o.stack || o.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(l) {
      return (0, a.resolveFiles)(l, this.baseUrl);
    }
    toString() {
      const { account: l, product: n, platform: h } = this.configuration;
      return `Keygen (account: ${l}, product: ${n}, platform: ${h}, channel: ${this.channel})`;
    }
  };
  return rr.KeygenProvider = c, rr;
}
var nr = {}, il;
function If() {
  if (il) return nr;
  il = 1, Object.defineProperty(nr, "__esModule", { value: !0 }), nr.PrivateGitHubProvider = void 0;
  const t = Be(), e = sa(), a = Se, c = qt, d = It(), l = su(), n = et();
  let h = class extends l.BaseGitHubProvider {
    constructor(u, s, f, i) {
      super(u, "api.github.com", i), this.updater = s, this.token = f;
    }
    createRequestOptions(u, s) {
      const f = super.createRequestOptions(u, s);
      return f.redirect = "manual", f;
    }
    async getLatestVersion() {
      const u = new t.CancellationToken(), s = (0, d.getChannelFilename)(this.getDefaultChannelName()), f = await this.getLatestVersionInfo(u), i = f.assets.find((y) => y.name === s);
      if (i == null)
        throw (0, t.newError)(`Cannot find ${s} in the release ${f.html_url || f.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      const g = new c.URL(i.url);
      let E;
      try {
        E = (0, e.load)(await this.httpRequest(g, this.configureHeaders("application/octet-stream"), u));
      } catch (y) {
        throw y instanceof t.HttpError && y.statusCode === 404 ? (0, t.newError)(`Cannot find ${s} in the latest release artifacts (${g}): ${y.stack || y.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : y;
      }
      return E.assets = f.assets, E;
    }
    get fileExtraDownloadHeaders() {
      return this.configureHeaders("application/octet-stream");
    }
    configureHeaders(u) {
      return {
        accept: u,
        authorization: `token ${this.token}`
      };
    }
    async getLatestVersionInfo(u) {
      const s = this.updater.allowPrerelease;
      let f = this.basePath;
      s || (f = `${f}/latest`);
      const i = (0, d.newUrlFromBase)(f, this.baseUrl);
      try {
        const g = JSON.parse(await this.httpRequest(i, this.configureHeaders("application/vnd.github.v3+json"), u));
        return s ? g.find((E) => E.prerelease) || g[0] : g;
      } catch (g) {
        throw (0, t.newError)(`Unable to find latest version on GitHub (${i}), please ensure a production release exists: ${g.stack || g.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
    }
    resolveFiles(u) {
      return (0, n.getFileList)(u).map((s) => {
        const f = a.posix.basename(s.url).replace(/ /g, "-"), i = u.assets.find((g) => g != null && g.name === f);
        if (i == null)
          throw (0, t.newError)(`Cannot find asset "${f}" in: ${JSON.stringify(u.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
        return {
          url: new c.URL(i.url),
          info: s
        };
      });
    }
  };
  return nr.PrivateGitHubProvider = h, nr;
}
var al;
function Nf() {
  if (al) return er;
  al = 1, Object.defineProperty(er, "__esModule", { value: !0 }), er.isUrlProbablySupportMultiRangeRequests = n, er.createClient = h;
  const t = Be(), e = Df(), a = ou(), c = su(), d = Pf(), l = If();
  function n(o) {
    return !o.includes("s3.amazonaws.com");
  }
  function h(o, u, s) {
    if (typeof o == "string")
      throw (0, t.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
    const f = o.provider;
    switch (f) {
      case "github": {
        const i = o, g = (i.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || i.token;
        return g == null ? new c.GitHubProvider(i, u, s) : new l.PrivateGitHubProvider(i, u, g, s);
      }
      case "bitbucket":
        return new e.BitbucketProvider(o, u, s);
      case "keygen":
        return new d.KeygenProvider(o, u, s);
      case "s3":
      case "spaces":
        return new a.GenericProvider({
          provider: "generic",
          url: (0, t.getS3LikeProviderBaseUrl)(o),
          channel: o.channel || null
        }, u, {
          ...s,
          // https://github.com/minio/minio/issues/5285#issuecomment-350428955
          isUseMultipleRangeRequest: !1
        });
      case "generic": {
        const i = o;
        return new a.GenericProvider(i, u, {
          ...s,
          isUseMultipleRangeRequest: i.useMultipleRangeRequest !== !1 && n(i.url)
        });
      }
      case "custom": {
        const i = o, g = i.updateProvider;
        if (!g)
          throw (0, t.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
        return new g(i, u, s);
      }
      default:
        throw (0, t.newError)(`Unsupported provider: ${f}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
    }
  }
  return er;
}
var ir = {}, ar = {}, $t = {}, kt = {}, ol;
function pa() {
  if (ol) return kt;
  ol = 1, Object.defineProperty(kt, "__esModule", { value: !0 }), kt.OperationKind = void 0, kt.computeOperations = e;
  var t;
  (function(n) {
    n[n.COPY = 0] = "COPY", n[n.DOWNLOAD = 1] = "DOWNLOAD";
  })(t || (kt.OperationKind = t = {}));
  function e(n, h, o) {
    const u = l(n.files), s = l(h.files);
    let f = null;
    const i = h.files[0], g = [], E = i.name, y = u.get(E);
    if (y == null)
      throw new Error(`no file ${E} in old blockmap`);
    const p = s.get(E);
    let T = 0;
    const { checksumToOffset: b, checksumToOldSize: O } = d(u.get(E), y.offset, o);
    let D = i.offset;
    for (let q = 0; q < p.checksums.length; D += p.sizes[q], q++) {
      const A = p.sizes[q], S = p.checksums[q];
      let R = b.get(S);
      R != null && O.get(S) !== A && (o.warn(`Checksum ("${S}") matches, but size differs (old: ${O.get(S)}, new: ${A})`), R = void 0), R === void 0 ? (T++, f != null && f.kind === t.DOWNLOAD && f.end === D ? f.end += A : (f = {
        kind: t.DOWNLOAD,
        start: D,
        end: D + A
        // oldBlocks: null,
      }, c(f, g, S, q))) : f != null && f.kind === t.COPY && f.end === R ? f.end += A : (f = {
        kind: t.COPY,
        start: R,
        end: R + A
        // oldBlocks: [checksum]
      }, c(f, g, S, q));
    }
    return T > 0 && o.info(`File${i.name === "file" ? "" : " " + i.name} has ${T} changed blocks`), g;
  }
  const a = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
  function c(n, h, o, u) {
    if (a && h.length !== 0) {
      const s = h[h.length - 1];
      if (s.kind === n.kind && n.start < s.end && n.start > s.start) {
        const f = [s.start, s.end, n.start, n.end].reduce((i, g) => i < g ? i : g);
        throw new Error(`operation (block index: ${u}, checksum: ${o}, kind: ${t[n.kind]}) overlaps previous operation (checksum: ${o}):
abs: ${s.start} until ${s.end} and ${n.start} until ${n.end}
rel: ${s.start - f} until ${s.end - f} and ${n.start - f} until ${n.end - f}`);
      }
    }
    h.push(n);
  }
  function d(n, h, o) {
    const u = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
    let f = h;
    for (let i = 0; i < n.checksums.length; i++) {
      const g = n.checksums[i], E = n.sizes[i], y = s.get(g);
      if (y === void 0)
        u.set(g, f), s.set(g, E);
      else if (o.debug != null) {
        const p = y === E ? "(same size)" : `(size: ${y}, this size: ${E})`;
        o.debug(`${g} duplicated in blockmap ${p}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
      }
      f += E;
    }
    return { checksumToOffset: u, checksumToOldSize: s };
  }
  function l(n) {
    const h = /* @__PURE__ */ new Map();
    for (const o of n)
      h.set(o.name, o);
    return h;
  }
  return kt;
}
var sl;
function lu() {
  if (sl) return $t;
  sl = 1, Object.defineProperty($t, "__esModule", { value: !0 }), $t.DataSplitter = void 0, $t.copyData = n;
  const t = Be(), e = xe, a = mr, c = pa(), d = Buffer.from(`\r
\r
`);
  var l;
  (function(o) {
    o[o.INIT = 0] = "INIT", o[o.HEADER = 1] = "HEADER", o[o.BODY = 2] = "BODY";
  })(l || (l = {}));
  function n(o, u, s, f, i) {
    const g = (0, e.createReadStream)("", {
      fd: s,
      autoClose: !1,
      start: o.start,
      // end is inclusive
      end: o.end - 1
    });
    g.on("error", f), g.once("end", i), g.pipe(u, {
      end: !1
    });
  }
  let h = class extends a.Writable {
    constructor(u, s, f, i, g, E) {
      super(), this.out = u, this.options = s, this.partIndexToTaskIndex = f, this.partIndexToLength = g, this.finishHandler = E, this.partIndex = -1, this.headerListBuffer = null, this.readState = l.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = i.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
    }
    get isFinished() {
      return this.partIndex === this.partIndexToLength.length;
    }
    // noinspection JSUnusedGlobalSymbols
    _write(u, s, f) {
      if (this.isFinished) {
        console.error(`Trailing ignored data: ${u.length} bytes`);
        return;
      }
      this.handleData(u).then(f).catch(f);
    }
    async handleData(u) {
      let s = 0;
      if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
        throw (0, t.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
      if (this.ignoreByteCount > 0) {
        const f = Math.min(this.ignoreByteCount, u.length);
        this.ignoreByteCount -= f, s = f;
      } else if (this.remainingPartDataCount > 0) {
        const f = Math.min(this.remainingPartDataCount, u.length);
        this.remainingPartDataCount -= f, await this.processPartData(u, 0, f), s = f;
      }
      if (s !== u.length) {
        if (this.readState === l.HEADER) {
          const f = this.searchHeaderListEnd(u, s);
          if (f === -1)
            return;
          s = f, this.readState = l.BODY, this.headerListBuffer = null;
        }
        for (; ; ) {
          if (this.readState === l.BODY)
            this.readState = l.INIT;
          else {
            this.partIndex++;
            let E = this.partIndexToTaskIndex.get(this.partIndex);
            if (E == null)
              if (this.isFinished)
                E = this.options.end;
              else
                throw (0, t.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
            const y = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
            if (y < E)
              await this.copyExistingData(y, E);
            else if (y > E)
              throw (0, t.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
            if (this.isFinished) {
              this.onPartEnd(), this.finishHandler();
              return;
            }
            if (s = this.searchHeaderListEnd(u, s), s === -1) {
              this.readState = l.HEADER;
              return;
            }
          }
          const f = this.partIndexToLength[this.partIndex], i = s + f, g = Math.min(i, u.length);
          if (await this.processPartStarted(u, s, g), this.remainingPartDataCount = f - (g - s), this.remainingPartDataCount > 0)
            return;
          if (s = i + this.boundaryLength, s >= u.length) {
            this.ignoreByteCount = this.boundaryLength - (u.length - i);
            return;
          }
        }
      }
    }
    copyExistingData(u, s) {
      return new Promise((f, i) => {
        const g = () => {
          if (u === s) {
            f();
            return;
          }
          const E = this.options.tasks[u];
          if (E.kind !== c.OperationKind.COPY) {
            i(new Error("Task kind must be COPY"));
            return;
          }
          n(E, this.out, this.options.oldFileFd, i, () => {
            u++, g();
          });
        };
        g();
      });
    }
    searchHeaderListEnd(u, s) {
      const f = u.indexOf(d, s);
      if (f !== -1)
        return f + d.length;
      const i = s === 0 ? u : u.slice(s);
      return this.headerListBuffer == null ? this.headerListBuffer = i : this.headerListBuffer = Buffer.concat([this.headerListBuffer, i]), -1;
    }
    onPartEnd() {
      const u = this.partIndexToLength[this.partIndex - 1];
      if (this.actualPartLength !== u)
        throw (0, t.newError)(`Expected length: ${u} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
      this.actualPartLength = 0;
    }
    processPartStarted(u, s, f) {
      return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(u, s, f);
    }
    processPartData(u, s, f) {
      this.actualPartLength += f - s;
      const i = this.out;
      return i.write(s === 0 && u.length === f ? u : u.slice(s, f)) ? Promise.resolve() : new Promise((g, E) => {
        i.on("error", E), i.once("drain", () => {
          i.removeListener("error", E), g();
        });
      });
    }
  };
  return $t.DataSplitter = h, $t;
}
var or = {}, ll;
function Ff() {
  if (ll) return or;
  ll = 1, Object.defineProperty(or, "__esModule", { value: !0 }), or.executeTasksUsingMultipleRangeRequests = c, or.checkIsRangesSupported = l;
  const t = Be(), e = lu(), a = pa();
  function c(n, h, o, u, s) {
    const f = (i) => {
      if (i >= h.length) {
        n.fileMetadataBuffer != null && o.write(n.fileMetadataBuffer), o.end();
        return;
      }
      const g = i + 1e3;
      d(n, {
        tasks: h,
        start: i,
        end: Math.min(h.length, g),
        oldFileFd: u
      }, o, () => f(g), s);
    };
    return f;
  }
  function d(n, h, o, u, s) {
    let f = "bytes=", i = 0;
    const g = /* @__PURE__ */ new Map(), E = [];
    for (let T = h.start; T < h.end; T++) {
      const b = h.tasks[T];
      b.kind === a.OperationKind.DOWNLOAD && (f += `${b.start}-${b.end - 1}, `, g.set(i, T), i++, E.push(b.end - b.start));
    }
    if (i <= 1) {
      const T = (b) => {
        if (b >= h.end) {
          u();
          return;
        }
        const O = h.tasks[b++];
        if (O.kind === a.OperationKind.COPY)
          (0, e.copyData)(O, o, h.oldFileFd, s, () => T(b));
        else {
          const D = n.createRequestOptions();
          D.headers.Range = `bytes=${O.start}-${O.end - 1}`;
          const q = n.httpExecutor.createRequest(D, (A) => {
            l(A, s) && (A.pipe(o, {
              end: !1
            }), A.once("end", () => T(b)));
          });
          n.httpExecutor.addErrorAndTimeoutHandlers(q, s), q.end();
        }
      };
      T(h.start);
      return;
    }
    const y = n.createRequestOptions();
    y.headers.Range = f.substring(0, f.length - 2);
    const p = n.httpExecutor.createRequest(y, (T) => {
      if (!l(T, s))
        return;
      const b = (0, t.safeGetHeader)(T, "content-type"), O = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(b);
      if (O == null) {
        s(new Error(`Content-Type "multipart/byteranges" is expected, but got "${b}"`));
        return;
      }
      const D = new e.DataSplitter(o, h, g, O[1] || O[2], E, u);
      D.on("error", s), T.pipe(D), T.on("end", () => {
        setTimeout(() => {
          p.abort(), s(new Error("Response ends without calling any handlers"));
        }, 1e4);
      });
    });
    n.httpExecutor.addErrorAndTimeoutHandlers(p, s), p.end();
  }
  function l(n, h) {
    if (n.statusCode >= 400)
      return h((0, t.createHttpError)(n)), !1;
    if (n.statusCode !== 206) {
      const o = (0, t.safeGetHeader)(n, "accept-ranges");
      if (o == null || o === "none")
        return h(new Error(`Server doesn't support Accept-Ranges (response code ${n.statusCode})`)), !1;
    }
    return !0;
  }
  return or;
}
var sr = {}, ul;
function Lf() {
  if (ul) return sr;
  ul = 1, Object.defineProperty(sr, "__esModule", { value: !0 }), sr.ProgressDifferentialDownloadCallbackTransform = void 0;
  const t = mr;
  var e;
  (function(c) {
    c[c.COPY = 0] = "COPY", c[c.DOWNLOAD = 1] = "DOWNLOAD";
  })(e || (e = {}));
  let a = class extends t.Transform {
    constructor(d, l, n) {
      super(), this.progressDifferentialDownloadInfo = d, this.cancellationToken = l, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = e.COPY, this.nextUpdate = this.start + 1e3;
    }
    _transform(d, l, n) {
      if (this.cancellationToken.cancelled) {
        n(new Error("cancelled"), null);
        return;
      }
      if (this.operationType == e.COPY) {
        n(null, d);
        return;
      }
      this.transferred += d.length, this.delta += d.length;
      const h = Date.now();
      h >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = h + 1e3, this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((h - this.start) / 1e3))
      }), this.delta = 0), n(null, d);
    }
    beginFileCopy() {
      this.operationType = e.COPY;
    }
    beginRangeDownload() {
      this.operationType = e.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
    }
    endRangeDownload() {
      this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      });
    }
    // Called when we are 100% done with the connection/download
    _flush(d) {
      if (this.cancellationToken.cancelled) {
        d(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, this.transferred = 0, d(null);
    }
  };
  return sr.ProgressDifferentialDownloadCallbackTransform = a, sr;
}
var cl;
function uu() {
  if (cl) return ar;
  cl = 1, Object.defineProperty(ar, "__esModule", { value: !0 }), ar.DifferentialDownloader = void 0;
  const t = Be(), e = /* @__PURE__ */ Et(), a = xe, c = lu(), d = qt, l = pa(), n = Ff(), h = Lf();
  let o = class {
    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor(i, g, E) {
      this.blockAwareFileInfo = i, this.httpExecutor = g, this.options = E, this.fileMetadataBuffer = null, this.logger = E.logger;
    }
    createRequestOptions() {
      const i = {
        headers: {
          ...this.options.requestHeaders,
          accept: "*/*"
        }
      };
      return (0, t.configureRequestUrl)(this.options.newUrl, i), (0, t.configureRequestOptions)(i), i;
    }
    doDownload(i, g) {
      if (i.version !== g.version)
        throw new Error(`version is different (${i.version} - ${g.version}), full download is required`);
      const E = this.logger, y = (0, l.computeOperations)(i, g, E);
      E.debug != null && E.debug(JSON.stringify(y, null, 2));
      let p = 0, T = 0;
      for (const O of y) {
        const D = O.end - O.start;
        O.kind === l.OperationKind.DOWNLOAD ? p += D : T += D;
      }
      const b = this.blockAwareFileInfo.size;
      if (p + T + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== b)
        throw new Error(`Internal error, size mismatch: downloadSize: ${p}, copySize: ${T}, newSize: ${b}`);
      return E.info(`Full: ${u(b)}, To download: ${u(p)} (${Math.round(p / (b / 100))}%)`), this.downloadFile(y);
    }
    downloadFile(i) {
      const g = [], E = () => Promise.all(g.map((y) => (0, e.close)(y.descriptor).catch((p) => {
        this.logger.error(`cannot close file "${y.path}": ${p}`);
      })));
      return this.doDownloadFile(i, g).then(E).catch((y) => E().catch((p) => {
        try {
          this.logger.error(`cannot close files: ${p}`);
        } catch (T) {
          try {
            console.error(T);
          } catch {
          }
        }
        throw y;
      }).then(() => {
        throw y;
      }));
    }
    async doDownloadFile(i, g) {
      const E = await (0, e.open)(this.options.oldFile, "r");
      g.push({ descriptor: E, path: this.options.oldFile });
      const y = await (0, e.open)(this.options.newFile, "w");
      g.push({ descriptor: y, path: this.options.newFile });
      const p = (0, a.createWriteStream)(this.options.newFile, { fd: y });
      await new Promise((T, b) => {
        const O = [];
        let D;
        if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
          const x = [];
          let k = 0;
          for (const P of i)
            P.kind === l.OperationKind.DOWNLOAD && (x.push(P.end - P.start), k += P.end - P.start);
          const N = {
            expectedByteCounts: x,
            grandTotal: k
          };
          D = new h.ProgressDifferentialDownloadCallbackTransform(N, this.options.cancellationToken, this.options.onProgress), O.push(D);
        }
        const q = new t.DigestTransform(this.blockAwareFileInfo.sha512);
        q.isValidateOnEnd = !1, O.push(q), p.on("finish", () => {
          p.close(() => {
            g.splice(1, 1);
            try {
              q.validate();
            } catch (x) {
              b(x);
              return;
            }
            T(void 0);
          });
        }), O.push(p);
        let A = null;
        for (const x of O)
          x.on("error", b), A == null ? A = x : A = A.pipe(x);
        const S = O[0];
        let R;
        if (this.options.isUseMultipleRangeRequest) {
          R = (0, n.executeTasksUsingMultipleRangeRequests)(this, i, S, E, b), R(0);
          return;
        }
        let v = 0, M = null;
        this.logger.info(`Differential download: ${this.options.newUrl}`);
        const U = this.createRequestOptions();
        U.redirect = "manual", R = (x) => {
          var k, N;
          if (x >= i.length) {
            this.fileMetadataBuffer != null && S.write(this.fileMetadataBuffer), S.end();
            return;
          }
          const P = i[x++];
          if (P.kind === l.OperationKind.COPY) {
            D && D.beginFileCopy(), (0, c.copyData)(P, S, E, b, () => R(x));
            return;
          }
          const F = `bytes=${P.start}-${P.end - 1}`;
          U.headers.range = F, (N = (k = this.logger) === null || k === void 0 ? void 0 : k.debug) === null || N === void 0 || N.call(k, `download range: ${F}`), D && D.beginRangeDownload();
          const $ = this.httpExecutor.createRequest(U, (J) => {
            J.on("error", b), J.on("aborted", () => {
              b(new Error("response has been aborted by the server"));
            }), J.statusCode >= 400 && b((0, t.createHttpError)(J)), J.pipe(S, {
              end: !1
            }), J.once("end", () => {
              D && D.endRangeDownload(), ++v === 100 ? (v = 0, setTimeout(() => R(x), 1e3)) : R(x);
            });
          });
          $.on("redirect", (J, W, ne) => {
            this.logger.info(`Redirect to ${s(ne)}`), M = ne, (0, t.configureRequestUrl)(new d.URL(M), U), $.followRedirect();
          }), this.httpExecutor.addErrorAndTimeoutHandlers($, b), $.end();
        }, R(0);
      });
    }
    async readRemoteBytes(i, g) {
      const E = Buffer.allocUnsafe(g + 1 - i), y = this.createRequestOptions();
      y.headers.range = `bytes=${i}-${g}`;
      let p = 0;
      if (await this.request(y, (T) => {
        T.copy(E, p), p += T.length;
      }), p !== E.length)
        throw new Error(`Received data length ${p} is not equal to expected ${E.length}`);
      return E;
    }
    request(i, g) {
      return new Promise((E, y) => {
        const p = this.httpExecutor.createRequest(i, (T) => {
          (0, n.checkIsRangesSupported)(T, y) && (T.on("error", y), T.on("aborted", () => {
            y(new Error("response has been aborted by the server"));
          }), T.on("data", g), T.on("end", () => E()));
        });
        this.httpExecutor.addErrorAndTimeoutHandlers(p, y), p.end();
      });
    }
  };
  ar.DifferentialDownloader = o;
  function u(f, i = " KB") {
    return new Intl.NumberFormat("en").format((f / 1024).toFixed(2)) + i;
  }
  function s(f) {
    const i = f.indexOf("?");
    return i < 0 ? f : f.substring(0, i);
  }
  return ar;
}
var fl;
function xf() {
  if (fl) return ir;
  fl = 1, Object.defineProperty(ir, "__esModule", { value: !0 }), ir.GenericDifferentialDownloader = void 0;
  const t = uu();
  let e = class extends t.DifferentialDownloader {
    download(c, d) {
      return this.doDownload(c, d);
    }
  };
  return ir.GenericDifferentialDownloader = e, ir;
}
var Zi = {}, dl;
function Nt() {
  return dl || (dl = 1, function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.UpdaterSignal = t.UPDATE_DOWNLOADED = t.DOWNLOAD_PROGRESS = t.CancellationToken = void 0, t.addHandler = c;
    const e = Be();
    Object.defineProperty(t, "CancellationToken", { enumerable: !0, get: function() {
      return e.CancellationToken;
    } }), t.DOWNLOAD_PROGRESS = "download-progress", t.UPDATE_DOWNLOADED = "update-downloaded";
    class a {
      constructor(l) {
        this.emitter = l;
      }
      /**
       * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
       */
      login(l) {
        c(this.emitter, "login", l);
      }
      progress(l) {
        c(this.emitter, t.DOWNLOAD_PROGRESS, l);
      }
      updateDownloaded(l) {
        c(this.emitter, t.UPDATE_DOWNLOADED, l);
      }
      updateCancelled(l) {
        c(this.emitter, "update-cancelled", l);
      }
    }
    t.UpdaterSignal = a;
    function c(d, l, n) {
      d.on(l, n);
    }
  }(Zi)), Zi;
}
var hl;
function ga() {
  if (hl) return bt;
  hl = 1, Object.defineProperty(bt, "__esModule", { value: !0 }), bt.NoOpLogger = bt.AppUpdater = void 0;
  const t = Be(), e = Er, a = jr, c = Nl, d = /* @__PURE__ */ Et(), l = sa(), n = Jc(), h = Se, o = au(), u = Rf(), s = Af(), f = Cf(), i = ou(), g = Nf(), E = Ll, y = It(), p = xf(), T = Nt();
  let b = class cu extends c.EventEmitter {
    /**
     * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
     */
    get channel() {
      return this._channel;
    }
    /**
     * Set the update channel. Overrides `channel` in the update configuration.
     *
     * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
     */
    set channel(A) {
      if (this._channel != null) {
        if (typeof A != "string")
          throw (0, t.newError)(`Channel must be a string, but got: ${A}`, "ERR_UPDATER_INVALID_CHANNEL");
        if (A.length === 0)
          throw (0, t.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
      }
      this._channel = A, this.allowDowngrade = !0;
    }
    /**
     *  Shortcut for explicitly adding auth tokens to request headers
     */
    addAuthHeader(A) {
      this.requestHeaders = Object.assign({}, this.requestHeaders, {
        authorization: A
      });
    }
    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    get netSession() {
      return (0, f.getNetSession)();
    }
    /**
     * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
     * Set it to `null` if you would like to disable a logging feature.
     */
    get logger() {
      return this._logger;
    }
    set logger(A) {
      this._logger = A ?? new D();
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * test only
     * @private
     */
    set updateConfigPath(A) {
      this.clientPromise = null, this._appUpdateConfigPath = A, this.configOnDisk = new n.Lazy(() => this.loadUpdateConfig());
    }
    /**
     * Allows developer to override default logic for determining if an update is supported.
     * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
     */
    get isUpdateSupported() {
      return this._isUpdateSupported;
    }
    set isUpdateSupported(A) {
      A && (this._isUpdateSupported = A);
    }
    constructor(A, S) {
      super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new T.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (M) => this.checkIfUpdateSupported(M), this.clientPromise = null, this.stagingUserIdPromise = new n.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new n.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (M) => {
        this._logger.error(`Error: ${M.stack || M.message}`);
      }), S == null ? (this.app = new s.ElectronAppAdapter(), this.httpExecutor = new f.ElectronHttpExecutor((M, U) => this.emit("login", M, U))) : (this.app = S, this.httpExecutor = null);
      const R = this.app.version, v = (0, o.parse)(R);
      if (v == null)
        throw (0, t.newError)(`App version is not a valid semver version: "${R}"`, "ERR_UPDATER_INVALID_VERSION");
      this.currentVersion = v, this.allowPrerelease = O(v), A != null && (this.setFeedURL(A), typeof A != "string" && A.requestHeaders && (this.requestHeaders = A.requestHeaders));
    }
    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    getFeedURL() {
      return "Deprecated. Do not use it.";
    }
    /**
     * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
     * @param options If you want to override configuration in the `app-update.yml`.
     */
    setFeedURL(A) {
      const S = this.createProviderRuntimeOptions();
      let R;
      typeof A == "string" ? R = new i.GenericProvider({ provider: "generic", url: A }, this, {
        ...S,
        isUseMultipleRangeRequest: (0, g.isUrlProbablySupportMultiRangeRequests)(A)
      }) : R = (0, g.createClient)(A, this, S), this.clientPromise = Promise.resolve(R);
    }
    /**
     * Asks the server whether there is an update.
     * @returns null if the updater is disabled, otherwise info about the latest version
     */
    checkForUpdates() {
      if (!this.isUpdaterActive())
        return Promise.resolve(null);
      let A = this.checkForUpdatesPromise;
      if (A != null)
        return this._logger.info("Checking for update (already in progress)"), A;
      const S = () => this.checkForUpdatesPromise = null;
      return this._logger.info("Checking for update"), A = this.doCheckForUpdates().then((R) => (S(), R)).catch((R) => {
        throw S(), this.emit("error", R, `Cannot check for updates: ${(R.stack || R).toString()}`), R;
      }), this.checkForUpdatesPromise = A, A;
    }
    isUpdaterActive() {
      return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
    }
    // noinspection JSUnusedGlobalSymbols
    checkForUpdatesAndNotify(A) {
      return this.checkForUpdates().then((S) => S?.downloadPromise ? (S.downloadPromise.then(() => {
        const R = cu.formatDownloadNotification(S.updateInfo.version, this.app.name, A);
        new Dt.Notification(R).show();
      }), S) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), S));
    }
    static formatDownloadNotification(A, S, R) {
      return R == null && (R = {
        title: "A new update is ready to install",
        body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
      }), R = {
        title: R.title.replace("{appName}", S).replace("{version}", A),
        body: R.body.replace("{appName}", S).replace("{version}", A)
      }, R;
    }
    async isStagingMatch(A) {
      const S = A.stagingPercentage;
      let R = S;
      if (R == null)
        return !0;
      if (R = parseInt(R, 10), isNaN(R))
        return this._logger.warn(`Staging percentage is NaN: ${S}`), !0;
      R = R / 100;
      const v = await this.stagingUserIdPromise.value, U = t.UUID.parse(v).readUInt32BE(12) / 4294967295;
      return this._logger.info(`Staging percentage: ${R}, percentage: ${U}, user id: ${v}`), U < R;
    }
    computeFinalHeaders(A) {
      return this.requestHeaders != null && Object.assign(A, this.requestHeaders), A;
    }
    async isUpdateAvailable(A) {
      const S = (0, o.parse)(A.version);
      if (S == null)
        throw (0, t.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${A.version}"`, "ERR_UPDATER_INVALID_VERSION");
      const R = this.currentVersion;
      if ((0, o.eq)(S, R) || !await Promise.resolve(this.isUpdateSupported(A)) || !await this.isStagingMatch(A))
        return !1;
      const M = (0, o.gt)(S, R), U = (0, o.lt)(S, R);
      return M ? !0 : this.allowDowngrade && U;
    }
    checkIfUpdateSupported(A) {
      const S = A?.minimumSystemVersion, R = (0, a.release)();
      if (S)
        try {
          if ((0, o.lt)(R, S))
            return this._logger.info(`Current OS version ${R} is less than the minimum OS version required ${S} for version ${R}`), !1;
        } catch (v) {
          this._logger.warn(`Failed to compare current OS version(${R}) with minimum OS version(${S}): ${(v.message || v).toString()}`);
        }
      return !0;
    }
    async getUpdateInfoAndProvider() {
      await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((R) => (0, g.createClient)(R, this, this.createProviderRuntimeOptions())));
      const A = await this.clientPromise, S = await this.stagingUserIdPromise.value;
      return A.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": S })), {
        info: await A.getLatestVersion(),
        provider: A
      };
    }
    createProviderRuntimeOptions() {
      return {
        isUseMultipleRangeRequest: !0,
        platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
        executor: this.httpExecutor
      };
    }
    async doCheckForUpdates() {
      this.emit("checking-for-update");
      const A = await this.getUpdateInfoAndProvider(), S = A.info;
      if (!await this.isUpdateAvailable(S))
        return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${S.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", S), {
          isUpdateAvailable: !1,
          versionInfo: S,
          updateInfo: S
        };
      this.updateInfoAndProvider = A, this.onUpdateAvailable(S);
      const R = new t.CancellationToken();
      return {
        isUpdateAvailable: !0,
        versionInfo: S,
        updateInfo: S,
        cancellationToken: R,
        downloadPromise: this.autoDownload ? this.downloadUpdate(R) : null
      };
    }
    onUpdateAvailable(A) {
      this._logger.info(`Found version ${A.version} (url: ${(0, t.asArray)(A.files).map((S) => S.url).join(", ")})`), this.emit("update-available", A);
    }
    /**
     * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
     * @returns {Promise<Array<string>>} Paths to downloaded files.
     */
    downloadUpdate(A = new t.CancellationToken()) {
      const S = this.updateInfoAndProvider;
      if (S == null) {
        const v = new Error("Please check update first");
        return this.dispatchError(v), Promise.reject(v);
      }
      if (this.downloadPromise != null)
        return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
      this._logger.info(`Downloading update from ${(0, t.asArray)(S.info.files).map((v) => v.url).join(", ")}`);
      const R = (v) => {
        if (!(v instanceof t.CancellationError))
          try {
            this.dispatchError(v);
          } catch (M) {
            this._logger.warn(`Cannot dispatch error event: ${M.stack || M}`);
          }
        return v;
      };
      return this.downloadPromise = this.doDownloadUpdate({
        updateInfoAndProvider: S,
        requestHeaders: this.computeRequestHeaders(S.provider),
        cancellationToken: A,
        disableWebInstaller: this.disableWebInstaller,
        disableDifferentialDownload: this.disableDifferentialDownload
      }).catch((v) => {
        throw R(v);
      }).finally(() => {
        this.downloadPromise = null;
      }), this.downloadPromise;
    }
    dispatchError(A) {
      this.emit("error", A, (A.stack || A).toString());
    }
    dispatchUpdateDownloaded(A) {
      this.emit(T.UPDATE_DOWNLOADED, A);
    }
    async loadUpdateConfig() {
      return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, l.load)(await (0, d.readFile)(this._appUpdateConfigPath, "utf-8"));
    }
    computeRequestHeaders(A) {
      const S = A.fileExtraDownloadHeaders;
      if (S != null) {
        const R = this.requestHeaders;
        return R == null ? S : {
          ...S,
          ...R
        };
      }
      return this.computeFinalHeaders({ accept: "*/*" });
    }
    async getOrCreateStagingUserId() {
      const A = h.join(this.app.userDataPath, ".updaterId");
      try {
        const R = await (0, d.readFile)(A, "utf-8");
        if (t.UUID.check(R))
          return R;
        this._logger.warn(`Staging user id file exists, but content was invalid: ${R}`);
      } catch (R) {
        R.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${R}`);
      }
      const S = t.UUID.v5((0, e.randomBytes)(4096), t.UUID.OID);
      this._logger.info(`Generated new staging user ID: ${S}`);
      try {
        await (0, d.outputFile)(A, S);
      } catch (R) {
        this._logger.warn(`Couldn't write out staging user ID: ${R}`);
      }
      return S;
    }
    /** @internal */
    get isAddNoCacheQuery() {
      const A = this.requestHeaders;
      if (A == null)
        return !0;
      for (const S of Object.keys(A)) {
        const R = S.toLowerCase();
        if (R === "authorization" || R === "private-token")
          return !1;
      }
      return !0;
    }
    async getOrCreateDownloadHelper() {
      let A = this.downloadedUpdateHelper;
      if (A == null) {
        const S = (await this.configOnDisk.value).updaterCacheDirName, R = this._logger;
        S == null && R.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
        const v = h.join(this.app.baseCachePath, S || this.app.name);
        R.debug != null && R.debug(`updater cache dir: ${v}`), A = new u.DownloadedUpdateHelper(v), this.downloadedUpdateHelper = A;
      }
      return A;
    }
    async executeDownload(A) {
      const S = A.fileInfo, R = {
        headers: A.downloadUpdateOptions.requestHeaders,
        cancellationToken: A.downloadUpdateOptions.cancellationToken,
        sha2: S.info.sha2,
        sha512: S.info.sha512
      };
      this.listenerCount(T.DOWNLOAD_PROGRESS) > 0 && (R.onProgress = (ie) => this.emit(T.DOWNLOAD_PROGRESS, ie));
      const v = A.downloadUpdateOptions.updateInfoAndProvider.info, M = v.version, U = S.packageInfo;
      function x() {
        const ie = decodeURIComponent(A.fileInfo.url.pathname);
        return ie.endsWith(`.${A.fileExtension}`) ? h.basename(ie) : A.fileInfo.info.url;
      }
      const k = await this.getOrCreateDownloadHelper(), N = k.cacheDirForPendingUpdate;
      await (0, d.mkdir)(N, { recursive: !0 });
      const P = x();
      let F = h.join(N, P);
      const $ = U == null ? null : h.join(N, `package-${M}${h.extname(U.path) || ".7z"}`), J = async (ie) => (await k.setDownloadedFile(F, $, v, S, P, ie), await A.done({
        ...v,
        downloadedFile: F
      }), $ == null ? [F] : [F, $]), W = this._logger, ne = await k.validateDownloadedPath(F, v, S, W);
      if (ne != null)
        return F = ne, await J(!1);
      const ce = async () => (await k.clear().catch(() => {
      }), await (0, d.unlink)(F).catch(() => {
      })), ue = await (0, u.createTempUpdateFile)(`temp-${P}`, N, W);
      try {
        await A.task(ue, R, $, ce), await (0, t.retry)(() => (0, d.rename)(ue, F), 60, 500, 0, 0, (ie) => ie instanceof Error && /^EBUSY:/.test(ie.message));
      } catch (ie) {
        throw await ce(), ie instanceof t.CancellationError && (W.info("cancelled"), this.emit("update-cancelled", v)), ie;
      }
      return W.info(`New version ${M} has been downloaded to ${F}`), await J(!0);
    }
    async differentialDownloadInstaller(A, S, R, v, M) {
      try {
        if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
          return !0;
        const U = (0, y.blockmapFiles)(A.url, this.app.version, S.updateInfoAndProvider.info.version);
        this._logger.info(`Download block maps (old: "${U[0]}", new: ${U[1]})`);
        const x = async (P) => {
          const F = await this.httpExecutor.downloadToBuffer(P, {
            headers: S.requestHeaders,
            cancellationToken: S.cancellationToken
          });
          if (F == null || F.length === 0)
            throw new Error(`Blockmap "${P.href}" is empty`);
          try {
            return JSON.parse((0, E.gunzipSync)(F).toString());
          } catch ($) {
            throw new Error(`Cannot parse blockmap "${P.href}", error: ${$}`);
          }
        }, k = {
          newUrl: A.url,
          oldFile: h.join(this.downloadedUpdateHelper.cacheDir, M),
          logger: this._logger,
          newFile: R,
          isUseMultipleRangeRequest: v.isUseMultipleRangeRequest,
          requestHeaders: S.requestHeaders,
          cancellationToken: S.cancellationToken
        };
        this.listenerCount(T.DOWNLOAD_PROGRESS) > 0 && (k.onProgress = (P) => this.emit(T.DOWNLOAD_PROGRESS, P));
        const N = await Promise.all(U.map((P) => x(P)));
        return await new p.GenericDifferentialDownloader(A.info, this.httpExecutor, k).download(N[0], N[1]), !1;
      } catch (U) {
        if (this._logger.error(`Cannot download differentially, fallback to full download: ${U.stack || U}`), this._testOnlyOptions != null)
          throw U;
        return !0;
      }
    }
  };
  bt.AppUpdater = b;
  function O(q) {
    const A = (0, o.prerelease)(q);
    return A != null && A.length > 0;
  }
  class D {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info(A) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    warn(A) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error(A) {
    }
  }
  return bt.NoOpLogger = D, bt;
}
var pl;
function Gt() {
  if (pl) return Yt;
  pl = 1, Object.defineProperty(Yt, "__esModule", { value: !0 }), Yt.BaseUpdater = void 0;
  const t = Br, e = ga();
  let a = class extends e.AppUpdater {
    constructor(d, l) {
      super(d, l), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
    }
    quitAndInstall(d = !1, l = !1) {
      this._logger.info("Install on explicit quitAndInstall"), this.install(d, d ? l : this.autoRunAppAfterInstall) ? setImmediate(() => {
        Dt.autoUpdater.emit("before-quit-for-update"), this.app.quit();
      }) : this.quitAndInstallCalled = !1;
    }
    executeDownload(d) {
      return super.executeDownload({
        ...d,
        done: (l) => (this.dispatchUpdateDownloaded(l), this.addQuitHandler(), Promise.resolve())
      });
    }
    get installerPath() {
      return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
    }
    // must be sync (because quit even handler is not async)
    install(d = !1, l = !1) {
      if (this.quitAndInstallCalled)
        return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
      const n = this.downloadedUpdateHelper, h = this.installerPath, o = n == null ? null : n.downloadedFileInfo;
      if (h == null || o == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      this.quitAndInstallCalled = !0;
      try {
        return this._logger.info(`Install: isSilent: ${d}, isForceRunAfter: ${l}`), this.doInstall({
          isSilent: d,
          isForceRunAfter: l,
          isAdminRightsRequired: o.isAdminRightsRequired
        });
      } catch (u) {
        return this.dispatchError(u), !1;
      }
    }
    addQuitHandler() {
      this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((d) => {
        if (this.quitAndInstallCalled) {
          this._logger.info("Update installer has already been triggered. Quitting application.");
          return;
        }
        if (!this.autoInstallOnAppQuit) {
          this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
          return;
        }
        if (d !== 0) {
          this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${d}`);
          return;
        }
        this._logger.info("Auto install update on quit"), this.install(!0, !1);
      }));
    }
    wrapSudo() {
      const { name: d } = this.app, l = `"${d} would like to update"`, n = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu"), h = [n];
      return /kdesudo/i.test(n) ? (h.push("--comment", l), h.push("-c")) : /gksudo/i.test(n) ? h.push("--message", l) : /pkexec/i.test(n) && h.push("--disable-internal-agent"), h.join(" ");
    }
    spawnSyncLog(d, l = [], n = {}) {
      this._logger.info(`Executing: ${d} with args: ${l}`);
      const h = (0, t.spawnSync)(d, l, {
        env: { ...process.env, ...n },
        encoding: "utf-8",
        shell: !0
      }), { error: o, status: u, stdout: s, stderr: f } = h;
      if (o != null)
        throw this._logger.error(f), o;
      if (u != null && u !== 0)
        throw this._logger.error(f), new Error(`Command ${d} exited with code ${u}`);
      return s.trim();
    }
    /**
     * This handles both node 8 and node 10 way of emitting error when spawning a process
     *   - node 8: Throws the error
     *   - node 10: Emit the error(Need to listen with on)
     */
    // https://github.com/electron-userland/electron-builder/issues/1129
    // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
    async spawnLog(d, l = [], n = void 0, h = "ignore") {
      return this._logger.info(`Executing: ${d} with args: ${l}`), new Promise((o, u) => {
        try {
          const s = { stdio: h, env: n, detached: !0 }, f = (0, t.spawn)(d, l, s);
          f.on("error", (i) => {
            u(i);
          }), f.unref(), f.pid !== void 0 && o(!0);
        } catch (s) {
          u(s);
        }
      });
    }
  };
  return Yt.BaseUpdater = a, Yt;
}
var lr = {}, ur = {}, gl;
function fu() {
  if (gl) return ur;
  gl = 1, Object.defineProperty(ur, "__esModule", { value: !0 }), ur.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
  const t = /* @__PURE__ */ Et(), e = uu(), a = Ll;
  let c = class extends e.DifferentialDownloader {
    async download() {
      const h = this.blockAwareFileInfo, o = h.size, u = o - (h.blockMapSize + 4);
      this.fileMetadataBuffer = await this.readRemoteBytes(u, o - 1);
      const s = d(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
      await this.doDownload(await l(this.options.oldFile), s);
    }
  };
  ur.FileWithEmbeddedBlockMapDifferentialDownloader = c;
  function d(n) {
    return JSON.parse((0, a.inflateRawSync)(n).toString());
  }
  async function l(n) {
    const h = await (0, t.open)(n, "r");
    try {
      const o = (await (0, t.fstat)(h)).size, u = Buffer.allocUnsafe(4);
      await (0, t.read)(h, u, 0, u.length, o - u.length);
      const s = Buffer.allocUnsafe(u.readUInt32BE(0));
      return await (0, t.read)(h, s, 0, s.length, o - u.length - s.length), await (0, t.close)(h), d(s);
    } catch (o) {
      throw await (0, t.close)(h), o;
    }
  }
  return ur;
}
var ml;
function El() {
  if (ml) return lr;
  ml = 1, Object.defineProperty(lr, "__esModule", { value: !0 }), lr.AppImageUpdater = void 0;
  const t = Be(), e = Br, a = /* @__PURE__ */ Et(), c = xe, d = Se, l = Gt(), n = fu(), h = et(), o = Nt();
  let u = class extends l.BaseUpdater {
    constructor(f, i) {
      super(f, i);
    }
    isUpdaterActive() {
      return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
    }
    /*** @private */
    doDownloadUpdate(f) {
      const i = f.updateInfoAndProvider.provider, g = (0, h.findFile)(i.resolveFiles(f.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "AppImage",
        fileInfo: g,
        downloadUpdateOptions: f,
        task: async (E, y) => {
          const p = process.env.APPIMAGE;
          if (p == null)
            throw (0, t.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
          (f.disableDifferentialDownload || await this.downloadDifferential(g, p, E, i, f)) && await this.httpExecutor.download(g.url, E, y), await (0, a.chmod)(E, 493);
        }
      });
    }
    async downloadDifferential(f, i, g, E, y) {
      try {
        const p = {
          newUrl: f.url,
          oldFile: i,
          logger: this._logger,
          newFile: g,
          isUseMultipleRangeRequest: E.isUseMultipleRangeRequest,
          requestHeaders: y.requestHeaders,
          cancellationToken: y.cancellationToken
        };
        return this.listenerCount(o.DOWNLOAD_PROGRESS) > 0 && (p.onProgress = (T) => this.emit(o.DOWNLOAD_PROGRESS, T)), await new n.FileWithEmbeddedBlockMapDifferentialDownloader(f.info, this.httpExecutor, p).download(), !1;
      } catch (p) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${p.stack || p}`), process.platform === "linux";
      }
    }
    doInstall(f) {
      const i = process.env.APPIMAGE;
      if (i == null)
        throw (0, t.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
      (0, c.unlinkSync)(i);
      let g;
      const E = d.basename(i), y = this.installerPath;
      if (y == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      d.basename(y) === E || !/\d+\.\d+\.\d+/.test(E) ? g = i : g = d.join(d.dirname(i), d.basename(y)), (0, e.execFileSync)("mv", ["-f", y, g]), g !== i && this.emit("appimage-filename-updated", g);
      const p = {
        ...process.env,
        APPIMAGE_SILENT_INSTALL: "true"
      };
      return f.isForceRunAfter ? this.spawnLog(g, [], p) : (p.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, e.execFileSync)(g, [], { env: p })), !0;
    }
  };
  return lr.AppImageUpdater = u, lr;
}
var cr = {}, yl;
function vl() {
  if (yl) return cr;
  yl = 1, Object.defineProperty(cr, "__esModule", { value: !0 }), cr.DebUpdater = void 0;
  const t = Gt(), e = et(), a = Nt();
  let c = class extends t.BaseUpdater {
    constructor(l, n) {
      super(l, n);
    }
    /*** @private */
    doDownloadUpdate(l) {
      const n = l.updateInfoAndProvider.provider, h = (0, e.findFile)(n.resolveFiles(l.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
      return this.executeDownload({
        fileExtension: "deb",
        fileInfo: h,
        downloadUpdateOptions: l,
        task: async (o, u) => {
          this.listenerCount(a.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = (s) => this.emit(a.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(h.url, o, u);
        }
      });
    }
    get installerPath() {
      var l, n;
      return (n = (l = super.installerPath) === null || l === void 0 ? void 0 : l.replace(/ /g, "\\ ")) !== null && n !== void 0 ? n : null;
    }
    doInstall(l) {
      const n = this.wrapSudo(), h = /pkexec/i.test(n) ? "" : '"', o = this.installerPath;
      if (o == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const u = ["dpkg", "-i", o, "||", "apt-get", "install", "-f", "-y"];
      return this.spawnSyncLog(n, [`${h}/bin/bash`, "-c", `'${u.join(" ")}'${h}`]), l.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return cr.DebUpdater = c, cr;
}
var fr = {}, wl;
function _l() {
  if (wl) return fr;
  wl = 1, Object.defineProperty(fr, "__esModule", { value: !0 }), fr.PacmanUpdater = void 0;
  const t = Gt(), e = Nt(), a = et();
  let c = class extends t.BaseUpdater {
    constructor(l, n) {
      super(l, n);
    }
    /*** @private */
    doDownloadUpdate(l) {
      const n = l.updateInfoAndProvider.provider, h = (0, a.findFile)(n.resolveFiles(l.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
      return this.executeDownload({
        fileExtension: "pacman",
        fileInfo: h,
        downloadUpdateOptions: l,
        task: async (o, u) => {
          this.listenerCount(e.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = (s) => this.emit(e.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(h.url, o, u);
        }
      });
    }
    get installerPath() {
      var l, n;
      return (n = (l = super.installerPath) === null || l === void 0 ? void 0 : l.replace(/ /g, "\\ ")) !== null && n !== void 0 ? n : null;
    }
    doInstall(l) {
      const n = this.wrapSudo(), h = /pkexec/i.test(n) ? "" : '"', o = this.installerPath;
      if (o == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const u = ["pacman", "-U", "--noconfirm", o];
      return this.spawnSyncLog(n, [`${h}/bin/bash`, "-c", `'${u.join(" ")}'${h}`]), l.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return fr.PacmanUpdater = c, fr;
}
var dr = {}, Tl;
function Sl() {
  if (Tl) return dr;
  Tl = 1, Object.defineProperty(dr, "__esModule", { value: !0 }), dr.RpmUpdater = void 0;
  const t = Gt(), e = Nt(), a = et();
  let c = class extends t.BaseUpdater {
    constructor(l, n) {
      super(l, n);
    }
    /*** @private */
    doDownloadUpdate(l) {
      const n = l.updateInfoAndProvider.provider, h = (0, a.findFile)(n.resolveFiles(l.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "rpm",
        fileInfo: h,
        downloadUpdateOptions: l,
        task: async (o, u) => {
          this.listenerCount(e.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = (s) => this.emit(e.DOWNLOAD_PROGRESS, s)), await this.httpExecutor.download(h.url, o, u);
        }
      });
    }
    get installerPath() {
      var l, n;
      return (n = (l = super.installerPath) === null || l === void 0 ? void 0 : l.replace(/ /g, "\\ ")) !== null && n !== void 0 ? n : null;
    }
    doInstall(l) {
      const n = this.wrapSudo(), h = /pkexec/i.test(n) ? "" : '"', o = this.spawnSyncLog("which zypper"), u = this.installerPath;
      if (u == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      let s;
      return o ? s = [o, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", u] : s = [this.spawnSyncLog("which dnf || which yum"), "-y", "install", u], this.spawnSyncLog(n, [`${h}/bin/bash`, "-c", `'${s.join(" ")}'${h}`]), l.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return dr.RpmUpdater = c, dr;
}
var hr = {}, Rl;
function bl() {
  if (Rl) return hr;
  Rl = 1, Object.defineProperty(hr, "__esModule", { value: !0 }), hr.MacUpdater = void 0;
  const t = Be(), e = /* @__PURE__ */ Et(), a = xe, c = Se, d = uc, l = ga(), n = et(), h = Br, o = Er;
  let u = class extends l.AppUpdater {
    constructor(f, i) {
      super(f, i), this.nativeUpdater = Dt.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (g) => {
        this._logger.warn(g), this.emit("error", g);
      }), this.nativeUpdater.on("update-downloaded", () => {
        this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
      });
    }
    debug(f) {
      this._logger.debug != null && this._logger.debug(f);
    }
    closeServerIfExists() {
      this.server && (this.debug("Closing proxy server"), this.server.close((f) => {
        f && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
      }));
    }
    async doDownloadUpdate(f) {
      let i = f.updateInfoAndProvider.provider.resolveFiles(f.updateInfoAndProvider.info);
      const g = this._logger, E = "sysctl.proc_translated";
      let y = !1;
      try {
        this.debug("Checking for macOS Rosetta environment"), y = (0, h.execFileSync)("sysctl", [E], { encoding: "utf8" }).includes(`${E}: 1`), g.info(`Checked for macOS Rosetta environment (isRosetta=${y})`);
      } catch (q) {
        g.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${q}`);
      }
      let p = !1;
      try {
        this.debug("Checking for arm64 in uname");
        const A = (0, h.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
        g.info(`Checked 'uname -a': arm64=${A}`), p = p || A;
      } catch (q) {
        g.warn(`uname shell command to check for arm64 failed: ${q}`);
      }
      p = p || process.arch === "arm64" || y;
      const T = (q) => {
        var A;
        return q.url.pathname.includes("arm64") || ((A = q.info.url) === null || A === void 0 ? void 0 : A.includes("arm64"));
      };
      p && i.some(T) ? i = i.filter((q) => p === T(q)) : i = i.filter((q) => !T(q));
      const b = (0, n.findFile)(i, "zip", ["pkg", "dmg"]);
      if (b == null)
        throw (0, t.newError)(`ZIP file not provided: ${(0, t.safeStringifyJson)(i)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
      const O = f.updateInfoAndProvider.provider, D = "update.zip";
      return this.executeDownload({
        fileExtension: "zip",
        fileInfo: b,
        downloadUpdateOptions: f,
        task: async (q, A) => {
          const S = c.join(this.downloadedUpdateHelper.cacheDir, D), R = () => (0, e.pathExistsSync)(S) ? !f.disableDifferentialDownload : (g.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
          let v = !0;
          R() && (v = await this.differentialDownloadInstaller(b, f, q, O, D)), v && await this.httpExecutor.download(b.url, q, A);
        },
        done: async (q) => {
          if (!f.disableDifferentialDownload)
            try {
              const A = c.join(this.downloadedUpdateHelper.cacheDir, D);
              await (0, e.copyFile)(q.downloadedFile, A);
            } catch (A) {
              this._logger.warn(`Unable to copy file for caching for future differential downloads: ${A.message}`);
            }
          return this.updateDownloaded(b, q);
        }
      });
    }
    async updateDownloaded(f, i) {
      var g;
      const E = i.downloadedFile, y = (g = f.info.size) !== null && g !== void 0 ? g : (await (0, e.stat)(E)).size, p = this._logger, T = `fileToProxy=${f.url.href}`;
      this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${T})`), this.server = (0, d.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${T})`), this.server.on("close", () => {
        p.info(`Proxy server for native Squirrel.Mac is closed (${T})`);
      });
      const b = (O) => {
        const D = O.address();
        return typeof D == "string" ? D : `http://127.0.0.1:${D?.port}`;
      };
      return await new Promise((O, D) => {
        const q = (0, o.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), A = Buffer.from(`autoupdater:${q}`, "ascii"), S = `/${(0, o.randomBytes)(64).toString("hex")}.zip`;
        this.server.on("request", (R, v) => {
          const M = R.url;
          if (p.info(`${M} requested`), M === "/") {
            if (!R.headers.authorization || R.headers.authorization.indexOf("Basic ") === -1) {
              v.statusCode = 401, v.statusMessage = "Invalid Authentication Credentials", v.end(), p.warn("No authenthication info");
              return;
            }
            const k = R.headers.authorization.split(" ")[1], N = Buffer.from(k, "base64").toString("ascii"), [P, F] = N.split(":");
            if (P !== "autoupdater" || F !== q) {
              v.statusCode = 401, v.statusMessage = "Invalid Authentication Credentials", v.end(), p.warn("Invalid authenthication credentials");
              return;
            }
            const $ = Buffer.from(`{ "url": "${b(this.server)}${S}" }`);
            v.writeHead(200, { "Content-Type": "application/json", "Content-Length": $.length }), v.end($);
            return;
          }
          if (!M.startsWith(S)) {
            p.warn(`${M} requested, but not supported`), v.writeHead(404), v.end();
            return;
          }
          p.info(`${S} requested by Squirrel.Mac, pipe ${E}`);
          let U = !1;
          v.on("finish", () => {
            U || (this.nativeUpdater.removeListener("error", D), O([]));
          });
          const x = (0, a.createReadStream)(E);
          x.on("error", (k) => {
            try {
              v.end();
            } catch (N) {
              p.warn(`cannot end response: ${N}`);
            }
            U = !0, this.nativeUpdater.removeListener("error", D), D(new Error(`Cannot pipe "${E}": ${k}`));
          }), v.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Length": y
          }), x.pipe(v);
        }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${T})`), this.server.listen(0, "127.0.0.1", () => {
          this.debug(`Proxy server for native Squirrel.Mac is listening (address=${b(this.server)}, ${T})`), this.nativeUpdater.setFeedURL({
            url: b(this.server),
            headers: {
              "Cache-Control": "no-cache",
              Authorization: `Basic ${A.toString("base64")}`
            }
          }), this.dispatchUpdateDownloaded(i), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", D), this.nativeUpdater.checkForUpdates()) : O([]);
        });
      });
    }
    handleUpdateDownloaded() {
      this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
    }
    quitAndInstall() {
      this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
    }
  };
  return hr.MacUpdater = u, hr;
}
var pr = {}, Mr = {}, Al;
function Uf() {
  if (Al) return Mr;
  Al = 1, Object.defineProperty(Mr, "__esModule", { value: !0 }), Mr.verifySignature = d;
  const t = Be(), e = Br, a = jr, c = Se;
  function d(o, u, s) {
    return new Promise((f, i) => {
      const g = u.replace(/'/g, "''");
      s.info(`Verifying signature ${g}`), (0, e.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${g}' | ConvertTo-Json -Compress"`], {
        shell: !0,
        timeout: 20 * 1e3
      }, (E, y, p) => {
        var T;
        try {
          if (E != null || p) {
            n(s, E, p, i), f(null);
            return;
          }
          const b = l(y);
          if (b.Status === 0) {
            try {
              const A = c.normalize(b.Path), S = c.normalize(u);
              if (s.info(`LiteralPath: ${A}. Update Path: ${S}`), A !== S) {
                n(s, new Error(`LiteralPath of ${A} is different than ${S}`), p, i), f(null);
                return;
              }
            } catch (A) {
              s.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(T = A.message) !== null && T !== void 0 ? T : A.stack}`);
            }
            const D = (0, t.parseDn)(b.SignerCertificate.Subject);
            let q = !1;
            for (const A of o) {
              const S = (0, t.parseDn)(A);
              if (S.size ? q = Array.from(S.keys()).every((v) => S.get(v) === D.get(v)) : A === D.get("CN") && (s.warn(`Signature validated using only CN ${A}. Please add your full Distinguished Name (DN) to publisherNames configuration`), q = !0), q) {
                f(null);
                return;
              }
            }
          }
          const O = `publisherNames: ${o.join(" | ")}, raw info: ` + JSON.stringify(b, (D, q) => D === "RawData" ? void 0 : q, 2);
          s.warn(`Sign verification failed, installer signed with incorrect certificate: ${O}`), f(O);
        } catch (b) {
          n(s, b, null, i), f(null);
          return;
        }
      });
    });
  }
  function l(o) {
    const u = JSON.parse(o);
    delete u.PrivateKey, delete u.IsOSBinary, delete u.SignatureType;
    const s = u.SignerCertificate;
    return s != null && (delete s.Archived, delete s.Extensions, delete s.Handle, delete s.HasPrivateKey, delete s.SubjectName), u;
  }
  function n(o, u, s, f) {
    if (h()) {
      o.warn(`Cannot execute Get-AuthenticodeSignature: ${u || s}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    try {
      (0, e.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
    } catch (i) {
      o.warn(`Cannot execute ConvertTo-Json: ${i.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    u != null && f(u), s && f(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${s}. Failing signature validation due to unknown stderr.`));
  }
  function h() {
    const o = a.release();
    return o.startsWith("6.") && !o.startsWith("6.3");
  }
  return Mr;
}
var Cl;
function Ol() {
  if (Cl) return pr;
  Cl = 1, Object.defineProperty(pr, "__esModule", { value: !0 }), pr.NsisUpdater = void 0;
  const t = Be(), e = Se, a = Gt(), c = fu(), d = Nt(), l = et(), n = /* @__PURE__ */ Et(), h = Uf(), o = qt;
  let u = class extends a.BaseUpdater {
    constructor(f, i) {
      super(f, i), this._verifyUpdateCodeSignature = (g, E) => (0, h.verifySignature)(g, E, this._logger);
    }
    /**
     * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
     * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
     */
    get verifyUpdateCodeSignature() {
      return this._verifyUpdateCodeSignature;
    }
    set verifyUpdateCodeSignature(f) {
      f && (this._verifyUpdateCodeSignature = f);
    }
    /*** @private */
    doDownloadUpdate(f) {
      const i = f.updateInfoAndProvider.provider, g = (0, l.findFile)(i.resolveFiles(f.updateInfoAndProvider.info), "exe");
      return this.executeDownload({
        fileExtension: "exe",
        downloadUpdateOptions: f,
        fileInfo: g,
        task: async (E, y, p, T) => {
          const b = g.packageInfo, O = b != null && p != null;
          if (O && f.disableWebInstaller)
            throw (0, t.newError)(`Unable to download new version ${f.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
          !O && !f.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (O || f.disableDifferentialDownload || await this.differentialDownloadInstaller(g, f, E, i, t.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(g.url, E, y);
          const D = await this.verifySignature(E);
          if (D != null)
            throw await T(), (0, t.newError)(`New version ${f.updateInfoAndProvider.info.version} is not signed by the application owner: ${D}`, "ERR_UPDATER_INVALID_SIGNATURE");
          if (O && await this.differentialDownloadWebPackage(f, b, p, i))
            try {
              await this.httpExecutor.download(new o.URL(b.path), p, {
                headers: f.requestHeaders,
                cancellationToken: f.cancellationToken,
                sha512: b.sha512
              });
            } catch (q) {
              try {
                await (0, n.unlink)(p);
              } catch {
              }
              throw q;
            }
        }
      });
    }
    // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
    // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
    // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
    async verifySignature(f) {
      let i;
      try {
        if (i = (await this.configOnDisk.value).publisherName, i == null)
          return null;
      } catch (g) {
        if (g.code === "ENOENT")
          return null;
        throw g;
      }
      return await this._verifyUpdateCodeSignature(Array.isArray(i) ? i : [i], f);
    }
    doInstall(f) {
      const i = this.installerPath;
      if (i == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const g = ["--updated"];
      f.isSilent && g.push("/S"), f.isForceRunAfter && g.push("--force-run"), this.installDirectory && g.push(`/D=${this.installDirectory}`);
      const E = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
      E != null && g.push(`--package-file=${E}`);
      const y = () => {
        this.spawnLog(e.join(process.resourcesPath, "elevate.exe"), [i].concat(g)).catch((p) => this.dispatchError(p));
      };
      return f.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), y(), !0) : (this.spawnLog(i, g).catch((p) => {
        const T = p.code;
        this._logger.info(`Cannot run installer: error code: ${T}, error message: "${p.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), T === "UNKNOWN" || T === "EACCES" ? y() : T === "ENOENT" ? Dt.shell.openPath(i).catch((b) => this.dispatchError(b)) : this.dispatchError(p);
      }), !0);
    }
    async differentialDownloadWebPackage(f, i, g, E) {
      if (i.blockMapSize == null)
        return !0;
      try {
        const y = {
          newUrl: new o.URL(i.path),
          oldFile: e.join(this.downloadedUpdateHelper.cacheDir, t.CURRENT_APP_PACKAGE_FILE_NAME),
          logger: this._logger,
          newFile: g,
          requestHeaders: this.requestHeaders,
          isUseMultipleRangeRequest: E.isUseMultipleRangeRequest,
          cancellationToken: f.cancellationToken
        };
        this.listenerCount(d.DOWNLOAD_PROGRESS) > 0 && (y.onProgress = (p) => this.emit(d.DOWNLOAD_PROGRESS, p)), await new c.FileWithEmbeddedBlockMapDifferentialDownloader(i, this.httpExecutor, y).download();
      } catch (y) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${y.stack || y}`), process.platform === "win32";
      }
      return !1;
    }
  };
  return pr.NsisUpdater = u, pr;
}
var Dl;
function $f() {
  return Dl || (Dl = 1, function(t) {
    var e = Rt && Rt.__createBinding || (Object.create ? function(p, T, b, O) {
      O === void 0 && (O = b);
      var D = Object.getOwnPropertyDescriptor(T, b);
      (!D || ("get" in D ? !T.__esModule : D.writable || D.configurable)) && (D = { enumerable: !0, get: function() {
        return T[b];
      } }), Object.defineProperty(p, O, D);
    } : function(p, T, b, O) {
      O === void 0 && (O = b), p[O] = T[b];
    }), a = Rt && Rt.__exportStar || function(p, T) {
      for (var b in p) b !== "default" && !Object.prototype.hasOwnProperty.call(T, b) && e(T, p, b);
    };
    Object.defineProperty(t, "__esModule", { value: !0 }), t.NsisUpdater = t.MacUpdater = t.RpmUpdater = t.PacmanUpdater = t.DebUpdater = t.AppImageUpdater = t.Provider = t.NoOpLogger = t.AppUpdater = t.BaseUpdater = void 0;
    const c = /* @__PURE__ */ Et(), d = Se;
    var l = Gt();
    Object.defineProperty(t, "BaseUpdater", { enumerable: !0, get: function() {
      return l.BaseUpdater;
    } });
    var n = ga();
    Object.defineProperty(t, "AppUpdater", { enumerable: !0, get: function() {
      return n.AppUpdater;
    } }), Object.defineProperty(t, "NoOpLogger", { enumerable: !0, get: function() {
      return n.NoOpLogger;
    } });
    var h = et();
    Object.defineProperty(t, "Provider", { enumerable: !0, get: function() {
      return h.Provider;
    } });
    var o = El();
    Object.defineProperty(t, "AppImageUpdater", { enumerable: !0, get: function() {
      return o.AppImageUpdater;
    } });
    var u = vl();
    Object.defineProperty(t, "DebUpdater", { enumerable: !0, get: function() {
      return u.DebUpdater;
    } });
    var s = _l();
    Object.defineProperty(t, "PacmanUpdater", { enumerable: !0, get: function() {
      return s.PacmanUpdater;
    } });
    var f = Sl();
    Object.defineProperty(t, "RpmUpdater", { enumerable: !0, get: function() {
      return f.RpmUpdater;
    } });
    var i = bl();
    Object.defineProperty(t, "MacUpdater", { enumerable: !0, get: function() {
      return i.MacUpdater;
    } });
    var g = Ol();
    Object.defineProperty(t, "NsisUpdater", { enumerable: !0, get: function() {
      return g.NsisUpdater;
    } }), a(Nt(), t);
    let E;
    function y() {
      if (process.platform === "win32")
        E = new (Ol()).NsisUpdater();
      else if (process.platform === "darwin")
        E = new (bl()).MacUpdater();
      else {
        E = new (El()).AppImageUpdater();
        try {
          const p = d.join(process.resourcesPath, "package-type");
          if (!(0, c.existsSync)(p))
            return E;
          console.info("Checking for beta autoupdate feature for deb/rpm distributions");
          const T = (0, c.readFileSync)(p).toString().trim();
          switch (console.info("Found package-type:", T), T) {
            case "deb":
              E = new (vl()).DebUpdater();
              break;
            case "rpm":
              E = new (Sl()).RpmUpdater();
              break;
            case "pacman":
              E = new (_l()).PacmanUpdater();
              break;
            default:
              break;
          }
        } catch (p) {
          console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", p.message);
        }
      }
      return E;
    }
    Object.defineProperty(t, "autoUpdater", {
      enumerable: !0,
      get: () => E || y()
    });
  }(Rt)), Rt;
}
var nt = $f();
class kf {
  settings;
  dbManager;
  constructor(e) {
    this.dbManager = e, this.settings = this.loadSettings(), nt.autoUpdater.autoDownload = !1, nt.autoUpdater.autoInstallOnAppQuit = !1, this.setupEventHandlers(), this.settings.checkOnStartup && this.checkForUpdates();
  }
  loadSettings() {
    const e = this.dbManager.getSettingsGroup("updates");
    return {
      autoCheck: e.autoCheck === "true",
      checkOnStartup: e.checkOnStartup === "true"
    };
  }
  saveSettings(e) {
    try {
      return this.dbManager.updateSetting("updates", "autoCheck", String(e.autoCheck)), this.dbManager.updateSetting("updates", "checkOnStartup", String(e.checkOnStartup)), this.settings = e, !0;
    } catch (a) {
      return console.error("Error saving update settings:", a), !1;
    }
  }
  setupEventHandlers() {
    nt.autoUpdater.on("checking-for-update", () => {
      this.sendStatusToWindow("checking");
    }), nt.autoUpdater.on("update-available", (e) => {
      this.sendStatusToWindow("available", e), this.settings.autoCheck && this.downloadUpdate();
    }), nt.autoUpdater.on("update-not-available", (e) => {
      this.sendStatusToWindow("not-available", e);
    }), nt.autoUpdater.on("error", (e) => {
      this.sendStatusToWindow("error", e);
    }), nt.autoUpdater.on("download-progress", (e) => {
      this.sendStatusToWindow("downloading", e);
    }), nt.autoUpdater.on("update-downloaded", (e) => {
      this.sendStatusToWindow("downloaded", e), this.settings.autoCheck && this.installUpdate();
    });
  }
  sendStatusToWindow(e, a) {
    ea.getAllWindows().forEach((c) => {
      c.webContents.send("update-status", { status: e, data: a });
    });
  }
  async checkForUpdates() {
    try {
      await nt.autoUpdater.checkForUpdates();
    } catch (e) {
      this.sendStatusToWindow("error", e);
    }
  }
  async downloadUpdate() {
    try {
      await nt.autoUpdater.downloadUpdate();
    } catch (e) {
      this.sendStatusToWindow("error", e);
    }
  }
  async installUpdate() {
    try {
      nt.autoUpdater.quitAndInstall();
    } catch (e) {
      this.sendStatusToWindow("error", e);
    }
  }
}
const Mf = oc(import.meta.url), qr = Se.dirname(Mf);
let qe = null, Oe, Mt;
function Pl() {
  qf(), Bf();
  const t = Ze.isPackaged ? Se.join(qr, "../preload/preload.js") : Se.join(qr, "../../dist-electron/preload/preload.js");
  console.log("Using preload script at:", t);
  const e = Ze.isPackaged ? Se.join(process.resourcesPath, "Images/SVG/app-icon-main.png") : Se.join(qr, "../../Images/SVG/app-icon-main.png");
  if (console.log("Using app icon at:", e), qe = new ea({
    width: 1280,
    height: 768,
    webPreferences: {
      preload: t,
      contextIsolation: !0,
      nodeIntegration: !1
    },
    frame: !1,
    titleBarStyle: "hidden",
    icon: e
  }), !Ze.isPackaged && process.env.VITE_DEV_SERVER_URL)
    console.log("Loading from dev server URL:", process.env.VITE_DEV_SERVER_URL), qe.loadURL(process.env.VITE_DEV_SERVER_URL);
  else {
    const a = Se.join(qr, "../../dist/index.html");
    console.log("Loading index.html from:", a), qe.loadFile(a);
  }
  Re.handle("window-minimize", () => {
    qe?.minimize();
  }), Re.handle("window-maximize", () => (qe?.isMaximized() ? qe.unmaximize() : qe?.maximize(), qe?.isMaximized())), Re.handle("window-close", () => {
    qe?.close();
  }), qe.on("maximize", () => {
    qe?.webContents.send("window-maximize-change", !0);
  }), qe.on("unmaximize", () => {
    qe?.webContents.send("window-maximize-change", !1);
  }), qe.webContents.openDevTools(), jf();
}
function qf() {
  try {
    Oe = new cc(), Oe.fixDatabaseIntegrity(), console.log("Database initialized successfully");
  } catch (t) {
    console.error("Failed to initialize database:", t);
  }
}
function Bf() {
  try {
    Mt = new kf(Oe), console.log("Update manager initialized successfully");
  } catch (t) {
    console.error("Failed to initialize update manager:", t);
  }
}
Ze.whenReady().then(() => {
  Pl(), Ze.on("activate", () => {
    ea.getAllWindows().length === 0 && Pl();
  });
});
Ze.on("window-all-closed", () => {
  process.platform !== "darwin" && Ze.quit();
});
function jf() {
  Re.handle("check-auth-status", async () => {
    try {
      return !!Oe.getAuthCredentials();
    } catch (t) {
      return console.error("Error checking auth status:", t), !1;
    }
  }), Re.handle("setup-auth", async (t, e) => {
    try {
      const a = Zr.genSaltSync(10), c = Zr.hashSync(e, a);
      return Oe.saveAuthCredentials(c, a), { success: !0 };
    } catch (a) {
      return console.error("Error setting up auth:", a), { success: !1, error: "Failed to set up authentication" };
    }
  }), Re.handle("authenticate", async (t, e) => {
    try {
      const a = Oe.getAuthCredentials();
      return a ? Zr.compareSync(e, a.password_hash) : !1;
    } catch (a) {
      return console.error("Error authenticating:", a), !1;
    }
  }), Re.handle("updates:get-settings", () => {
    try {
      return Mt.loadSettings();
    } catch (t) {
      return console.error("Error getting update settings:", t), null;
    }
  }), Re.handle("updates:save-settings", (t, e) => {
    try {
      return Mt.saveSettings(e);
    } catch (a) {
      return console.error("Error saving update settings:", a), !1;
    }
  }), Re.handle("updates:check", () => {
    try {
      Mt.checkForUpdates();
    } catch (t) {
      console.error("Error checking for updates:", t);
    }
  }), Re.handle("updates:download", () => {
    try {
      Mt.downloadUpdate();
    } catch (t) {
      console.error("Error downloading update:", t);
    }
  }), Re.handle("updates:install", () => {
    try {
      Mt.installUpdate();
    } catch (t) {
      console.error("Error installing update:", t);
    }
  }), Re.handle("get-organizations", async () => {
    try {
      return { success: !0, organizations: Oe.getOrganizations() };
    } catch (t) {
      return console.error("Error getting organizations:", t), { success: !1, error: "Failed to get organizations" };
    }
  }), Re.handle("create-organization", async (t, e) => {
    try {
      const a = {
        ...e,
        id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      return { success: !0, organization: Oe.createOrganization(a) };
    } catch (a) {
      return console.error("Error creating organization:", a), { success: !1, error: "Failed to create organization" };
    }
  }), Re.handle("get-projects", async (t, e) => {
    try {
      return { success: !0, projects: Oe.getProjects(e) };
    } catch (a) {
      return console.error("Error getting projects:", a), { success: !1, error: "Failed to get projects" };
    }
  }), Re.handle("create-project", async (t, e) => {
    try {
      const a = {
        ...e,
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      return { success: !0, project: Oe.createProject(a) };
    } catch (a) {
      return console.error("Error creating project:", a), { success: !1, error: "Failed to create project" };
    }
  }), Re.handle("get-books", async (t, e) => {
    try {
      return { success: !0, books: Oe.getBooks(e) };
    } catch (a) {
      return console.error("Error getting books:", a), { success: !1, error: "Failed to get books" };
    }
  }), Re.handle("create-book", async (t, e) => {
    try {
      const a = {
        ...e,
        id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      return { success: !0, book: Oe.createBook(a) };
    } catch (a) {
      return console.error("Error creating book:", a), { success: !1, error: "Failed to create book" };
    }
  }), Re.handle("get-chapters", async (t, e) => {
    try {
      return { success: !0, chapters: Oe.getChapters(e) };
    } catch (a) {
      return console.error("Error getting chapters:", a), { success: !1, error: "Failed to get chapters" };
    }
  }), Re.handle("create-chapter", async (t, e) => {
    try {
      const a = {
        ...e,
        id: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      return { success: !0, chapter: Oe.createChapter(a) };
    } catch (a) {
      return console.error("Error creating chapter:", a), { success: !1, error: "Failed to create chapter" };
    }
  }), Re.handle("get-pages", async (t, e) => {
    try {
      return { success: !0, pages: Oe.getPages(e) };
    } catch (a) {
      return console.error("Error getting pages:", a), { success: !1, error: "Failed to get pages" };
    }
  }), Re.handle("get-page", async (t, e) => {
    try {
      return { success: !0, page: Oe.getPage(e) };
    } catch (a) {
      return console.error("Error getting page:", a), { success: !1, error: "Failed to get page" };
    }
  }), Re.handle("get-page-content", async (t, e) => {
    try {
      const a = Oe.getPage(e);
      return { success: !0, content: a?.content || "", page: a };
    } catch (a) {
      return console.error("Error getting page content:", a), { success: !1, error: "Failed to get page content" };
    }
  }), Re.handle("create-page", async (t, e) => {
    try {
      const a = {
        ...e,
        id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      return { success: !0, page: Oe.createPage(a) };
    } catch (a) {
      return console.error("Error creating page:", a), { success: !1, error: "Failed to create page" };
    }
  }), Re.handle("update-page-content", async (t, e, a, c) => {
    try {
      return Oe.updatePageContent(e, a, c || ""), { success: !0 };
    } catch (d) {
      return console.error("Error updating page content:", d), { success: !1, error: "Failed to update page content" };
    }
  }), Re.handle("log-error", (t, e) => (console.error("Client error:", e), !0)), Re.handle("open-file-dialog", async (t, e) => await Qr.showOpenDialog(qe, e)), Re.handle("save-file-dialog", async (t, e) => await Qr.showSaveDialog(qe, e)), Re.handle("open-external-url", async (t, e) => (await ac.openExternal(e), !0)), Re.handle("get-database-location", async () => {
    try {
      return {
        success: !0,
        path: Oe.getCurrentDbPath(),
        isCustom: Oe.isUsingCustomPath(),
        directory: Oe.getDbDirectory(),
        filename: Oe.getDbFilename()
      };
    } catch (t) {
      return console.error("Error getting database location:", t), { success: !1, error: "Failed to get database location" };
    }
  }), Re.handle("change-database-location", async (t, e) => {
    try {
      return Oe.changeDbLocation(e) ? {
        success: !0,
        path: Oe.getCurrentDbPath()
      } : { success: !1, error: "Failed to change database location" };
    } catch (a) {
      return console.error("Error changing database location:", a), { success: !1, error: `Failed to change database location: ${a}` };
    }
  }), Re.handle("reset-database-location", async () => {
    try {
      return Oe.resetToDefaultLocation() ? {
        success: !0,
        path: Oe.getCurrentDbPath()
      } : { success: !1, error: "Failed to reset database location" };
    } catch (t) {
      return console.error("Error resetting database location:", t), { success: !1, error: `Failed to reset database location: ${t}` };
    }
  }), Re.handle("select-directory", async () => {
    try {
      const t = await Qr.showOpenDialog(qe, {
        properties: ["openDirectory"],
        title: "Select Database Location"
      });
      return t.canceled || !t.filePaths || t.filePaths.length === 0 ? { success: !1, canceled: !0 } : { success: !0, path: t.filePaths[0] };
    } catch (t) {
      return console.error("Error selecting directory:", t), { success: !1, error: "Failed to select directory" };
    }
  }), Re.handle("read-svg-file", async (t, e) => {
    try {
      const a = require("fs"), c = require("path"), d = Ze.getAppPath(), l = c.resolve(d, e);
      if (!l.startsWith(d))
        throw new Error("Access denied: Attempted to access file outside app directory");
      if (!a.existsSync(l))
        return console.error(`SVG file not found: ${l}`), { success: !1, error: "SVG file not found" };
      const n = a.readFileSync(l, "utf8");
      return !n.includes("<svg") || !n.includes("</svg>") ? (console.error(`File is not a valid SVG: ${l}`), { success: !1, error: "Not a valid SVG file" }) : (console.log(`Successfully loaded SVG file: ${e}`), { success: !0, content: n });
    } catch (a) {
      return console.error("Error reading SVG file:", a), { success: !1, error: String(a) };
    }
  }), Re.handle("settings:get-group", (t, e) => {
    try {
      return Oe.getSettingsGroup(e);
    } catch (a) {
      return console.error("Error getting settings group:", a), {};
    }
  }), Re.handle("settings:update", (t, e, a, c) => {
    try {
      return Oe.updateSetting(e, a, c);
    } catch (d) {
      return console.error("Error updating setting:", d), !1;
    }
  });
}
