import { contextBridge as i, ipcRenderer as e } from "electron";
i.exposeInMainWorld("electronAPI", {
  // Example methods for database and file operations
  initializeDatabase: () => e.invoke("initialize-database"),
  createNote: (t) => e.invoke("create-note", t),
  getNotes: () => e.invoke("get-notes"),
  // Authentication methods
  authenticate: (t) => e.invoke("authenticate", t),
  // File system methods
  selectDirectory: () => e.invoke("select-directory"),
  // Logging and error handling
  logError: (t) => e.send("log-error", t)
});
