import { useState, useEffect } from 'react'
import { BookOpen, Folder, LayoutGrid, FileText, PlusIcon } from 'lucide-react'
import PageEditor from './page-editor'

// Import the ContentType from App.tsx or define it here
type ContentType = 'organization' | 'project' | 'book' | 'chapter' | 'page' | null

interface ContentContainerProps {
  selectedType?: ContentType
  selectedId?: string | null
  setSelectedType: React.Dispatch<React.SetStateAction<ContentType>>
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>
  onEditorStatsChange?: (stats: { words: number, characters: number }) => void
}

function ContentContainer({ selectedType, selectedId, setSelectedType, setSelectedId, onEditorStatsChange }: ContentContainerProps) {
  const [contentData, setContentData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  useEffect(() => {
    if (selectedId && selectedType) {
      loadContent()
    } else {
      setContentData(null)
    }
  }, [selectedId, selectedType])
  
  async function loadContent() {
    if (!selectedId || !selectedType) return
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      switch (selectedType) {
        case 'organization':
          const orgResult = await window.electronAPI.getProjects(selectedId)
          if (orgResult.success) {
            setContentData({
              type: 'organization',
              projects: orgResult.projects || [],
            })
          } else {
            setError(orgResult.error || 'Failed to load organization data')
          }
          break
          
        case 'project':
          const projectResult = await window.electronAPI.getBooks(selectedId)
          if (projectResult.success) {
            setContentData({
              type: 'project',
              books: projectResult.books || [],
            })
          } else {
            setError(projectResult.error || 'Failed to load project data')
          }
          break
          
        case 'book':
          const bookResult = await window.electronAPI.getChapters(selectedId)
          if (bookResult.success) {
            setContentData({
              type: 'book',
              chapters: bookResult.chapters || [],
            })
          } else {
            setError(bookResult.error || 'Failed to load book data')
          }
          break
          
        case 'chapter':
          const chapterResult = await window.electronAPI.getPages(selectedId)
          if (chapterResult.success) {
            setContentData({
              type: 'chapter',
              pages: chapterResult.pages || [],
            })
          } else {
            setError(chapterResult.error || 'Failed to load chapter data')
          }
          break
          
        case 'page':
          setContentData({
            type: 'page',
            pageId: selectedId
          })
          break
      }
    } catch (err) {
      console.error('Failed to load content:', err)
      setError('Failed to load content')
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(false)
    }
  }

  // Render welcome screen when nothing is selected
  if (!selectedType || !selectedId) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold text-white mb-6">Welcome to MotherCore</h2>
        
        <div className="bg-matrix-dark-gray bg-opacity-80 border border-matrix-gold border-opacity-50 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl text-amber mb-4">Your Digital Knowledge Library</h3>
          <p className="text-white mb-4">
            Select an item from the navigation tree to view its contents, or create a new organization to get started.
          </p>
          
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="bg-matrix-black bg-opacity-70 p-4 rounded-lg border border-matrix-gold border-opacity-30 shadow-md">
              <Folder className="text-amber mb-2" size={24} />
              <h4 className="text-gold mb-1">Organizations</h4>
              <p className="text-white text-sm">
                Create organizations to group related projects
              </p>
            </div>
            
            <div className="bg-matrix-black bg-opacity-70 p-4 rounded-lg border border-matrix-gold border-opacity-30 shadow-md">
              <LayoutGrid className="text-amber mb-2" size={24} />
              <h4 className="text-gold mb-1">Projects</h4>
              <p className="text-white text-sm">
                Organize your work into specific projects
              </p>
            </div>
            
            <div className="bg-matrix-black bg-opacity-70 p-4 rounded-lg border border-matrix-gold border-opacity-30 shadow-md">
              <BookOpen className="text-amber mb-2" size={24} />
              <h4 className="text-gold mb-1">Books & Chapters</h4>
              <p className="text-white text-sm">
                Store your knowledge in books and chapters
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-white">Loading content...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-matrix-dark-gray border border-matrix-error border-opacity-50 p-4 rounded-lg">
          <p className="text-matrix-error">{error}</p>
          <button 
            onClick={loadContent}
            className="mt-2 px-4 py-1 bg-matrix-error bg-opacity-20 text-matrix-error rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  // Display content based on type
  return (
    <div className="p-6">
      {contentData?.type === 'organization' && (
        <>
          <h2 className="text-2xl font-bold text-white mb-6">Projects</h2>
          
          {contentData.projects.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {contentData.projects.map((project: any) => (
                <div 
                  key={project.id}
                  className="bg-matrix-dark-gray bg-opacity-80 p-4 rounded-lg border border-matrix-gold border-opacity-30 hover:border-opacity-70 cursor-pointer shadow-md"
                  style={{ borderLeftColor: project.color || '#ffb000', borderLeftWidth: '4px' }}
                >
                  <h3 className="text-matrix-amber text-lg mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-white text-sm">{project.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white opacity-70">No projects found in this organization.</p>
          )}
        </>
      )}
      
      {contentData?.type === 'project' && (
        <>
          <h2 className="text-2xl font-bold text-matrix-gold mb-6">Books</h2>
          
          {contentData.books.length > 0 ? (
            <div className="grid grid-cols-4 gap-6">
              {contentData.books.map((book: any) => (
                <div 
                  key={book.id}
                  className="cursor-pointer"
                >
                  <div 
                    className="h-40 rounded-md shadow-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: book.spine_color || '#ffd700',
                      color: '#000',
                      writingMode: 'vertical-lr',
                      transform: 'rotate(180deg)',
                      textOrientation: 'mixed'
                    }}
                  >
                    <h3 className="text-lg font-bold px-2 truncate max-h-full">
                      {book.name}
                    </h3>
                  </div>
                  <div className="mt-2">
                    <p className="text-matrix-green text-sm truncate">{book.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-matrix-green opacity-70">No books found in this project.</p>
          )}
        </>
      )}
      
      {contentData?.type === 'book' && (
        <>
          <h2 className="text-2xl font-bold text-matrix-gold mb-6">Chapters</h2>
          
          {contentData.chapters.length > 0 ? (
            <div className="bg-matrix-dark-gray rounded-lg border border-matrix-green border-opacity-30 overflow-hidden">
              {contentData.chapters.map((chapter: any, index: number) => (
                <div 
                  key={chapter.id}
                  className={`p-4 hover:bg-matrix-black hover:bg-opacity-30 cursor-pointer ${
                    index !== contentData.chapters.length - 1 ? 'border-b border-matrix-green border-opacity-20' : ''
                  }`}
                >
                  <h3 className="text-matrix-green">
                    <span className="text-matrix-amber mr-2">Chapter {index + 1}:</span>
                    {chapter.name}
                  </h3>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-matrix-green opacity-70">No chapters found in this book.</p>
          )}
        </>
      )}
      
      {contentData?.type === 'chapter' && (
        <>
          <h2 className="text-2xl font-bold text-white mb-6">Pages</h2>
          
          {contentData.pages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {contentData.pages.map((page: any) => (
                <div 
                  key={page.id}
                  className="bg-matrix-dark-gray bg-opacity-80 p-4 rounded-lg border border-matrix-gold border-opacity-30 hover:border-opacity-70 cursor-pointer shadow-md"
                  onClick={() => {
                    if (window.electronAPI) {
                      // Update selected type and ID in parent component
                      setSelectedType('page');
                      setSelectedId(page.id);
                    }
                  }}
                >
                  <h3 className="text-white text-lg mb-2 flex items-center">
                    <FileText size={16} className="text-matrix-amber mr-2" />
                    {page.title}
                  </h3>
                  {page.page_type && (
                    <p className="text-matrix-amber text-sm">
                      Type: {page.page_type}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6">
              <p className="text-white opacity-70 mb-4">No pages found in this chapter.</p>
              <button 
                className="px-4 py-2 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded flex items-center"
                onClick={() => {
                  if (selectedId && window.electronAPI) {
                    // Call a function passed from parent to create a new page
                    // This would need to be added to props
                  }
                }}
              >
                <PlusIcon size={16} className="mr-1" />
                Create a page
              </button>
            </div>
          )}
        </>
      )}

      {contentData?.type === 'page' && (
        <div className="h-full">
          <PageEditor 
            pageId={contentData.pageId} 
            onStatsChange={onEditorStatsChange}
          />
        </div>
      )}
    </div>
  )
}

export default ContentContainer 