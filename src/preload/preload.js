const { contextBridge, ipcRenderer } = require('electron')

// Debug logging to help track preload script loading
console.log('Preload script is running')

// Define the electronAPI object
const electronAPI = {
  // Window control methods
  minimizeWindow: () => ipcRenderer.invoke('minimizeWindow'),
  maximizeWindow: () => ipcRenderer.invoke('maximizeWindow'),
  closeWindow: () => ipcRenderer.invoke('closeWindow'),
  
  // Authentication methods
  checkAuthStatus: () => ipcRenderer.invoke('check-auth-status'),
  setupAuth: (password) => ipcRenderer.invoke('setup-auth', password),
  authenticate: (password) => ipcRenderer.invoke('authenticate', password),
  
  // Organization methods
  createOrganization: (data) => ipcRenderer.invoke('create-organization', data),
  getOrganizations: () => ipcRenderer.invoke('get-organizations'),
  
  // Project methods
  createProject: (data) => ipcRenderer.invoke('create-project', data),
  getProjects: (organizationId) => ipcRenderer.invoke('get-projects', organizationId),
  
  // Book methods
  createBook: (data) => ipcRenderer.invoke('create-book', data),
  getBooks: (projectId) => ipcRenderer.invoke('get-books', projectId),
  
  // Chapter methods
  createChapter: (data) => ipcRenderer.invoke('create-chapter', data),
  getChapters: (bookId) => ipcRenderer.invoke('get-chapters', bookId),
  
  // Page methods
  createPage: (data) => ipcRenderer.invoke('create-page', data),
  getPages: (chapterId) => ipcRenderer.invoke('get-pages', chapterId),
  getPageContent: (pageId) => ipcRenderer.invoke('get-page-content', pageId),
  updatePageContent: (pageId, content, plainText) => 
    ipcRenderer.invoke('update-page-content', pageId, content, plainText),
  
  // File system methods
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Logging and error handling
  logError: (error) => ipcRenderer.send('log-error', error),
  
  // Utility to check if the API is available
  isElectronAPIAvailable: () => true
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)
console.log('Electron API exposed successfully') 