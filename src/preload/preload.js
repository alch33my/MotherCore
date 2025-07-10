const { contextBridge, ipcRenderer } = require('electron')

// Debug logging to help track preload script loading
console.log('Preload script is running')

// Expose the electronAPI to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  onMaximizeChange: (callback) => {
    ipcRenderer.on('window-maximize-change', (_, isMaximized) => callback(isMaximized))
  },
  offMaximizeChange: (callback) => {
    ipcRenderer.removeListener('window-maximize-change', callback)
  },
  
  // Authentication
  checkAuthStatus: () => ipcRenderer.invoke('check-auth-status'),
  setupAuth: (password) => ipcRenderer.invoke('setup-auth', password),
  authenticate: (password) => ipcRenderer.invoke('authenticate', password),
  
  // Database location management
  getDatabaseLocation: () => ipcRenderer.invoke('get-database-location'),
  changeDatabaseLocation: (newPath) => ipcRenderer.invoke('change-database-location', newPath),
  resetDatabaseLocation: () => ipcRenderer.invoke('reset-database-location'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Organizations
  getOrganizations: () => ipcRenderer.invoke('get-organizations'),
  createOrganization: (data) => ipcRenderer.invoke('create-organization', data),
  
  // Projects
  getProjects: (orgId) => ipcRenderer.invoke('get-projects', orgId),
  createProject: (data) => ipcRenderer.invoke('create-project', data),
  
  // Books
  getBooks: (projectId) => ipcRenderer.invoke('get-books', projectId),
  createBook: (data) => ipcRenderer.invoke('create-book', data),
  
  // Chapters
  getChapters: (bookId) => ipcRenderer.invoke('get-chapters', bookId),
  createChapter: (data) => ipcRenderer.invoke('create-chapter', data),
  
  // Pages
  getPages: (chapterId) => ipcRenderer.invoke('get-pages', chapterId),
  getPage: (pageId) => ipcRenderer.invoke('get-page', pageId),
  getPageContent: (pageId) => ipcRenderer.invoke('get-page-content', pageId),
  createPage: (data) => ipcRenderer.invoke('create-page', data),
  updatePageContent: (pageId, content, contentText) => 
    ipcRenderer.invoke('update-page-content', pageId, content, contentText),
  
  // Updates
  getUpdateSettings: () => ipcRenderer.invoke('updates:get-settings'),
  saveUpdateSettings: (settings) => ipcRenderer.invoke('updates:save-settings', settings),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  
  // File system dialogs
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  
  // External links
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  
  // Error logging
  logError: (errorMessage) => ipcRenderer.invoke('log-error', errorMessage),
  
  // SVG icon loading
  readSVGFile: (filePath) => ipcRenderer.invoke('read-svg-file', filePath),
  
  // Settings
  getSettingsGroup: (category) => ipcRenderer.invoke('settings:get-group', category),
  updateSetting: (category, key, value) => ipcRenderer.invoke('settings:update', category, key, value)
})

console.log('Electron API exposed successfully') 