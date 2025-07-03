import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import bcryptjs from 'bcryptjs'
import DatabaseManager from './database'
import { SecureUpdateManager } from './update-manager'

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Store main window reference
let mainWindow: BrowserWindow | null = null
let dbManager: DatabaseManager
let updateManager: SecureUpdateManager

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
    updateManager = new SecureUpdateManager(dbManager)
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
  
  // IPC handlers for update system
  ipcMain.handle('get-update-settings', async () => {
    try {
      const settings = updateManager.getSettings()
      return { success: true, settings }
    } catch (err) {
      console.error('Error getting update settings:', err)
      return { success: false, error: 'Failed to get update settings' }
    }
  })
  
  ipcMain.handle('save-update-settings', async (_, settings) => {
    try {
      const result = updateManager.saveSettings(settings)
      return { success: result }
    } catch (err) {
      console.error('Error saving update settings:', err)
      return { success: false, error: 'Failed to save update settings' }
    }
  })
  
  ipcMain.handle('check-for-updates', async (_, userRequested) => {
    try {
      const updateInfo = await updateManager.checkForUpdates(userRequested)
      return { success: !!updateInfo, updateInfo }
    } catch (err) {
      console.error('Error checking for updates:', err)
      return { success: false, error: 'Failed to check for updates' }
    }
  })
  
  ipcMain.handle('download-update', async (_, updateInfo) => {
    try {
      const downloadPath = await updateManager.downloadUpdate(updateInfo)
      return { success: !!downloadPath, downloadPath }
    } catch (err) {
      console.error('Error downloading update:', err)
      return { success: false, error: 'Failed to download update' }
    }
  })
  
  ipcMain.handle('install-update', async (_, userApproved) => {
    try {
      const result = await updateManager.installUpdate(userApproved)
      return { success: result }
    } catch (err) {
      console.error('Error installing update:', err)
      return { success: false, error: 'Failed to install update' }
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
} 