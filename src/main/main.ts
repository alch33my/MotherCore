import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import DatabaseManager from './database'
import { v4 as uuidv4 } from 'uuid'
import bcryptjs from 'bcryptjs'

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database instance
let dbManager: DatabaseManager
// Store main window reference
let mainWindow: BrowserWindow | null = null

function createWindow() {
  // Determine the preload script path based on environment
  const preloadPath = app.isPackaged 
    ? path.join(__dirname, '..', 'preload', 'preload.js')
    : path.join(__dirname, '../../dist-electron/preload/preload.js')

  console.log('Preload script path:', preloadPath)
  console.log('Current directory:', __dirname)
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0a0a0a',
    title: 'MotherCore Digital Library',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false // Allow access to Node.js APIs in preload script
    },
    // Remove default frame for custom title bar
    frame: false
  })

  // Load the index.html from the Vite dev server or the built version
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  // Open dev tools to help with debugging
  mainWindow.webContents.openDevTools()
}

// Initialize database and set up IPC handlers
function initializeApplication() {
  try {
    // Create database instance
    console.log('Initializing database...')
    dbManager = DatabaseManager.getInstance()
    console.log('Database initialized successfully')
    
    // Window control handlers
    ipcMain.handle('minimizeWindow', () => {
      if (mainWindow) mainWindow.minimize()
      return true
    })
    
    ipcMain.handle('maximizeWindow', () => {
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
      }
      return true
    })
    
    ipcMain.handle('closeWindow', () => {
      if (mainWindow) mainWindow.close()
      return true
    })
    
    // Authentication handlers
    ipcMain.handle('check-auth-status', () => {
      const credentials = dbManager.getAuthCredentials()
      return !!credentials
    })
    
    ipcMain.handle('setup-auth', async (event, password) => {
      try {
        const salt = bcryptjs.genSaltSync(10)
        const passwordHash = bcryptjs.hashSync(password, salt)
        
        dbManager.saveAuthCredentials(passwordHash, salt)
        return { success: true }
      } catch (error) {
        console.error('Auth setup error:', error)
        return { success: false, error: (error as Error).message }
      }
    })
    
    ipcMain.handle('authenticate', async (event, password) => {
      try {
        const auth = dbManager.getAuthCredentials()
        if (!auth) return false

        return bcryptjs.compareSync(password, auth.password_hash)
      } catch (error) {
        console.error('Authentication error:', error)
        return false
      }
    })
    
    // Organization handlers
    ipcMain.handle('create-organization', async (_, data) => {
      try {
        const id = uuidv4()
        await dbManager.createOrganization({
          id,
          ...data
        })
        return { success: true, id }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    ipcMain.handle('get-organizations', async () => {
      try {
        const organizations = await dbManager.getOrganizations()
        return { success: true, organizations }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    // Project handlers
    ipcMain.handle('create-project', async (_, data) => {
      try {
        const id = uuidv4()
        await dbManager.createProject({
          id,
          ...data
        })
        return { success: true, id }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    ipcMain.handle('get-projects', async (_, orgId) => {
      try {
        const projects = await dbManager.getProjects(orgId)
        return { success: true, projects }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    // Book handlers
    ipcMain.handle('create-book', async (_, data) => {
      try {
        const id = uuidv4()
        await dbManager.createBook({
          id,
          ...data
        })
        return { success: true, id }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    ipcMain.handle('get-books', async (_, projectId) => {
      try {
        const books = await dbManager.getBooks(projectId)
        return { success: true, books }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    // Chapter handlers
    ipcMain.handle('create-chapter', async (_, data) => {
      try {
        const id = uuidv4()
        await dbManager.createChapter({
          id,
          ...data
        })
        return { success: true, id }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    ipcMain.handle('get-chapters', async (_, bookId) => {
      try {
        const chapters = await dbManager.getChapters(bookId)
        return { success: true, chapters }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    // Page handlers
    ipcMain.handle('create-page', async (_, data) => {
      try {
        const id = uuidv4()
        await dbManager.createPage({
          id,
          ...data
        })
        return { success: true, id }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    ipcMain.handle('get-pages', async (_, chapterId) => {
      try {
        const pages = await dbManager.getPages(chapterId)
        return { success: true, pages }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    ipcMain.handle('get-page-content', async (_, pageId) => {
      try {
        const content = await dbManager.getPageContent(pageId)
        return { success: true, content }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    ipcMain.handle('update-page-content', async (_, pageId, content, plainText) => {
      try {
        await dbManager.updatePageContent(pageId, content, plainText)
        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
    
    // File system handlers
    ipcMain.handle('select-directory', async () => {
      const result = await dialog.showOpenDialog({ 
        properties: ['openDirectory'] 
      })
      if (result.canceled) {
        return { canceled: true }
      }
      return { canceled: false, path: result.filePaths[0] }
    })
    
    // Error logging
    ipcMain.on('log-error', (_, error) => {
      console.error('Application Error:', error)
    })
  } catch (error) {
    console.error('Error initializing application:', error)
  }
}

app.whenReady().then(() => {
  initializeApplication()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  // Clean up resources
  if (dbManager) {
    dbManager.close()
  }
}) 