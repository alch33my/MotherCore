import { contextBridge, ipcRenderer } from 'electron'

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Example methods for database and file operations
  initializeDatabase: () => ipcRenderer.invoke('initialize-database'),
  createNote: (noteData: any) => ipcRenderer.invoke('create-note', noteData),
  getNotes: () => ipcRenderer.invoke('get-notes'),
  
  // Authentication methods
  authenticate: (password: string) => ipcRenderer.invoke('authenticate', password),
  
  // File system methods
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Logging and error handling
  logError: (error: string) => ipcRenderer.send('log-error', error)
}) 