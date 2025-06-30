import { useState, useEffect } from 'react'
import { BookOpen, Folder, LayoutGrid } from 'lucide-react'

interface ContentContainerProps {
  selectedType?: 'organization' | 'project' | 'book' | 'chapter' | null
  selectedId?: string | null
}

function ContentContainer({ selectedType, selectedId }: ContentContainerProps) {
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
        <h2 className="text-3xl font-bold text-matrix-gold mb-6">Welcome to MotherCore</h2>
        
        <div className="bg-matrix-dark-gray border border-matrix-green border-opacity-50 p-6 rounded-lg">
          <h3 className="text-xl text-matrix-amber mb-4">Your Digital Knowledge Library</h3>
          <p className="text-matrix-green mb-4">
            Select an item from the navigation tree to view its contents, or create a new organization to get started.
          </p>
          
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="bg-matrix-black bg-opacity-50 p-4 rounded-lg border border-matrix-green border-opacity-30">
              <Folder className="text-matrix-amber mb-2" size={24} />
              <h4 className="text-matrix-gold mb-1">Organizations</h4>
              <p className="text-matrix-green text-sm">
                Create organizations to group related projects
              </p>
            </div>
            
            <div className="bg-matrix-black bg-opacity-50 p-4 rounded-lg border border-matrix-green border-opacity-30">
              <LayoutGrid className="text-matrix-amber mb-2" size={24} />
              <h4 className="text-matrix-gold mb-1">Projects</h4>
              <p className="text-matrix-green text-sm">
                Organize your work into specific projects
              </p>
            </div>
            
            <div className="bg-matrix-black bg-opacity-50 p-4 rounded-lg border border-matrix-green border-opacity-30">
              <BookOpen className="text-matrix-amber mb-2" size={24} />
              <h4 className="text-matrix-gold mb-1">Books & Chapters</h4>
              <p className="text-matrix-green text-sm">
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
        <p className="text-matrix-green">Loading content...</p>
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
          <h2 className="text-2xl font-bold text-matrix-gold mb-6">Projects</h2>
          
          {contentData.projects.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {contentData.projects.map((project: any) => (
                <div 
                  key={project.id}
                  className="bg-matrix-dark-gray p-4 rounded-lg border border-matrix-green border-opacity-30 hover:border-opacity-70 cursor-pointer"
                  style={{ borderLeftColor: project.color || '#ffb000', borderLeftWidth: '4px' }}
                >
                  <h3 className="text-matrix-amber text-lg mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-matrix-green text-sm">{project.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-matrix-green opacity-70">No projects found in this organization.</p>
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
          <h2 className="text-2xl font-bold text-matrix-gold mb-6">Pages</h2>
          
          {contentData.pages.length > 0 ? (
            <div className="bg-matrix-dark-gray rounded-lg border border-matrix-green border-opacity-30 overflow-hidden">
              {contentData.pages.map((page: any, index: number) => (
                <div 
                  key={page.id}
                  className={`p-4 hover:bg-matrix-black hover:bg-opacity-30 cursor-pointer ${
                    index !== contentData.pages.length - 1 ? 'border-b border-matrix-green border-opacity-20' : ''
                  }`}
                >
                  <h3 className="text-matrix-green">
                    <span className="text-matrix-amber mr-2">Page {index + 1}:</span>
                    {page.title}
                  </h3>
                  {page.page_type && page.page_type !== 'note' && (
                    <span className="text-xs bg-matrix-green bg-opacity-20 text-matrix-green px-2 py-0.5 rounded ml-2">
                      {page.page_type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-matrix-green opacity-70">No pages found in this chapter.</p>
          )}
        </>
      )}
    </div>
  )
}

export default ContentContainer 