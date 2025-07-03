import { app, dialog } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import fetch from 'node-fetch'
import DatabaseManager from './database'

// Types
export interface UpdateSettings {
  autoCheck: boolean
  checkOnStartup: boolean
  requireApproval: boolean  // Always true
  backupBeforeUpdate: boolean  // Always true
  updateSource: 'manual' | 'local-network' | 'secure-https'
  trustedDomains: string[]
}

export interface UpdateInfo {
  version: string
  releaseDate: string
  url: string
  changelog: string
  requiredVersion: string
  signature: string
  checksum: string
}

export interface UpdateVerification {
  signature: string
  checksum: string
  version: string
  releaseDate: string
  changelog: string
  requiredVersion: string
}

export class SecureUpdateManager {
  private settings: UpdateSettings
  private dbManager: DatabaseManager
  private appVersion: string
  private tempDir: string
  private backupDir: string
  private updateDir: string

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager
    this.appVersion = app.getVersion()
    
    // Set up directories
    const userDataPath = app.getPath('userData')
    this.tempDir = path.join(userDataPath, 'updates', 'temp')
    this.backupDir = path.join(userDataPath, 'updates', 'backups')
    this.updateDir = path.join(userDataPath, 'updates', 'packages')
    
    // Create directories if they don't exist
    this.ensureDirectoriesExist()
    
    // Load settings
    this.settings = this.loadSettings()
  }

  private async ensureDirectoriesExist() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
      await fs.mkdir(this.backupDir, { recursive: true })
      await fs.mkdir(this.updateDir, { recursive: true })
    } catch (error) {
      console.error('Error creating update directories:', error)
    }
  }

  private loadSettings(): UpdateSettings {
    const settingsGroup = this.dbManager.getSettingsGroup('updates')
    
    const settings: UpdateSettings = {
      autoCheck: settingsGroup.autoCheck === 'true',
      checkOnStartup: settingsGroup.checkOnStartup === 'true',
      requireApproval: true, // Always true for security
      backupBeforeUpdate: true, // Always true for safety
      updateSource: (settingsGroup.updateSource || 'manual') as 'manual' | 'local-network' | 'secure-https',
      trustedDomains: JSON.parse(settingsGroup.trustedDomains || '[]')
    }
    
    return settings
  }

  public saveSettings(settings: UpdateSettings): boolean {
    // Never allow changing these critical security settings
    settings.requireApproval = true
    settings.backupBeforeUpdate = true
    
    try {
      this.dbManager.updateSetting('updates', 'autoCheck', String(settings.autoCheck))
      this.dbManager.updateSetting('updates', 'checkOnStartup', String(settings.checkOnStartup))
      this.dbManager.updateSetting('updates', 'requireApproval', String(settings.requireApproval))
      this.dbManager.updateSetting('updates', 'backupBeforeUpdate', String(settings.backupBeforeUpdate))
      this.dbManager.updateSetting('updates', 'updateSource', settings.updateSource)
      this.dbManager.updateSetting('updates', 'trustedDomains', JSON.stringify(settings.trustedDomains))
      
      this.settings = settings
      return true
    } catch (error) {
      console.error('Error saving update settings:', error)
      return false
    }
  }

  public getSettings(): UpdateSettings {
    return { ...this.settings }
  }

  /**
   * Check for updates only when user requests, unless checkOnStartup is enabled
   */
  public async checkForUpdates(userRequested: boolean = false): Promise<UpdateInfo | null> {
    // Don't check for updates unless explicitly requested or startup check is enabled
    if (!userRequested && !this.settings.checkOnStartup) {
      return null
    }
    
    try {
      let updateInfo: UpdateInfo | null = null
      
      switch (this.settings.updateSource) {
        case 'manual':
          // Let the user select an update file
          const result = await dialog.showOpenDialog({
            title: 'Select Update Package',
            filters: [{ name: 'MotherCore Update', extensions: ['mcupdate'] }],
            properties: ['openFile']
          })
          
          if (!result.canceled && result.filePaths.length > 0) {
            const updatePath = result.filePaths[0]
            updateInfo = await this.verifyLocalUpdate(updatePath)
          }
          break
          
        case 'local-network':
          // Implement local network update check logic
          // This would involve searching on the local network for updates
          break
          
        case 'secure-https':
          // Only check trusted domains
          if (this.settings.trustedDomains.length > 0) {
            // In a real implementation, iterate through trusted domains
            const domain = this.settings.trustedDomains[0]
            updateInfo = await this.checkRemoteUpdate(domain)
          }
          break
      }
      
      return updateInfo
    } catch (error) {
      console.error('Error checking for updates:', error)
      return null
    }
  }

  /**
   * Download update but don't install
   */
  public async downloadUpdate(updateInfo: UpdateInfo): Promise<string | null> {
    try {
      const updateFileName = `update-${updateInfo.version}.mcupdate`
      const downloadPath = path.join(this.tempDir, updateFileName)
      
      // If it's a remote update, download it
      if (updateInfo.url.startsWith('http')) {
        const response = await fetch(updateInfo.url)
        if (!response.ok) {
          throw new Error(`Failed to download update: ${response.status} ${response.statusText}`)
        }
        
        const fileStream = await fs.open(downloadPath, 'w')
        const buffer = await response.buffer()
        await fileStream.write(buffer)
        await fileStream.close()
      } else {
        // It's a local file, copy it
        await fs.copyFile(updateInfo.url, downloadPath)
      }
      
      // Verify the downloaded package
      const isValid = await this.verifyUpdatePackage(downloadPath, updateInfo)
      if (!isValid) {
        await fs.unlink(downloadPath)
        throw new Error('Update package verification failed')
      }
      
      return downloadPath
    } catch (error) {
      console.error('Error downloading update:', error)
      return null
    }
  }

  /**
   * Install only with explicit user approval
   */
  public async installUpdate(updatePath: string, userApproved: boolean): Promise<boolean> {
    if (!userApproved || !this.settings.requireApproval) {
      console.error('Update installation rejected: User approval required')
      return false
    }
    
    try {
      // Create backup first
      if (this.settings.backupBeforeUpdate) {
        const backupPath = await this.createBackup()
        if (!backupPath) {
          throw new Error('Failed to create backup before update')
        }
      }
      
      // In a real implementation, this would:
      // 1. Extract the update package
      // 2. Replace application files
      // 3. Update the version information
      
      return true
    } catch (error) {
      console.error('Error installing update:', error)
      return false
    }
  }

  /**
   * Backup current version before update
   */
  public async createBackup(): Promise<string | null> {
    try {
      const backupFileName = `backup-${this.appVersion}-${Date.now()}.mcbackup`
      const backupPath = path.join(this.backupDir, backupFileName)
      
      // In a real implementation, this would:
      // 1. Create a compressed archive of the current application
      // 2. Save it to backupPath
      
      return backupPath
    } catch (error) {
      console.error('Error creating backup:', error)
      return null
    }
  }

  /**
   * Rollback if update fails
   */
  public async rollbackUpdate(backupPath: string): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Extract the backup archive
      // 2. Replace current application files with backup files
      // 3. Restore the previous version information
      
      return true
    } catch (error) {
      console.error('Error rolling back update:', error)
      return false
    }
  }

  /**
   * Verify a local update file
   */
  private async verifyLocalUpdate(filePath: string): Promise<UpdateInfo | null> {
    try {
      // In a real implementation, this would:
      // 1. Extract the metadata from the update package
      // 2. Verify its structure and compatibility
      
      // Mock implementation for demonstration
      const filename = path.basename(filePath)
      const match = filename.match(/update-(\d+\.\d+\.\d+)/)
      
      if (!match) {
        return null
      }
      
      const version = match[1]
      
      // Create dummy update info
      const updateInfo: UpdateInfo = {
        version,
        releaseDate: new Date().toISOString(),
        url: filePath,
        changelog: 'This is a local update package',
        requiredVersion: '0.0.1',
        signature: 'dummy-signature',
        checksum: 'dummy-checksum'
      }
      
      return updateInfo
    } catch (error) {
      console.error('Error verifying local update:', error)
      return null
    }
  }

  /**
   * Check for updates from a trusted remote source
   */
  private async checkRemoteUpdate(domain: string): Promise<UpdateInfo | null> {
    try {
      const updateUrl = `https://${domain}/updates/latest.json`
      
      const response = await fetch(updateUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch update info: ${response.status} ${response.statusText}`)
      }
      
      const updateInfo = await response.json() as UpdateInfo
      
      // Check if this is a newer version
      if (!this.isNewerVersion(updateInfo.version)) {
        return null
      }
      
      // Check if our current version meets the minimum required version
      if (!this.meetsMinimumVersion(updateInfo.requiredVersion)) {
        throw new Error(`Current version ${this.appVersion} doesn't meet the minimum required version ${updateInfo.requiredVersion}`)
      }
      
      return updateInfo
    } catch (error) {
      console.error('Error checking for remote update:', error)
      return null
    }
  }

  /**
   * Verify the integrity and authenticity of an update package
   */
  private async verifyUpdatePackage(packagePath: string, updateInfo: UpdateInfo): Promise<boolean> {
    try {
      // Calculate checksum
      const fileData = await fs.readFile(packagePath)
      const calculatedChecksum = crypto
        .createHash('sha256')
        .update(fileData)
        .digest('hex')
      
      // Check if checksums match
      if (calculatedChecksum !== updateInfo.checksum) {
        console.error('Update package checksum verification failed')
        return false
      }
      
      // In a real implementation, we would also verify the digital signature:
      // 1. Get the public key for verification
      // 2. Verify the signature against the file data
      
      return true
    } catch (error) {
      console.error('Error verifying update package:', error)
      return false
    }
  }

  /**
   * Check if the given version is newer than the current app version
   */
  private isNewerVersion(version: string): boolean {
    const current = this.appVersion.split('.').map(Number)
    const target = version.split('.').map(Number)
    
    for (let i = 0; i < 3; i++) {
      if (target[i] > current[i]) {
        return true
      } else if (target[i] < current[i]) {
        return false
      }
    }
    
    return false
  }

  /**
   * Check if the current app version meets the minimum required version
   */
  private meetsMinimumVersion(requiredVersion: string): boolean {
    const current = this.appVersion.split('.').map(Number)
    const required = requiredVersion.split('.').map(Number)
    
    for (let i = 0; i < 3; i++) {
      if (current[i] < required[i]) {
        return false
      } else if (current[i] > required[i]) {
        return true
      }
    }
    
    return true
  }
}

export default SecureUpdateManager 