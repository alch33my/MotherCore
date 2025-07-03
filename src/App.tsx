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
// Import form components
import CreateOrganizationForm from './renderer/components/organizations/create-organization-form'
import CreateProjectForm from './renderer/components/projects/create-project-form'
import CreateBookForm from './renderer/components/books/create-book-form'
import CreateChapterForm from './renderer/components/chapters/create-chapter-form'
import CreatePageForm from './renderer/components/content/create-page-form'
import ContentContainer from './renderer/components/content/content-container'

// Update the type definition at the top of the file
type ContentType = 'organization' | 'project' | 'book' | 'chapter' | 'page' | null

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

  // ADD: Modal handlers for creation forms
  const handleCreateOrganization = () => {
    // Close modal first
    setShowCreateOrgForm(false);
    console.log('Organization created successfully');
    addToast('Organization created successfully!', 'success');
    
    // Reload organizations to refresh the UI
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Small delay to ensure database has updated
      setTimeout(() => {
        window.electronAPI!.getOrganizations().then((result) => {
          if (result.success) {
            console.log('Organizations reloaded successfully');
            // Force reload the navigation tree by triggering a state change
            setSelectedType('');
            setSelectedItem(null);
          }
        });
      }, 300);
    }
  };

  const handleCreateProject = () => {
    // Close modal first
    setShowCreateProjectForm(false);
    console.log('Project created successfully');
    addToast('Project created successfully!', 'success');
    
    // Reload projects after creation
    if (typeof window !== 'undefined' && window.electronAPI && activeOrgId) {
      // Small delay to ensure database has updated
      setTimeout(() => {
        window.electronAPI!.getProjects(activeOrgId).then((result) => {
          if (result.success) {
            console.log('Projects reloaded successfully');
            // Force reload the main content by triggering a state change
            if (selectedItem && selectedType === 'organization' && selectedItem.id === activeOrgId) {
              const temp = selectedItem;
              setSelectedItem(null);
              setTimeout(() => setSelectedItem(temp), 50);
            }
          }
        });
      }, 300);
    }
  };

  const handleCreateBook = () => {
    // Close modal first
    setShowCreateBookForm(false);
    console.log('Book created successfully');
    addToast('Book created successfully!', 'success');
    
    // Reload books after creation
    if (typeof window !== 'undefined' && window.electronAPI && activeProjectId) {
      // Small delay to ensure database has updated
      setTimeout(() => {
        window.electronAPI!.getBooks(activeProjectId).then((result) => {
          if (result.success) {
            console.log('Books reloaded successfully');
            // Force reload the main content by triggering a state change
            if (selectedItem && selectedType === 'project' && selectedItem.id === activeProjectId) {
              const temp = selectedItem;
              setSelectedItem(null);
              setTimeout(() => setSelectedItem(temp), 50);
            }
          }
        });
      }, 300);
    }
  };

  const handleCreateChapter = () => {
    // Close modal first
    setShowCreateChapterForm(false);
    console.log('Chapter created successfully');
    addToast('Chapter created successfully!', 'success');
    
    // Reload chapters after creation
    if (typeof window !== 'undefined' && window.electronAPI && activeBookId) {
      // Small delay to ensure database has updated
      setTimeout(() => {
        window.electronAPI!.getChapters(activeBookId).then((result) => {
          if (result.success) {
            console.log('Chapters reloaded successfully');
            // Force reload the main content by triggering a state change
            if (selectedItem && selectedType === 'book' && selectedItem.id === activeBookId) {
              const temp = selectedItem;
              setSelectedItem(null);
              setTimeout(() => setSelectedItem(temp), 50);
            }
          }
        });
      }, 300);
    }
  };

  const handleCreatePage = () => {
    // Close modal first
    setShowCreatePageForm(false);
    console.log('Page created successfully');
    addToast('Page created successfully!', 'success');
    
    // Reload pages after creation
    if (typeof window !== 'undefined' && window.electronAPI && activeChapterId) {
      // Small delay to ensure database has updated
      setTimeout(() => {
        window.electronAPI!.getPages(activeChapterId).then((result) => {
          if (result.success) {
            console.log('Pages reloaded successfully');
            // Force reload the main content by triggering a state change
            if (selectedItem && selectedType === 'chapter' && selectedItem.id === activeChapterId) {
              const temp = selectedItem;
              setSelectedItem(null);
              setTimeout(() => setSelectedItem(temp), 50);
            }
          }
        });
      }, 300);
    }
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
      <div className="app-container">
        {/* Matrix Rain Effect in background */}
        <div className="matrix-background">
          {matrixSettings.enabled && (
            <MatrixRain 
              colorScheme={matrixSettings.colorScheme}
              intensity={matrixSettings.intensity}
              speed={matrixSettings.speed}
              density={matrixSettings.density}
            />
          )}
        </div>
        
        {/* Toast notifications */}
        {renderToasts()}
        
        {/* Main App Content */}
        <div className="app-content">
          {/* Sidebar */}
          <div className="sidebar">
            <Sidebar 
              onSelectItem={(item, type) => {
                handleSelectItem(item, type);
              }}
              isLibraryView={isLibraryView}
              selectedOrganization={selectedOrganization}
              onBackToLibrary={handleBackToLibrary}
              onCreateOrganization={() => setShowCreateOrgForm(true)}
              onCreateProject={() => setShowCreateProjectForm(true)}
              onCreateBook={() => setShowCreateBookForm(true)}
              onCreateChapter={() => setShowCreateChapterForm(true)}
              onCreatePage={() => setShowCreatePageForm(true)}
            />
          </div>
          
          {/* Main Content Area */}
          <div className="main-content">
            {/* Title Bar */}
            <TitleBar 
              onSettingsClick={handleSettingsClick}
              onDebugRefresh={forceRefresh}
              currentUser="Knowledge Keeper" // Replace with actual user name
            />
            
            {/* Content Area */}
            <div className="content-area">
              <MainContent
                selectedItem={selectedItem}
                selectedType={selectedType}
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
            
            {/* Bottom Bar */}
            <BottomBar stats={stats} />
          </div>
        </div>
        
        {/* Settings Overlay */}
        {showSettings && (
          <SettingsPage 
            onClose={() => setShowSettings(false)}
            matrixSettings={matrixSettings}
            onMatrixSettingsChange={setMatrixSettings}
          />
        )}
        
        {/* Modal Forms */}
        {showCreateOrgForm && (
          <div className="modal-overlay">
            <div className="modal-container">
              <CreateOrganizationForm 
                onClose={() => setShowCreateOrgForm(false)}
                onSuccess={handleCreateOrganization}
              />
            </div>
          </div>
        )}
        
        {showCreateProjectForm && (
          <div className="modal-overlay">
            <div className="modal-container">
              <CreateProjectForm 
                onClose={() => setShowCreateProjectForm(false)}
                onSuccess={handleCreateProject}
                organizationId={activeOrgId || ''}
              />
            </div>
          </div>
        )}
        
        {showCreateBookForm && (
          <div className="modal-overlay">
            <div className="modal-container">
              <CreateBookForm 
                onClose={() => setShowCreateBookForm(false)}
                onSuccess={handleCreateBook}
                projectId={activeProjectId || ''}
              />
            </div>
          </div>
        )}
        
        {showCreateChapterForm && (
          <div className="modal-overlay">
            <div className="modal-container">
              <CreateChapterForm 
                onClose={() => setShowCreateChapterForm(false)}
                onSuccess={handleCreateChapter}
                bookId={activeBookId || ''}
              />
            </div>
          </div>
        )}
        
        {showCreatePageForm && (
          <div className="modal-overlay">
            <div className="modal-container">
              <CreatePageForm 
                onClose={() => setShowCreatePageForm(false)}
                onSuccess={handleCreatePage}
                chapterId={activeChapterId || ''}
              />
            </div>
          </div>
        )}
      </div>
    )
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
        />
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
