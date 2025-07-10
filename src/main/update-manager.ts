import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import DatabaseManager from './database'

interface UpdateSettings {
  autoCheck: boolean
  checkOnStartup: boolean
}

export class UpdateManager {
  private settings: UpdateSettings
  private dbManager: DatabaseManager

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager
    this.settings = this.loadSettings()
    
    // Configure autoUpdater
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    
    this.setupEventHandlers()
    
    // Check for updates on startup if enabled
    if (this.settings.checkOnStartup) {
      this.checkForUpdates()
    }
  }

  public loadSettings(): UpdateSettings {
    const settingsGroup = this.dbManager.getSettingsGroup('updates')
    
    return {
      autoCheck: settingsGroup.autoCheck === 'true',
      checkOnStartup: settingsGroup.checkOnStartup === 'true'
    }
  }

  public saveSettings(settings: UpdateSettings): boolean {
    try {
      this.dbManager.updateSetting('updates', 'autoCheck', String(settings.autoCheck))
      this.dbManager.updateSetting('updates', 'checkOnStartup', String(settings.checkOnStartup))
      
      this.settings = settings
      return true
    } catch (error) {
      console.error('Error saving update settings:', error)
      return false
    }
  }

  private setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('checking')
    })

    autoUpdater.on('update-available', (info) => {
      this.sendStatusToWindow('available', info)
      
      // Auto download if enabled
      if (this.settings.autoCheck) {
        this.downloadUpdate()
      }
    })

    autoUpdater.on('update-not-available', (info) => {
      this.sendStatusToWindow('not-available', info)
    })

    autoUpdater.on('error', (err) => {
      this.sendStatusToWindow('error', err)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      this.sendStatusToWindow('downloading', progressObj)
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindow('downloaded', info)
      
      // Auto install if enabled
      if (this.settings.autoCheck) {
        this.installUpdate()
      }
    })
  }

  private sendStatusToWindow(status: string, data?: any) {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('update-status', { status, data })
    })
  }

  public async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      this.sendStatusToWindow('error', error)
    }
  }

  public async downloadUpdate() {
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      this.sendStatusToWindow('error', error)
    }
  }

  public async installUpdate() {
    try {
      autoUpdater.quitAndInstall()
    } catch (error) {
      this.sendStatusToWindow('error', error)
    }
  }
} 