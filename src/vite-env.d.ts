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
  getPageContent: (pageId: string) => Promise<{ success: boolean, content?: any, error?: string }>
  updatePageContent: (pageId: string, content: any, plainText: string) => Promise<{ success: boolean, error?: string }>
  
  // File system operations
  selectDirectory: () => Promise<{ canceled: boolean, path?: string }>
  
  // Utilities
  logError: (error: string) => void
}

interface Window {
  electronAPI?: ElectronAPI
}
