import { useEffect, useState } from 'react'
import MatrixRain from './renderer/components/effects/matrix-rain'
import { LockIcon, UnlockIcon, KeyIcon, AlertTriangleIcon } from 'lucide-react'
import NavigationTree from './renderer/components/navigation/navigation-tree'
import ContentContainer from './renderer/components/content/content-container'
import CreateOrganizationForm from './renderer/components/organizations/create-organization-form'
import CreateProjectForm from './renderer/components/projects/create-project-form'
import CreateBookForm from './renderer/components/books/create-book-form'
import CreateChapterForm from './renderer/components/chapters/create-chapter-form'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authSetupNeeded, setAuthSetupNeeded] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [preloadError, setPreloadError] = useState<string | null>(null)
  
  // Navigation state
  const [selectedType, setSelectedType] = useState<'organization' | 'project' | 'book' | 'chapter' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Modal states
  const [showCreateOrgForm, setShowCreateOrgForm] = useState(false)
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false)
  const [showCreateBookForm, setShowCreateBookForm] = useState(false)
  const [showCreateChapterForm, setShowCreateChapterForm] = useState(false)
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  
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
  
  // Load organizations after authentication
  useEffect(() => {
    if (isAuthenticated && window.electronAPI) {
      loadOrganizations()
    }
  }, [isAuthenticated])
  
  async function loadOrganizations() {
    if (!window.electronAPI) return
    
    try {
      const result = await window.electronAPI.getOrganizations()
      if (result.success && result.organizations) {
        // Store organizations if needed later
      }
    } catch (err) {
      console.error('Failed to load organizations:', err)
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

  function handleCreateOrganizationSuccess() {
    loadOrganizations()
  }
  
  function handleSelectOrganization(orgId: string) {
    setSelectedType('organization')
    setSelectedId(orgId)
  }
  
  function handleSelectProject(projectId: string) {
    setSelectedType('project')
    setSelectedId(projectId)
  }
  
  function handleSelectBook(bookId: string) {
    setSelectedType('book')
    setSelectedId(bookId)
  }
  
  function handleSelectChapter(chapterId: string) {
    setSelectedType('chapter')
    setSelectedId(chapterId)
  }
  
  function handleAddProject(orgId: string) {
    setActiveOrgId(orgId)
    setShowCreateProjectForm(true)
  }
  
  function handleAddBook(projectId: string) {
    setActiveProjectId(projectId)
    setShowCreateBookForm(true)
  }
  
  function handleAddChapter(bookId: string) {
    setActiveBookId(bookId)
    setShowCreateChapterForm(true)
  }
  
  function handleProjectCreated() {
    // If we're viewing the organization, refresh the content
    if (selectedType === 'organization' && selectedId === activeOrgId) {
      // Force content refresh
      const currentId = selectedId
      setSelectedId(null)
      setTimeout(() => setSelectedId(currentId), 10)
    }
  }
  
  function handleBookCreated() {
    // If we're viewing the project, refresh the content
    if (selectedType === 'project' && selectedId === activeProjectId) {
      // Force content refresh
      const currentId = selectedId
      setSelectedId(null)
      setTimeout(() => setSelectedId(currentId), 10)
    }
  }
  
  function handleChapterCreated() {
    // If we're viewing the book, refresh the content
    if (selectedType === 'book' && selectedId === activeBookId) {
      // Force content refresh
      const currentId = selectedId
      setSelectedId(null)
      setTimeout(() => setSelectedId(currentId), 10)
    }
  }

  // Render a screen showing preload script error
  function renderPreloadErrorScreen() {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-matrix-black">
        <div className="bg-matrix-dark-gray p-8 rounded-lg shadow-lg w-96 border border-matrix-green">
          <div className="flex items-center justify-center mb-6">
            <AlertTriangleIcon className="text-red-500 mr-2" size={28} />
            <h1 className="text-red-500 text-2xl font-bold">Initialization Error</h1>
          </div>
          
          <p className="text-matrix-amber mb-6 text-center">
            {preloadError}
          </p>
          
          <div className="text-matrix-green text-sm mt-4">
            <p>Troubleshooting steps:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Restart the application</li>
              <li>Verify preload script path in main.ts</li>
              <li>Check console for additional errors</li>
              <li>Rebuild the application using npm run build</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  function renderAuthSetupScreen() {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-matrix-black">
        <div className="bg-matrix-dark-gray p-8 rounded-lg shadow-lg w-96 border border-matrix-green">
          <div className="flex items-center justify-center mb-6">
            <KeyIcon className="text-matrix-gold mr-2" size={28} />
            <h1 className="text-matrix-gold text-2xl font-bold">Welcome to MotherCore</h1>
          </div>
          
          <p className="text-matrix-amber mb-6 text-center">
            Create a master password to secure your digital library
          </p>
          
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create Master Password" 
                className="bg-matrix-dark-gray border-b border-matrix-green text-matrix-green w-full p-2 focus:outline-none focus:border-matrix-gold"
              />
            </div>
            
            <div className="relative">
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Master Password" 
                className="bg-matrix-dark-gray border-b border-matrix-green text-matrix-green w-full p-2 focus:outline-none focus:border-matrix-gold"
              />
            </div>
            
            <button 
              onClick={handleSetupAuth}
              disabled={isLoading}
              className="w-full bg-matrix-green bg-opacity-20 hover:bg-opacity-30 text-matrix-gold py-2 px-4 rounded transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? 'Setting up...' : 'Create Secure Library'}
              {!isLoading && <KeyIcon className="ml-2" size={16} />}
            </button>
          </div>
          
          {authError && (
            <p className="text-matrix-error text-sm mt-4 text-center">{authError}</p>
          )}
        </div>
      </div>
    )
  }

  function renderAuthenticationScreen() {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-matrix-black">
        <div className="bg-matrix-dark-gray p-8 rounded-lg shadow-lg w-96 border border-matrix-green">
          <div className="flex items-center justify-center mb-6">
            <LockIcon className="text-matrix-gold mr-2" size={28} />
            <h1 className="text-matrix-gold text-2xl font-bold">MotherCore</h1>
          </div>
          
          <div className="relative mb-6">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuthentication()}
              placeholder="Enter Master Password" 
              className="bg-matrix-dark-gray border-b border-matrix-green text-matrix-green w-full p-2 pr-10 focus:outline-none focus:border-matrix-gold"
            />
            <button 
              onClick={handleAuthentication}
              disabled={isLoading}
              className="absolute right-0 top-2 text-matrix-green hover:text-matrix-gold transition-colors duration-200"
            >
              <UnlockIcon size={20} />
            </button>
          </div>
          
          {authError && (
            <p className="text-matrix-error text-sm mt-2 text-center">{authError}</p>
          )}
          
          {isLoading && (
            <p className="text-matrix-amber text-sm mt-2 text-center">Authenticating...</p>
          )}
        </div>
      </div>
    )
  }

  function renderMainApplication() {
    return (
      <div className="h-screen bg-matrix-black text-matrix-green">
        <div className="grid grid-cols-[250px_1fr] h-full">
          {/* Sidebar Navigation */}
          <div className="bg-matrix-dark-gray p-4 border-r border-matrix-green border-opacity-50 overflow-y-auto">
            <NavigationTree 
              onSelectOrganization={handleSelectOrganization}
              onSelectProject={handleSelectProject}
              onSelectBook={handleSelectBook}
              onSelectChapter={handleSelectChapter}
              onAddOrganization={() => setShowCreateOrgForm(true)}
              onAddProject={handleAddProject}
              onAddBook={handleAddBook}
              onAddChapter={handleAddChapter}
            />
          </div>

          {/* Main Content Area */}
          <div className="overflow-auto">
            <ContentContainer 
              selectedType={selectedType}
              selectedId={selectedId}
            />
          </div>
        </div>
        
        {/* Modals */}
        {showCreateOrgForm && (
          <div className="fixed inset-0 bg-matrix-black bg-opacity-80 flex items-center justify-center z-10">
            <CreateOrganizationForm 
              onClose={() => setShowCreateOrgForm(false)} 
              onSuccess={handleCreateOrganizationSuccess}
            />
          </div>
        )}
        
        {showCreateProjectForm && activeOrgId && (
          <div className="fixed inset-0 bg-matrix-black bg-opacity-80 flex items-center justify-center z-10">
            <CreateProjectForm 
              organizationId={activeOrgId}
              onClose={() => setShowCreateProjectForm(false)} 
              onSuccess={handleProjectCreated}
            />
          </div>
        )}
        
        {showCreateBookForm && activeProjectId && (
          <div className="fixed inset-0 bg-matrix-black bg-opacity-80 flex items-center justify-center z-10">
            <CreateBookForm 
              projectId={activeProjectId}
              onClose={() => setShowCreateBookForm(false)} 
              onSuccess={handleBookCreated}
            />
          </div>
        )}
        
        {showCreateChapterForm && activeBookId && (
          <div className="fixed inset-0 bg-matrix-black bg-opacity-80 flex items-center justify-center z-10">
            <CreateChapterForm 
              bookId={activeBookId}
              onClose={() => setShowCreateChapterForm(false)} 
              onSuccess={handleChapterCreated}
            />
          </div>
        )}
      </div>
    )
  }

  // Show loading state while checking authentication status
  if (isLoading && !isAuthenticated) {
    return (
      <>
        <MatrixRain />
        <div className="fixed inset-0 flex items-center justify-center bg-matrix-black bg-opacity-50">
          <div className="text-matrix-green text-xl">Initializing MotherCore...</div>
        </div>
      </>
    )
  }

  // Show preload error screen if electronAPI is not available
  if (preloadError) {
    return (
      <>
        <MatrixRain />
        {renderPreloadErrorScreen()}
      </>
    )
  }

  return (
    <>
      <MatrixRain characterSet="mixed" colorScheme="gradient" />
      {authSetupNeeded ? renderAuthSetupScreen() : 
        !isAuthenticated ? renderAuthenticationScreen() : renderMainApplication()}
    </>
  )
}

export default App
