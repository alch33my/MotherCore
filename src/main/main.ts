import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import bcryptjs from 'bcryptjs'
import DatabaseManager from './database'
import { UpdateManager } from './update-manager'

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Store main window reference
let mainWindow: BrowserWindow | null = null
let dbManager: DatabaseManager
let updateManager: UpdateManager

function createWindow() {
  // Initialize database before creating the window
  initializeDatabase()
  
  // Initialize update manager
  initializeUpdateManager()
  
  // Determine the preload script path based on environment
  const preloadPath = app.isPackaged 
    ? path.join(__dirname, '../preload/preload.js')
    : path.join(__dirname, '../../dist-electron/preload/preload.js')
  
  console.log('Using preload script at:', preloadPath)

  // Resolve icon path based on environment
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'Images/SVG/app-icon-main.png')
    : path.join(__dirname, '../../Images/SVG/app-icon-main.png')

  console.log('Using app icon at:', iconPath)
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 768,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false,
    titleBarStyle: 'hidden',
    icon: iconPath
  })

  // Load the app - use VITE_DEV_SERVER_URL in dev, file:// in production
  if (!app.isPackaged && process.env['VITE_DEV_SERVER_URL']) {
    console.log('Loading from dev server URL:', process.env['VITE_DEV_SERVER_URL'])
    mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL'])
  } else {
    // Load the index.html from the dist folder
    const indexPath = path.join(__dirname, '../../dist/index.html')
    console.log('Loading index.html from:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  // Set up IPC handlers for window controls
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
    return mainWindow?.isMaximized()
  })

  ipcMain.handle('window-close', () => {
    mainWindow?.close()
  })

  // Add event listeners for maximize and unmaximize events
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximize-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximize-change', false);
  });

  // Open dev tools to help with debugging
  mainWindow.webContents.openDevTools()

  setupIpcHandlers()
}

// Initialize the database connection
function initializeDatabase() {
  try {
    dbManager = new DatabaseManager()
    
    // Fix any database integrity issues
    dbManager.fixDatabaseIntegrity()
    
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Failed to initialize database:', err)
  }
}

// Initialize the update manager
function initializeUpdateManager() {
  try {
    updateManager = new UpdateManager(dbManager)
    console.log('Update manager initialized successfully')
  } catch (err) {
    console.error('Failed to initialize update manager:', err)
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Set up IPC handlers for database operations
function setupIpcHandlers() {
  // Authentication handlers
  ipcMain.handle('check-auth-status', async () => {
    try {
      const credentials = dbManager.getAuthCredentials()
      return !!credentials
    } catch (err) {
      console.error('Error checking auth status:', err)
      return false
    }
  })

  ipcMain.handle('setup-auth', async (_, password: string) => {
    try {
      const salt = bcryptjs.genSaltSync(10)
      const hash = bcryptjs.hashSync(password, salt)
      dbManager.saveAuthCredentials(hash, salt)
      return { success: true }
    } catch (err) {
      console.error('Error setting up auth:', err)
      return { success: false, error: 'Failed to set up authentication' }
    }
  })

  ipcMain.handle('authenticate', async (_, password: string) => {
    try {
      const credentials = dbManager.getAuthCredentials()
      if (!credentials) {
        return false
      }
      
      const isMatch = bcryptjs.compareSync(password, credentials.password_hash)
      return isMatch
    } catch (err) {
      console.error('Error authenticating:', err)
      return false
    }
  })
  
  // Update manager IPC handlers
  ipcMain.handle('updates:get-settings', () => {
    try {
      return updateManager.loadSettings()
    } catch (err) {
      console.error('Error getting update settings:', err)
      return null
    }
  })

  ipcMain.handle('updates:save-settings', (_, settings) => {
    try {
      return updateManager.saveSettings(settings)
    } catch (err) {
      console.error('Error saving update settings:', err)
      return false
    }
  })

  ipcMain.handle('updates:check', () => {
    try {
      updateManager.checkForUpdates()
    } catch (err) {
      console.error('Error checking for updates:', err)
    }
  })

  ipcMain.handle('updates:download', () => {
    try {
      updateManager.downloadUpdate()
    } catch (err) {
      console.error('Error downloading update:', err)
    }
  })

  ipcMain.handle('updates:install', () => {
    try {
      updateManager.installUpdate()
    } catch (err) {
      console.error('Error installing update:', err)
    }
  })

  // Organization operations
  ipcMain.handle('get-organizations', async () => {
    try {
      const organizations = dbManager.getOrganizations()
      return { success: true, organizations }
    } catch (err) {
      console.error('Error getting organizations:', err)
      return { success: false, error: 'Failed to get organizations' }
    }
  })

  ipcMain.handle('create-organization', async (_, data) => {
    try {
      // Generate a unique ID for the organization
      const orgData = {
        ...data,
        id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      const result = dbManager.createOrganization(orgData)
      return { success: true, organization: result }
    } catch (err) {
      console.error('Error creating organization:', err)
      return { success: false, error: 'Failed to create organization' }
    }
  })

  // Project operations
  ipcMain.handle('get-projects', async (_, organizationId) => {
    try {
      const projects = dbManager.getProjects(organizationId)
      return { success: true, projects }
    } catch (err) {
      console.error('Error getting projects:', err)
      return { success: false, error: 'Failed to get projects' }
    }
  })

  ipcMain.handle('create-project', async (_, data) => {
    try {
      // Generate a unique ID for the project
      const projectData = {
        ...data,
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      const result = dbManager.createProject(projectData)
      return { success: true, project: result }
    } catch (err) {
      console.error('Error creating project:', err)
      return { success: false, error: 'Failed to create project' }
    }
  })

  // Book operations
  ipcMain.handle('get-books', async (_, projectId) => {
    try {
      const books = dbManager.getBooks(projectId)
      return { success: true, books }
    } catch (err) {
      console.error('Error getting books:', err)
      return { success: false, error: 'Failed to get books' }
    }
  })

  ipcMain.handle('create-book', async (_, data) => {
    try {
      // Generate a unique ID for the book
      const bookData = {
        ...data,
        id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      const result = dbManager.createBook(bookData)
      return { success: true, book: result }
    } catch (err) {
      console.error('Error creating book:', err)
      return { success: false, error: 'Failed to create book' }
    }
  })

  // Chapter operations
  ipcMain.handle('get-chapters', async (_, bookId) => {
    try {
      const chapters = dbManager.getChapters(bookId)
      return { success: true, chapters }
    } catch (err) {
      console.error('Error getting chapters:', err)
      return { success: false, error: 'Failed to get chapters' }
    }
  })

  ipcMain.handle('create-chapter', async (_, data) => {
    try {
      // Generate a unique ID for the chapter
      const chapterData = {
        ...data,
        id: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      const result = dbManager.createChapter(chapterData)
      return { success: true, chapter: result }
    } catch (err) {
      console.error('Error creating chapter:', err)
      return { success: false, error: 'Failed to create chapter' }
    }
  })

  // Page operations
  ipcMain.handle('get-pages', async (_, chapterId) => {
    try {
      const pages = dbManager.getPages(chapterId)
      return { success: true, pages }
    } catch (err) {
      console.error('Error getting pages:', err)
      return { success: false, error: 'Failed to get pages' }
    }
  })

  ipcMain.handle('get-page', async (_, pageId) => {
    try {
      const page = dbManager.getPage(pageId)
      return { success: true, page }
    } catch (err) {
      console.error('Error getting page:', err)
      return { success: false, error: 'Failed to get page' }
    }
  })

  ipcMain.handle('get-page-content', async (_, pageId) => {
    try {
      const page = dbManager.getPage(pageId)
      return { success: true, content: page?.content || '', page }
    } catch (err) {
      console.error('Error getting page content:', err)
      return { success: false, error: 'Failed to get page content' }
    }
  })

  ipcMain.handle('create-page', async (_, data) => {
    try {
      // Generate a unique ID for the page
      const pageData = {
        ...data,
        id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      const result = dbManager.createPage(pageData)
      return { success: true, page: result }
    } catch (err) {
      console.error('Error creating page:', err)
      return { success: false, error: 'Failed to create page' }
    }
  })

  ipcMain.handle('update-page-content', async (_, pageId, content, contentText) => {
    try {
      dbManager.updatePageContent(pageId, content, contentText || '')
      return { success: true }
    } catch (err) {
      console.error('Error updating page content:', err)
      return { success: false, error: 'Failed to update page content' }
    }
  })

  // System operations
  ipcMain.handle('log-error', (_, errorMessage) => {
    console.error('Client error:', errorMessage)
    return true
  })

  // File system handlers for dialogs
  ipcMain.handle('open-file-dialog', async (_, options) => {
    const result = await dialog.showOpenDialog(mainWindow!, options)
    return result
  })

  ipcMain.handle('save-file-dialog', async (_, options) => {
    const result = await dialog.showSaveDialog(mainWindow!, options)
    return result
  })

  // External links
  ipcMain.handle('open-external-url', async (_, url) => {
    await shell.openExternal(url)
    return true
  })

  // Database location handlers
  ipcMain.handle('get-database-location', async () => {
    try {
      return { 
        success: true, 
        path: dbManager.getCurrentDbPath(),
        isCustom: dbManager.isUsingCustomPath(),
        directory: dbManager.getDbDirectory(),
        filename: dbManager.getDbFilename()
      }
    } catch (err) {
      console.error('Error getting database location:', err)
      return { success: false, error: 'Failed to get database location' }
    }
  })

  ipcMain.handle('change-database-location', async (_, newPath: string) => {
    try {
      const success = dbManager.changeDbLocation(newPath)
      if (success) {
        return { 
          success: true, 
          path: dbManager.getCurrentDbPath() 
        }
      } else {
        return { success: false, error: 'Failed to change database location' }
      }
    } catch (err) {
      console.error('Error changing database location:', err)
      return { success: false, error: `Failed to change database location: ${err}` }
    }
  })

  ipcMain.handle('reset-database-location', async () => {
    try {
      const success = dbManager.resetToDefaultLocation()
      if (success) {
        return { 
          success: true, 
          path: dbManager.getCurrentDbPath() 
        }
      } else {
        return { success: false, error: 'Failed to reset database location' }
      }
    } catch (err) {
      console.error('Error resetting database location:', err)
      return { success: false, error: `Failed to reset database location: ${err}` }
    }
  })

  // Directory selection handler
  ipcMain.handle('select-directory', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openDirectory'],
        title: 'Select Database Location'
      })
      
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }
      
      return { success: true, path: result.filePaths[0] }
    } catch (err) {
      console.error('Error selecting directory:', err)
      return { success: false, error: 'Failed to select directory' }
    }
  })

  // SVG icon file reader
  ipcMain.handle('read-svg-file', async (_, filePath: string) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Ensure filePath is safe by resolving it against the app root directory
      const appPath = app.getAppPath();
      const resolvedPath = path.resolve(appPath, filePath);
      
      // Verify the file is within the app's directory (security check)
      if (!resolvedPath.startsWith(appPath)) {
        throw new Error('Access denied: Attempted to access file outside app directory');
      }
      
      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        console.error(`SVG file not found: ${resolvedPath}`);
        return { success: false, error: 'SVG file not found' };
      }
      
      // Read the SVG file
      const content = fs.readFileSync(resolvedPath, 'utf8');
      
      // Verify this is actually an SVG file by checking for svg tag
      if (!content.includes('<svg') || !content.includes('</svg>')) {
        console.error(`File is not a valid SVG: ${resolvedPath}`);
        return { success: false, error: 'Not a valid SVG file' };
      }
      
      console.log(`Successfully loaded SVG file: ${filePath}`);
      return { success: true, content };
    } catch (err) {
      console.error('Error reading SVG file:', err);
      return { success: false, error: String(err) };
    }
  });

  // Settings IPC handlers
  ipcMain.handle('settings:get-group', (_, category) => {
    try {
      return dbManager.getSettingsGroup(category)
    } catch (err) {
      console.error('Error getting settings group:', err)
      return {}
    }
  })

  ipcMain.handle('settings:update', (_, category, key, value) => {
    try {
      return dbManager.updateSetting(category, key, value)
    } catch (err) {
      console.error('Error updating setting:', err)
      return false
    }
  })
} 