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
// Import form components
import CreateOrganizationForm from './renderer/components/organizations/create-organization-form'
import CreateProjectForm from './renderer/components/projects/create-project-form'
import CreateBookForm from './renderer/components/books/create-book-form'
import CreateChapterForm from './renderer/components/chapters/create-chapter-form'
import CreatePageForm from './renderer/components/content/create-page-form'


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
        } else {
          setAuthError(result.error || 'Failed to set up authentication')
          setIsLoading(false)
        }
      } else {
        // Authenticate existing user
        const result = await window.electronAPI.authenticate(password)
        if (result) {
          setIsAuthenticated(true)
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

  // ADD: Modal handlers for creation forms
  const handleCreateOrganization = () => {
    // Close modal first
    setShowCreateOrgForm(false);
    console.log('Organization created successfully');
    // Refresh data after creation
    if (window.electronAPI) {
      window.electronAPI.getOrganizations().then((result) => {
        if (result.success) {
          console.log('Organizations reloaded successfully');
        }
      });
    }
  };

  const handleCreateProject = () => {
    // Close modal first
    setShowCreateProjectForm(false);
    console.log('Project created successfully');
    // Refresh data after creation
    if (window.electronAPI && activeOrgId) {
      window.electronAPI.getProjects(activeOrgId).then((result) => {
        if (result.success) {
          console.log('Projects reloaded successfully');
        }
      });
    }
  };

  const handleCreateBook = () => {
    // Close modal first
    setShowCreateBookForm(false);
    console.log('Book created successfully');
    // Refresh data after creation
    if (window.electronAPI && activeProjectId) {
      window.electronAPI.getBooks(activeProjectId).then((result) => {
        if (result.success) {
          console.log('Books reloaded successfully');
        }
      });
    }
  };

  const handleCreateChapter = () => {
    // Close modal first
    setShowCreateChapterForm(false);
    console.log('Chapter created successfully');
    // Refresh data after creation
    if (window.electronAPI && activeBookId) {
      window.electronAPI.getChapters(activeBookId).then((result) => {
        if (result.success) {
          console.log('Chapters reloaded successfully');
        }
      });
    }
  };

  const handleCreatePage = () => {
    // Close modal first
    setShowCreatePageForm(false);
    console.log('Page created successfully');
    // Refresh data after creation
    if (window.electronAPI && activeChapterId) {
      window.electronAPI.getPages(activeChapterId).then((result) => {
        if (result.success) {
          console.log('Pages reloaded successfully');
        }
      });
    }
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
        
        {/* Main App Content */}
        <div className="app-content">
          {/* Sidebar */}
          <div className="sidebar">
            <Sidebar 
              onSelectItem={(item, type) => {
                handleSelectItem(item, type);
                
                // Update active IDs when selecting items
                if (type === 'organization') {
                  setActiveOrgId(item.id);
                } else if (type === 'project') {
                  setActiveProjectId(item.id);
                } else if (type === 'book') {
                  setActiveBookId(item.id);
                } else if (type === 'chapter') {
                  setActiveChapterId(item.id);
                }
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
