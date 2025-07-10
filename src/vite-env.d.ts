/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// Add declaration for node-fetch
declare module 'node-fetch' {
  export default function fetch(url: string | Request, init?: RequestInit): Promise<Response>;
}

// Declare SVG modules to be used as React components
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron API interface
interface Window {
  electronAPI?: {
    // Organization management
    getOrganizations: () => Promise<any>;
    createOrganization: (data: any) => Promise<any>;
    updateOrganization: (data: any) => Promise<any>;
    deleteOrganization: (id: string) => Promise<any>;
    
    // Project management
    getProjects: (orgId: string) => Promise<any>;
    createProject: (data: any) => Promise<any>;
    updateProject: (data: any) => Promise<any>;
    deleteProject: (id: string) => Promise<any>;
    
    // Book management
    getBooks: (projectId: string) => Promise<any>;
    createBook: (data: any) => Promise<any>;
    updateBook: (data: any) => Promise<any>;
    deleteBook: (id: string) => Promise<any>;
    
    // Chapter management
    getChapters: (bookId: string) => Promise<any>;
    createChapter: (data: any) => Promise<any>;
    updateChapter: (data: any) => Promise<any>;
    deleteChapter: (id: string) => Promise<any>;
    
    // Page management
    getPages: (chapterId: string) => Promise<any>;
    createPage: (data: any) => Promise<any>;
    getPage: (pageId: string) => Promise<any>;
    getPageContent: (pageId: string) => Promise<any>;
    updatePage: (data: any) => Promise<any>;
    updatePageContent: (pageId: string, content: string, plainText: string) => Promise<any>;
    deletePage: (id: string) => Promise<any>;
    
    // Database location management
    getDatabaseLocation: () => Promise<any>;
    setDatabaseLocation: (path: string) => Promise<any>;
    resetDatabaseLocation: () => Promise<any>;
    changeDatabaseLocation: (path: string) => Promise<any>;
    selectDirectory: () => Promise<any>;
    
    // Update management
    checkForUpdates: () => Promise<any>;
    setAutoUpdate: (enabled: boolean) => Promise<any>;
    getAutoUpdateSetting: () => Promise<any>;
    getUpdateSettings: () => Promise<any>;
    saveUpdateSettings: (settings: any) => Promise<any>;
    downloadUpdate: (updateInfo: any) => Promise<any>;
    installUpdate: (userApproved: boolean) => Promise<any>;
    
    // File dialogs
    openFileDialog: (options: any) => Promise<any>;
    saveFileDialog: (options: any) => Promise<any>;
    
    // Window management
    minimizeWindow: () => void;
    maximizeWindow: () => Promise<boolean>;
    closeWindow: () => void;
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
    offMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
    
    // Authentication
    checkAuthStatus: () => Promise<boolean>;
    setupAuth: (password: string, dbPath?: string) => Promise<any>;
    authenticate: (password: string) => Promise<boolean>;
    
    // External links
    openExternalUrl: (url: string) => Promise<boolean>;
    
    // Logging
    logError: (message: string) => void;
    
    // Settings
    getSettingsGroup: (category: string) => Promise<Record<string, string>>
    updateSetting: (category: string, key: string, value: string) => Promise<boolean>
  }
}

declare module 'vite-plugin-svgr' {
  import { Plugin } from 'vite';
  export default function svgr(options?: any): Plugin;
}
