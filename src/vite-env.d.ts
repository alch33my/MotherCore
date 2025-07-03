/// <reference types="vite/client" />

interface ElectronAPI {
  // Window control
  minimizeWindow: () => Promise<boolean>
  maximizeWindow: () => Promise<boolean>
  closeWindow: () => Promise<boolean>
  
  // Authentication
  checkAuthStatus: () => Promise<boolean>
  setupAuth: (password: string) => Promise<{ success: boolean, error?: string}>
  authenticate: (password: string) => Promise<boolean>
  
  // Organizations
  createOrganization: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>
  getOrganizations: () => Promise<{ success: boolean, organizations?: any[], error?: string }>
  
  // Projects
  createProject: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>
  getProjects: (organizationId?: string) => Promise<{ success: boolean, projects?: any[], error?: string }>
  
  // Books
  createBook: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>
  getBooks: (projectId?: string) => Promise<{ success: boolean, books?: any[], error?: string }>
  
  // Chapters
  createChapter: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>
  getChapters: (bookId?: string) => Promise<{ success: boolean, chapters?: any[], error?: string }>
  
  // Pages
  createPage: (data: any) => Promise<{ success: boolean, id?: string, error?: string }>
  getPages: (chapterId?: string) => Promise<{ success: boolean, pages?: any[], error?: string }>
  getPage: (pageId: string) => Promise<{ success: boolean, page?: any, error?: string }>
  updatePageContent: (pageId: string, content: any, contentText: string) => Promise<{ success: boolean, error?: string }>
  
  // Updates
  getUpdateSettings: () => Promise<{ success: boolean, settings?: any, error?: string }>
  saveUpdateSettings: (settings: any) => Promise<{ success: boolean, error?: string }>
  checkForUpdates: (userRequested?: boolean) => Promise<{ success: boolean, updateInfo?: any, error?: string }>
  downloadUpdate: (updateInfo: any) => Promise<{ success: boolean, downloadPath?: string, error?: string }>
  installUpdate: (userApproved: boolean) => Promise<{ success: boolean, error?: string }>
  
  // File system operations
  openFileDialog: (options: any) => Promise<any>
  saveFileDialog: (options: any) => Promise<any>
  
  // External links
  openExternalUrl: (url: string) => Promise<boolean>
  
  // Utilities
  logError: (error: string) => void
}

interface Window {
  electronAPI?: ElectronAPI
}
