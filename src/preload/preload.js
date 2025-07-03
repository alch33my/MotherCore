const { contextBridge, ipcRenderer } = require('electron')

// Debug logging to help track preload script loading
console.log('Preload script is running')

// Expose the electronAPI to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  
  // Authentication
  checkAuthStatus: () => ipcRenderer.invoke('check-auth-status'),
  setupAuth: (password) => ipcRenderer.invoke('setup-auth', password),
  authenticate: (password) => ipcRenderer.invoke('authenticate', password),
  
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
  getPage: (pageId) => ipcRenderer.invoke('get-page-content', pageId),
  createPage: (data) => ipcRenderer.invoke('create-page', data),
  updatePageContent: (pageId, content, contentText) => 
    ipcRenderer.invoke('update-page-content', pageId, content, contentText),
  
  // Updates
  getUpdateSettings: () => ipcRenderer.invoke('get-update-settings'),
  saveUpdateSettings: (settings) => ipcRenderer.invoke('save-update-settings', settings),
  checkForUpdates: (userRequested = true) => ipcRenderer.invoke('check-for-updates', userRequested),
  downloadUpdate: (updateInfo) => ipcRenderer.invoke('download-update', updateInfo),
  installUpdate: (userApproved) => ipcRenderer.invoke('install-update', userApproved),
  
  // File system dialogs
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  
  // External links
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  
  // Error logging
  logError: (errorMessage) => ipcRenderer.invoke('log-error', errorMessage)
})

console.log('Electron API exposed successfully') 