import { useEffect, useState } from 'react'
import './App.css'
import './renderer/styles/premium-ui.css' // Import premium UI styles
import MatrixRain from './renderer/components/effects/matrix-rain'
import { AlertTriangleIcon } from 'lucide-react'
import Sidebar from './renderer/components/navigation/Sidebar'
import MainContent from './renderer/components/content/MainContent'
import TitleBar from './renderer/components/layout/TitleBar'
import BottomBar from './renderer/components/layout/BottomBar'
import SettingsPage from './renderer/components/settings/SettingsPage'
import AuthScreen from './renderer/components/auth/AuthScreen' // Import AuthScreen
import TestComponent from './renderer/components/test-component'

// Update the type definition at the top of the file
type ContentType = 'organization' | 'project' | 'book' | 'chapter' | 'page' | null

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authSetupNeeded, setAuthSetupNeeded] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [preloadError, setPreloadError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  
  // Navigation state
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<string>('')
  const [isLibraryView, setIsLibraryView] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null)
  
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
  
  // Handle authentication from AuthScreen component
  const handleAuthenticated = async (password: string) => {
    if (!window.electronAPI) return
    
    try {
      setIsLoading(true)
      
      if (authSetupNeeded) {
        // Setup new auth
        const result = await window.electronAPI.setupAuth(password)
        if (result.success) {
          setAuthSetupNeeded(false)
          setIsAuthenticated(true)
          setAuthError('')
        } else {
          setAuthError(result.error || 'Failed to set up authentication')
        }
      } else {
        // Authenticate existing user
        const result = await window.electronAPI.authenticate(password)
        if (result) {
          setIsAuthenticated(true)
          setAuthError('')
        } else {
          setAuthError('Invalid password')
        }
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
    
    // If selecting an organization, set the library view
    if (type === 'organization') {
      setIsLibraryView(true);
      setSelectedOrganization(item);
    }
  };
  
  const handleBackToLibrary = () => {
    setIsLibraryView(false);
    setSelectedOrganization(null);
  };
  
  const handleEditorStatsChange = (stats: { words: number, characters: number }) => {
    setWordCount(stats.words);
    setCharCount(stats.characters);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
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

  function renderMainApplication() {
    // Stats for BottomBar
    const stats = {
      organizations: 0, // Replace with actual count
      projects: 0,
      notes: 0,
      storage: '0 KB'
    };
    
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
            <Sidebar 
              onSelectItem={handleSelectItem}
              isLibraryView={isLibraryView}
              selectedOrganization={selectedOrganization}
              onBackToLibrary={handleBackToLibrary}
            />
          </div>
          
          {/* Main Content Area */}
          <div className="main-content">
            {/* Title Bar */}
            <TitleBar 
              onSettingsClick={handleSettingsClick}
              currentUser="Knowledge Keeper" // Replace with actual user name
            />
            
            {/* Content Area */}
            <div className="content-area">
              <MainContent 
                selectedItem={selectedItem}
                selectedType={selectedType}
              />
            </div>
            
            {/* Bottom Bar */}
            <BottomBar stats={stats} />
          </div>
        </div>
        
        {/* Settings Overlay */}
        {showSettings && (
          <SettingsPage onClose={() => setShowSettings(false)} />
        )}
        
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

  // If not authenticated, show AuthScreen with appropriate mode
  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen 
          onAuthenticated={handleAuthenticated}
          isSignUp={authSetupNeeded}
        />
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
