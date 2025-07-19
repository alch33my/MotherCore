const { contextBridge: n, ipcRenderer: t } = require("electron");
console.log("Preload script is running");
n.exposeInMainWorld("electronAPI", {
  // Window controls
  minimizeWindow: () => t.invoke("window-minimize"),
  maximizeWindow: () => t.invoke("window-maximize"),
  closeWindow: () => t.invoke("window-close"),
  onMaximizeChange: (e) => {
    t.on("window-maximize-change", (a, o) => e(o));
  },
  offMaximizeChange: (e) => {
    t.removeListener("window-maximize-change", e);
  },
  // Authentication
  checkAuthStatus: () => t.invoke("check-auth-status"),
  setupAuth: (e) => t.invoke("setup-auth", e),
  authenticate: (e) => t.invoke("authenticate", e),
  // Database location management
  getDatabaseLocation: () => t.invoke("get-database-location"),
  changeDatabaseLocation: (e) => t.invoke("change-database-location", e),
  resetDatabaseLocation: () => t.invoke("reset-database-location"),
  selectDirectory: () => t.invoke("select-directory"),
  // Organizations
  getOrganizations: () => t.invoke("get-organizations"),
  createOrganization: (e) => t.invoke("create-organization", e),
  // Projects
  getProjects: (e) => t.invoke("get-projects", e),
  createProject: (e) => t.invoke("create-project", e),
  // Books
  getBooks: (e) => t.invoke("get-books", e),
  createBook: (e) => t.invoke("create-book", e),
  // Chapters
  getChapters: (e) => t.invoke("get-chapters", e),
  createChapter: (e) => t.invoke("create-chapter", e),
  // Pages
  getPages: (e) => t.invoke("get-pages", e),
  getPage: (e) => t.invoke("get-page", e),
  getPageContent: (e) => t.invoke("get-page-content", e),
  createPage: (e) => t.invoke("create-page", e),
  updatePageContent: (e, a, o) => t.invoke("update-page-content", e, a, o),
  // Updates
  getUpdateSettings: () => t.invoke("updates:get-settings"),
  saveUpdateSettings: (e) => t.invoke("updates:save-settings", e),
  checkForUpdates: () => t.invoke("updates:check"),
  downloadUpdate: () => t.invoke("updates:download"),
  installUpdate: () => t.invoke("updates:install"),
  // File system dialogs
  openFileDialog: (e) => t.invoke("open-file-dialog", e),
  saveFileDialog: (e) => t.invoke("save-file-dialog", e),
  // External links
  openExternalUrl: (e) => t.invoke("open-external-url", e),
  // Error logging
  logError: (e) => t.invoke("log-error", e),
  // SVG icon loading
  readSVGFile: (e) => t.invoke("read-svg-file", e),
  // Settings
  getSettingsGroup: (e) => t.invoke("settings:get-group", e),
  updateSetting: (e, a, o) => t.invoke("settings:update", e, a, o)
});
console.log("Electron API exposed successfully");
