import { useEffect, useState } from 'react'
import './App.css'
import MatrixRain from './renderer/components/effects/matrix-rain'
import { LockIcon, UnlockIcon, KeyIcon, AlertTriangleIcon } from 'lucide-react'
import Sidebar from './renderer/components/navigation/Sidebar'
import MainContent from './renderer/components/content/MainContent'
import TitleBar from './renderer/components/layout/TitleBar'
import TestComponent from './renderer/components/test-component'

// Update the type definition at the top of the file
type ContentType = 'organization' | 'project' | 'book' | 'chapter' | 'page' | null

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authSetupNeeded, setAuthSetupNeeded] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [preloadError, setPreloadError] = useState<string | null>(null)
  
  // Navigation state
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<string>('')
  
  // Modal states
  const [showCreateOrgForm, setShowCreateOrgForm] = useState(false)
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false)
  const [showCreateBookForm, setShowCreateBookForm] = useState(false)
  const [showCreateChapterForm, setShowCreateChapterForm] = useState(false)
  const [showCreatePageForm, setShowCreatePageForm] = useState(false)
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  
  // Status bar data
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Check if electronAPI is available
  useEffect(() => {
    if (!window.electronAPI) {
      setPreloadError('Electron API not available. The preload script may not be loading correctly.')
      setIsLoading(false)
      console.error('Electron API not available')
      return
    }
    
    // If electronAPI is available, check authentication
    checkAuthStatus()
  }, [])
  
  // Check if authentication is needed on startup
  async function checkAuthStatus() {
    if (!window.electronAPI) return
    
    try {
      const authExists = await window.electronAPI.checkAuthStatus()
      setAuthSetupNeeded(!authExists)
      setIsLoading(false)
    } catch (err) {
      console.error('Failed to check auth status:', err)
      setAuthError('Failed to check authentication status')
      setIsLoading(false)
      window.electronAPI.logError(String(err))
    }
  }
  
  async function handleSetupAuth() {
    if (!window.electronAPI) return
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }
    
    // Validate password strength
    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters')
      return
    }
    
    try {
      setIsLoading(true)
      const result = await window.electronAPI.setupAuth(password)
      if (result.success) {
        setAuthSetupNeeded(false)
        setIsAuthenticated(true)
        setAuthError('')
      } else {
        setAuthError(result.error || 'Failed to set up authentication')
      }
    } catch (err) {
      setAuthError('Authentication setup failed')
      window.electronAPI.logError(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAuthentication() {
    if (!window.electronAPI) return
    
    try {
      setIsLoading(true)
      const result = await window.electronAPI.authenticate(password)
      if (result) {
        setIsAuthenticated(true)
        setAuthError('')
      } else {
        setAuthError('Invalid password')
      }
    } catch (err) {
      setAuthError('Authentication failed')
      window.electronAPI.logError(String(err))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSelectItem = (item: any, type: string) => {
    setSelectedItem(item);
    setSelectedType(type);
  };
  
  const handleEditorStatsChange = (stats: { words: number, characters: number }) => {
    setWordCount(stats.words);
    setCharCount(stats.characters);
  };

  function renderPreloadErrorScreen() {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-matrix-black">
        <div className="max-w-md p-8 bg-matrix-dark-gray rounded-lg border border-matrix-error shadow-lg text-center">
          <AlertTriangleIcon className="w-16 h-16 text-matrix-error mx-auto mb-4" />
          <h2 className="text-xl text-matrix-error font-bold mb-4">Preload Error</h2>
          <p className="text-matrix-white mb-6">{preloadError}</p>
          <p className="text-sm text-matrix-amber">
            This is likely due to an issue with the Electron configuration.
            Please check the console for more details.
          </p>
        </div>
      </div>
    )
  }

  function renderAuthSetupScreen() {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-matrix-black">
        <MatrixRain colorScheme="gold" />
        <div className="z-10 max-w-md p-8 bg-matrix-dark-gray bg-opacity-80 rounded-lg border border-matrix-gold shadow-matrix">
          <div className="flex justify-center mb-6">
            <KeyIcon size={48} className="text-matrix-gold" />
          </div>
          
          <h2 className="text-2xl text-matrix-gold font-bold text-center mb-2">
            Welcome to MotherCore
          </h2>
          
          <p className="text-matrix-amber mb-6 text-center">
            Set up a password to secure your digital library
          </p>
          
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                className="w-full bg-matrix-black border border-matrix-gold p-2 rounded text-white focus:border-matrix-gold focus:outline-none"
              />
            </div>
            
            <div className="relative">
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-matrix-black border border-matrix-gold p-2 rounded text-white focus:border-matrix-gold focus:outline-none"
              />
            </div>
            
            {authError && (
              <div className="text-matrix-error text-sm bg-matrix-error bg-opacity-10 p-2 rounded border border-matrix-error border-opacity-30">
                {authError}
              </div>
            )}
            
            <button
              onClick={handleSetupAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold p-2 rounded"
            >
              {isLoading ? 'Setting up...' : (
                <>
                  <KeyIcon size={16} className="mr-2" />
                  Set Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderAuthenticationScreen() {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-matrix-black">
        <MatrixRain colorScheme="gold" />
        <div className="z-10 max-w-md p-8 bg-matrix-dark-gray bg-opacity-80 rounded-lg border border-matrix-gold shadow-matrix">
          <div className="flex justify-center mb-6">
            <LockIcon size={48} className="text-matrix-gold" />
          </div>
          
          <h2 className="text-2xl text-matrix-gold font-bold text-center mb-2">
            Authentication Required
          </h2>
          
          <p className="text-matrix-amber mb-6 text-center">
            Enter your password to access your digital library
          </p>
          
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuthentication()}
                placeholder="Enter password"
                className="w-full bg-matrix-black border border-matrix-gold p-2 rounded text-white focus:border-matrix-gold focus:outline-none"
              />
            </div>
            
            {authError && (
              <div className="text-matrix-error text-sm bg-matrix-error bg-opacity-10 p-2 rounded border border-matrix-error border-opacity-30">
                {authError}
              </div>
            )}
            
            <button
              onClick={handleAuthentication}
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold p-2 rounded"
            >
              {isLoading ? 'Authenticating...' : (
                <>
                  <UnlockIcon size={16} className="mr-2" />
                  Unlock
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderMainApplication() {
    return (
      <div className="app-container">
        {/* Matrix Rain Effect in background */}
        <div className="matrix-background">
          <MatrixRain colorScheme="gold" />
        </div>
        
        {/* Main App Content */}
        <div className="app-content">
          {/* Sidebar */}
          <div className="sidebar">
            <Sidebar onSelectItem={handleSelectItem} />
          </div>
          
          {/* Main Content Area */}
          <div className="main-content">
            {/* Title Bar */}
            <TitleBar />
            
            {/* Content Area */}
            <div className="content-area">
              <MainContent 
                selectedItem={selectedItem}
                selectedType={selectedType}
              />
            </div>
            
            {/* Status Bar */}
            <div className="status-bar">
              <div className="flex items-center text-amber text-sm">
                <span>Words: {wordCount}</span>
                <span className="mx-2">|</span>
                <span>Characters: {charCount}</span>
              </div>
              <div className="text-amber text-sm">
                {currentTime}
              </div>
            </div>
          </div>
        </div>
        
        <TestComponent />
      </div>
    )
  }

  // Show loading state while checking authentication status
  if (isLoading && !isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-matrix-black">
        <MatrixRain colorScheme="gold" />
        <div className="z-10 text-white text-xl">Initializing MotherCore...</div>
        <TestComponent />
      </div>
    )
  }

  // Show preload error screen if electronAPI is not available
  if (preloadError) {
    return (
      <>
        {renderPreloadErrorScreen()}
        <TestComponent />
      </>
    )
  }

  // Render the appropriate screen based on authentication state
  if (authSetupNeeded) {
    return (
      <>
        {renderAuthSetupScreen()}
        <TestComponent />
      </>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        {renderAuthenticationScreen()}
        <TestComponent />
      </>
    )
  }

  return (
    <>
      {renderMainApplication()}
    </>
  )
}

export default App
