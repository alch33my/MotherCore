import { useState, useEffect } from 'react'
import { AlertTriangle, Shield, RefreshCw, Download, CheckCircle } from 'lucide-react'

interface UpdateSetting {
  autoCheck: boolean
  checkOnStartup: boolean
  updateSource: 'manual' | 'local-network' | 'secure-https'
  trustedDomains: string[]
}

interface UpdateSettingsProps {
  onClose: () => void
}

function UpdateSettings({ onClose }: UpdateSettingsProps) {
  const [settings, setSettings] = useState<UpdateSetting>({
    autoCheck: false,
    checkOnStartup: false,
    updateSource: 'manual',
    trustedDomains: []
  })
  
  const [newDomain, setNewDomain] = useState('')
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState<any | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  
  useEffect(() => {
    // Load update settings when component mounts
    if (window.electronAPI) {
      window.electronAPI.getUpdateSettings().then((result: any) => {
        if (result.success) {
          setSettings(result.settings)
        } else {
          setStatusMessage('Failed to load update settings')
        }
        setLoading(false)
      })
    }
  }, [])
  
  const handleSaveSettings = async () => {
    if (window.electronAPI) {
      setLoading(true)
      const result = await window.electronAPI.saveUpdateSettings(settings)
      setLoading(false)
      
      if (result.success) {
        setStatusMessage('Settings saved successfully')
      } else {
        setStatusMessage('Failed to save settings')
      }
    }
  }
  
  const handleAddTrustedDomain = () => {
    if (!newDomain || settings.trustedDomains.includes(newDomain)) {
      return
    }
    
    setSettings(prev => ({
      ...prev,
      trustedDomains: [...prev.trustedDomains, newDomain]
    }))
    
    setNewDomain('')
  }
  
  const handleRemoveTrustedDomain = (domain: string) => {
    setSettings(prev => ({
      ...prev,
      trustedDomains: prev.trustedDomains.filter(d => d !== domain)
    }))
  }
  
  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) return
    
    setChecking(true)
    setStatusMessage('Checking for updates...')
    
    const result = await window.electronAPI.checkForUpdates(true)
    setChecking(false)
    
    if (result.success && result.updateInfo) {
      setUpdateAvailable(result.updateInfo)
      setStatusMessage(`Update found: v${result.updateInfo.version}`)
    } else {
      setUpdateAvailable(null)
      setStatusMessage(result.error || 'No updates available')
    }
  }
  
  const handleDownloadUpdate = async () => {
    if (!window.electronAPI || !updateAvailable) return
    
    setDownloadProgress(0)
    setStatusMessage('Downloading update...')
    
    // In a real implementation, we would subscribe to download progress events
    const downloadResult = await window.electronAPI.downloadUpdate(updateAvailable)
    
    if (downloadResult.success) {
      setDownloadProgress(100)
      setStatusMessage('Download complete. Update ready to install.')
    } else {
      setDownloadProgress(null)
      setStatusMessage(downloadResult.error || 'Download failed')
    }
  }
  
  const handleInstallUpdate = async () => {
    if (!window.electronAPI || !updateAvailable) return
    
    setStatusMessage('Preparing to install update...')
    
    const result = await window.electronAPI.installUpdate(true)
    
    if (result.success) {
      setStatusMessage('Update installed successfully. Restart to apply changes.')
    } else {
      setStatusMessage(result.error || 'Installation failed')
    }
  }
  
  if (loading) {
    return (
      <div className="p-6 bg-matrix-dark bg-opacity-95 rounded-lg border border-matrix-gold text-white">
        <h2 className="text-lg font-bold text-matrix-gold mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          Loading Update Settings
        </h2>
      </div>
    )
  }
  
  return (
    <div className="p-6 bg-matrix-dark bg-opacity-95 rounded-lg border border-matrix-gold text-white">
      <h2 className="text-lg font-bold text-matrix-gold mb-4 flex items-center">
        <Download className="w-5 h-5 mr-2" />
        Update Settings
      </h2>
      
      <div className="mb-6">
        <div className="bg-matrix-black bg-opacity-50 p-4 rounded-md border border-matrix-gold border-opacity-30 mb-4">
          <div className="flex items-start mb-2">
            <Shield className="w-5 h-5 mr-2 text-matrix-gold" />
            <div>
              <p className="font-bold">Security First Update System</p>
              <p className="text-sm opacity-70">MotherCore uses a secure update system that prioritizes your control and privacy.</p>
            </div>
          </div>
          
          <div className="flex items-center text-sm mb-2">
            <CheckCircle className="w-4 h-4 mr-2 text-matrix-success" />
            <span>No automatic updates without your consent</span>
          </div>
          
          <div className="flex items-center text-sm mb-2">
            <CheckCircle className="w-4 h-4 mr-2 text-matrix-success" />
            <span>Always creates backups before updating</span>
          </div>
          
          <div className="flex items-center text-sm">
            <CheckCircle className="w-4 h-4 mr-2 text-matrix-success" />
            <span>Verifies integrity of all updates</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoCheck"
              className="mr-2 bg-matrix-dark border border-matrix-gold"
              checked={settings.autoCheck}
              onChange={e => setSettings({...settings, autoCheck: e.target.checked})}
            />
            <label htmlFor="autoCheck">Periodically check for updates</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="checkOnStartup"
              className="mr-2 bg-matrix-dark border border-matrix-gold"
              checked={settings.checkOnStartup}
              onChange={e => setSettings({...settings, checkOnStartup: e.target.checked})}
            />
            <label htmlFor="checkOnStartup">Check for updates on startup</label>
          </div>
          
          <div>
            <label className="block mb-2">Update Source:</label>
            <select
              className="w-full p-2 bg-matrix-dark border border-matrix-gold rounded"
              value={settings.updateSource}
              onChange={e => setSettings({
                ...settings, 
                updateSource: e.target.value as 'manual' | 'local-network' | 'secure-https'
              })}
            >
              <option value="manual">Manual (Most Secure)</option>
              <option value="local-network">Local Network</option>
              <option value="secure-https">Secure HTTPS</option>
            </select>
          </div>
          
          {settings.updateSource === 'secure-https' && (
            <div>
              <label className="block mb-2">Trusted Domains:</label>
              <div className="mb-2 flex">
                <input
                  type="text"
                  className="flex-1 p-2 bg-matrix-dark border border-matrix-gold rounded"
                  placeholder="Enter domain (e.g. updates.mothercore.app)"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                />
                <button
                  className="ml-2 px-3 py-1 bg-matrix-gold text-black rounded hover:bg-yellow-500"
                  onClick={handleAddTrustedDomain}
                >
                  Add
                </button>
              </div>
              
              <div className="max-h-24 overflow-y-auto">
                {settings.trustedDomains.length === 0 ? (
                  <p className="text-sm text-gray-400">No trusted domains added</p>
                ) : (
                  <ul className="space-y-1">
                    {settings.trustedDomains.map(domain => (
                      <li key={domain} className="flex items-center justify-between bg-matrix-black bg-opacity-50 p-1 rounded">
                        <span className="text-sm">{domain}</span>
                        <button
                          className="text-red-400 hover:text-red-500"
                          onClick={() => handleRemoveTrustedDomain(domain)}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {settings.trustedDomains.length === 0 && settings.updateSource === 'secure-https' && (
                <div className="mt-2 flex items-start text-sm text-matrix-amber">
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span>You must add at least one trusted domain to use HTTPS updates</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button
          className="px-4 py-2 bg-matrix-gold text-black rounded hover:bg-yellow-500"
          onClick={handleSaveSettings}
        >
          Save Settings
        </button>
        
        <button
          className="px-4 py-2 bg-matrix-dark border border-matrix-gold text-white rounded hover:bg-matrix-darker"
          onClick={handleCheckForUpdates}
          disabled={checking}
        >
          {checking ? 'Checking...' : 'Check for Updates'}
        </button>
      </div>
      
      {statusMessage && (
        <div className="mt-4 p-2 bg-matrix-black bg-opacity-50 rounded text-sm border border-matrix-gold border-opacity-30">
          <p>{statusMessage}</p>
        </div>
      )}
      
      {updateAvailable && (
        <div className="mt-4 p-4 bg-matrix-black bg-opacity-50 rounded border border-matrix-gold">
          <h3 className="font-bold text-matrix-gold mb-2">Update Available</h3>
          <p className="mb-1">Version: {updateAvailable.version}</p>
          <p className="mb-3">Released: {new Date(updateAvailable.releaseDate).toLocaleDateString()}</p>
          
          <div className="mb-4">
            <h4 className="font-bold mb-1">Changelog:</h4>
            <div className="text-sm max-h-32 overflow-y-auto bg-matrix-dark p-2 rounded">
              {updateAvailable.changelog}
            </div>
          </div>
          
          {downloadProgress !== null ? (
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-sm">
                <span>Downloading...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="h-2 bg-matrix-dark rounded overflow-hidden">
                <div 
                  className="h-full bg-matrix-gold" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button
              className="w-full py-2 bg-matrix-gold text-black rounded hover:bg-yellow-500 mb-2"
              onClick={handleDownloadUpdate}
            >
              Download Update
            </button>
          )}
          
          {downloadProgress === 100 && (
            <button
              className="w-full py-2 bg-matrix-success text-black rounded hover:bg-green-600"
              onClick={handleInstallUpdate}
            >
              Install Update
            </button>
          )}
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <button
          className="px-4 py-2 text-matrix-gold hover:text-white"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default UpdateSettings 