/// <reference types="vite/client" />

interface ElectronAPI {
  initializeDatabase: () => Promise<boolean>
  createNote: (noteData: any) => Promise<any>
  getNotes: () => Promise<any[]>
  authenticate: (password: string) => Promise<boolean>
  selectDirectory: () => Promise<string>
  logError: (error: string) => void
}

interface Window {
  electronAPI: ElectronAPI
}
