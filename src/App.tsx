import React from 'react'
import { useEffect, useState, useCallback } from 'react'
import './App.css'
import './renderer/styles/premium-ui.css' // Import premium UI styles
import MatrixRain from './renderer/components/effects/matrix-rain'
import { AlertTriangleIcon, CheckCircleIcon } from 'lucide-react'
import Sidebar from './renderer/components/navigation/Sidebar'
import MainContent from './renderer/components/content/MainContent'
import TitleBar from './renderer/components/layout/TitleBar'
import BottomBar from './renderer/components/layout/BottomBar'
import SettingsPage from './renderer/components/settings/SettingsPage'
import AuthScreen from './renderer/components/auth/AuthScreen' // Import AuthScreen
import { ThemeProvider } from './renderer/context/ThemeContext'
// Import form components
import CreateOrganizationForm from './renderer/components/organizations/create-organization-form'
import CreateProjectForm from './renderer/components/projects/create-project-form'
import CreateBookForm from './renderer/components/books/create-book-form'
import CreateChapterForm from './renderer/components/chapters/create-chapter-form'
import CreatePageForm from './renderer/components/content/create-page-form'
import ChatPanel from './renderer/components/layout/ChatPanel'

type Toast = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

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
  
  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([])
  
  // Add toast notification
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, message, type, duration }
    setToasts(prevToasts => [...prevToasts, newToast])
    
    // Auto-dismiss toast
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }
  }, [])
  
  // Dismiss a toast
  const dismissToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }
  
  // Debug function to force refresh the entire application state
  const forceRefresh = async () => {
    console.log('Force refreshing entire application state')
    addToast('Refreshing application state...', 'info', 2000)
    
    // Clear all selection and active IDs
    setSelectedItem(null)
    setSelectedType('')
    setIsLibraryView(false)
    setSelectedOrganization(null)
    setActiveOrgId(null)
    setActiveProjectId(null)
    setActiveBookId(null)
    setActiveChapterId(null)
    
    // Close any open modals
    setShowCreateOrgForm(false)
    setShowCreateProjectForm(false)
    setShowCreateBookForm(false)
    setShowCreateChapterForm(false)
    setShowCreatePageForm(false)
    
    // If we have access to the database, refresh it
    if (window.electronAPI) {
      try {
        // Log database state
        console.log('Requesting database refresh')
        
        // Re-load stats
        const orgResult = await window.electronAPI.getOrganizations()
        if (orgResult.success) {
          const orgCount = orgResult.organizations?.length || 0
          
          // Update stats with real data
          setStats(prev => ({
            ...prev,
            organizations: orgCount,
            // Rough storage estimate
            storage: `${Math.round(orgCount * 0.2 * 10) / 10} MB`
          }))
          
          addToast('Application refreshed successfully!', 'success')
        }
      } catch (err) {
        console.error('Failed to refresh database state:', err)
        window.electronAPI?.logError(String(err))
        addToast('Failed to refresh application', 'error')
      }
    }
    
    console.log('Application state reset complete')
  }
  
  // Status bar data
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // ADD: Matrix rain settings state
  const [matrixSettings, setMatrixSettings] = useState({
    intensity: 70,
    speed: 50,
    colorScheme: 'gold' as 'gold' | 'green' | 'blue' | 'purple' | 'gradient',
    density: 0.8,
    enabled: true
  })
  
  // Stats for BottomBar
  const [stats, setStats] = useState({
    organizations: 0,
    projects: 0,
    notes: 0,
    storage: '0 KB'
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Load real stats
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined' && window.electronAPI) {
      // Get organization count
      window.electronAPI.getOrganizations().then(result => {
        if (result.success) {
          const orgCount = result.organizations?.length || 0;
          
          // Get projects count (sum of all projects across orgs)
          let projectPromises = [];
          let projectCount = 0;
          if (result.organizations) {
            for (const org of result.organizations) {
              projectPromises.push(
                window.electronAPI!.getProjects(org.id).then(projectResult => {
                  if (projectResult.success) {
                    projectCount += projectResult.projects?.length || 0;
                  }
                })
              );
            }
          }

          // Calculate total notes/pages
          Promise.all(projectPromises).then(() => {
            // Update stats with real data
            setStats(prev => ({
              ...prev,
              organizations: orgCount,
              projects: projectCount,
              // Rough storage estimate
              storage: `${Math.round((orgCount + projectCount) * 0.2 * 10) / 10} MB`
            }));
          });
        }
      });
    }
  }, [isAuthenticated]);
  
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
      setAuthError('')
      
      if (authSetupNeeded) {
        // Setup new auth
        const result = await window.electronAPI.setupAuth(password)
        if (result.success) {
          setAuthSetupNeeded(false)
          setIsAuthenticated(true)
          addToast('Setup complete! Welcome to MotherCore.', 'success')
        } else {
          setAuthError(result.error || 'Failed to set up authentication')
          setIsLoading(false)
        }
      } else {
        // Authenticate existing user
        const result = await window.electronAPI.authenticate(password)
        if (result) {
          setIsAuthenticated(true)
          addToast('Login successful! Welcome back.', 'success')
        } else {
          setAuthError('Invalid password')
          setIsLoading(false)
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setAuthError('Authentication failed')
      setIsLoading(false)
      if (window.electronAPI) {
        window.electronAPI.logError(String(err))
      }
    }
  }
  
  const handleSelectItem = (item: any, type: string) => {
    console.log(`Selecting ${type} with ID ${item.id}`, item);
    setSelectedItem(item);
    setSelectedType(type);
    
    // Update active IDs based on the type
    if (type === 'organization') {
      setActiveOrgId(item.id);
      // Clear other IDs when selecting organization
      setActiveProjectId(null);
      setActiveBookId(null);
      setActiveChapterId(null);
      setIsLibraryView(true);
      setSelectedOrganization(item);
    } else if (type === 'project') {
      setActiveProjectId(item.id);
      // Use the organization_id from the item
      if (item.organization_id) {
        console.log(`Setting active org ID to ${item.organization_id} for project ${item.id}`);
        setActiveOrgId(item.organization_id);
      } else {
        console.error(`Could not find parent organization for project: ${item.id}`);
      }
      // Clear child IDs
      setActiveBookId(null);
      setActiveChapterId(null);
    } else if (type === 'book') {
      setActiveBookId(item.id);
      // Use the project_id from the item
      if (item.project_id) {
        setActiveProjectId(item.project_id);
      }
      // Clear child IDs
      setActiveChapterId(null);
    } else if (type === 'chapter') {
      setActiveChapterId(item.id);
      // Use the book_id from the item
      if (item.book_id) {
        setActiveBookId(item.book_id);
      }
    }
  };
  
  const handleBackToLibrary = () => {
    setIsLibraryView(false);
    setSelectedOrganization(null);
    setSelectedItem(null);
    setSelectedType('');
  };
  
  const handleEditorStatsChange = (stats: { words: number, characters: number }) => {
    setWordCount(stats.words);
    setCharCount(stats.characters);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  // Handle content refresh from child components
  const handleRefreshContent = useCallback(() => {
    if (selectedItem && selectedType) {
      const temp = selectedItem;
      setSelectedItem(null);
      setTimeout(() => setSelectedItem(temp), 50);
      addToast('Content refreshed', 'info', 2000);
    }
  }, [selectedItem, selectedType]);

  // Add state for chat panel visibility
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Add toggle function for chat panel
  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  function renderToasts() {
    return (
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`px-4 py-3 rounded shadow-lg flex items-center justify-between
              ${toast.type === 'success' ? 'bg-matrix-success bg-opacity-10 text-matrix-success border border-matrix-success border-opacity-30' : 
                toast.type === 'error' ? 'bg-matrix-error bg-opacity-10 text-matrix-error border border-matrix-error border-opacity-30' :
                'bg-matrix-amber bg-opacity-10 text-matrix-amber border border-matrix-amber border-opacity-30'
              }
            `}
          >
            <div className="flex items-center">
              {toast.type === 'success' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
              {toast.type === 'error' && <AlertTriangleIcon className="w-5 h-5 mr-2" />}
              <span>{toast.message}</span>
            </div>
            <button 
              onClick={() => dismissToast(toast.id)}
              className="ml-4 opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );
  }

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
    return (
      <ThemeProvider>
        <div className="app-container">
          {/* Matrix Rain Background */}
          <div className="matrix-background">
            <MatrixRain 
              intensity={matrixSettings.intensity}
              speed={matrixSettings.speed}
              colorScheme={matrixSettings.colorScheme}
              density={matrixSettings.density}
            />
          </div>
          
          {/* Main App Content */}
          <div className="app-content">
            {/* Title Bar */}
            <TitleBar 
              onSettingsClick={handleSettingsClick}
              onDebugRefresh={forceRefresh}
              currentUser="Knowledge Keeper"
            />
            
            {/* Main Content */}
            <div className={`main-content-layout ${isChatOpen ? 'chat-open' : ''}`}>
              {/* Sidebar */}
              <Sidebar 
                onSelectItem={handleSelectItem}
                onBackToLibrary={handleBackToLibrary}
                selectedOrganization={selectedOrganization}
                isLibraryView={isLibraryView}
                onCreateOrganization={() => setShowCreateOrgForm(true)}
                onCreateProject={() => setShowCreateProjectForm(true)}
                onCreateBook={() => setShowCreateBookForm(true)}
                onCreateChapter={() => setShowCreateChapterForm(true)}
                onCreatePage={() => setShowCreatePageForm(true)}
              />
              
              {/* Main Content Area */}
              <div className="content-area">
                <MainContent 
                  selectedItem={selectedItem}
                  selectedType={selectedType}
                  onEditorStatsChange={handleEditorStatsChange}
                  currentTime={currentTime}
                  wordCount={wordCount}
                  charCount={charCount}
                  onRefreshContent={handleRefreshContent}
                  onAddProject={(orgId) => {
                    setActiveOrgId(orgId);
                    setShowCreateProjectForm(true);
                  }}
                  onAddBook={(projectId) => {
                    setActiveProjectId(projectId);
                    setShowCreateBookForm(true);
                  }}
                  onAddChapter={(bookId) => {
                    setActiveBookId(bookId);
                    setShowCreateChapterForm(true);
                  }}
                  onAddPage={(chapterId) => {
                    setActiveChapterId(chapterId);
                    setShowCreatePageForm(true);
                  }}
                />
              </div>
              
              {/* Chat Panel */}
              <ChatPanel 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
              />
            </div>
            
            {/* Bottom Bar */}
            <BottomBar 
              stats={{
                organizations: stats.organizations,
                projects: stats.projects,
                books: 0, // Use default value if not available
                chapters: 0, // Use default value if not available
                notes: stats.notes,
                storage: stats.storage
              }}
              onToggleChat={toggleChat}
              isChatOpen={isChatOpen}
            />
          </div>
          
          {/* Settings Page */}
          {showSettings && (
            <SettingsPage 
              onClose={() => setShowSettings(false)}
              matrixSettings={matrixSettings}
              onMatrixSettingsChange={setMatrixSettings}
            />
          )}
          
          {/* Create Forms */}
          {showCreateOrgForm && (
            <CreateOrganizationForm
              onClose={() => setShowCreateOrgForm(false)}
              onSuccess={() => {
                setShowCreateOrgForm(false);
                addToast(`Organization created successfully!`, 'success');
                forceRefresh();
              }}
            />
          )}
          
          {showCreateProjectForm && activeOrgId && (
            <CreateProjectForm
              organizationId={activeOrgId}
              onClose={() => setShowCreateProjectForm(false)}
              onSuccess={() => {
                setShowCreateProjectForm(false);
                addToast(`Project created successfully!`, 'success');
                forceRefresh();
              }}
            />
          )}
          
          {showCreateBookForm && activeProjectId && (
            <CreateBookForm
              projectId={activeProjectId}
              onClose={() => setShowCreateBookForm(false)}
              onSuccess={() => {
                setShowCreateBookForm(false);
                addToast(`Book created successfully!`, 'success');
                forceRefresh();
              }}
            />
          )}
          
          {showCreateChapterForm && activeBookId && (
            <CreateChapterForm
              bookId={activeBookId}
              onClose={() => setShowCreateChapterForm(false)}
              onSuccess={() => {
                setShowCreateChapterForm(false);
                addToast(`Chapter created successfully!`, 'success');
                forceRefresh();
              }}
            />
          )}
          
          {showCreatePageForm && activeChapterId && (
            <CreatePageForm
              chapterId={activeChapterId}
              onClose={() => setShowCreatePageForm(false)}
              onSuccess={() => {
                setShowCreatePageForm(false);
                addToast(`Page created successfully!`, 'success');
                forceRefresh();
              }}
            />
          )}
          
          {/* Toast Notifications */}
          {renderToasts()}
        </div>
      </ThemeProvider>
    );
  }

  // Show loading state while checking authentication status
  if (isLoading && !isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-matrix-black">
        <MatrixRain colorScheme="gold" />
        <div className="z-10 text-white text-xl">Initializing MotherCore...</div>
      </div>
    )
  }

  // Show preload error screen if electronAPI is not available
  if (preloadError) {
    return (
      <>
        {renderPreloadErrorScreen()}
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
          error={authError}
        />
      </>
    )
  }

  return (
    <ThemeProvider>
      {renderMainApplication()}
    </ThemeProvider>
  )
}

export default App

