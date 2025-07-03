import React from 'react'
import { useState, useEffect } from 'react'
import { PlusIcon, RefreshCwIcon, BookIcon, FileIcon, FileTextIcon, LayoutGrid } from 'lucide-react'
import PageEditor from './page-editor'

// Import the ContentType from App.tsx or define it here


interface ContentContainerProps {
  selectedType: string
  selectedId: string | null
  setSelectedType: (type: string) => void
  setSelectedId: (id: string | null) => void
  onEditorStatsChange?: (stats: { words: number, characters: number }) => void
  onCreatePage?: (chapterId: string) => void
  onRefreshContent?: () => void
}

interface ContentData {
  type: string
  id: string
  pageId?: string
  title?: string
  content?: any
  items?: any[]
}

function ContentContainer({ 
  selectedType, 
  selectedId, 
  setSelectedType, 
  setSelectedId, 
  onEditorStatsChange,
  onCreatePage,
  onRefreshContent
}: ContentContainerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contentData, setContentData] = useState<ContentData | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (selectedId && selectedType) {
      loadContent()
    } else {
      setContentData(null)
    }
  }, [selectedId, selectedType, refreshKey])

  async function refreshContent() {
    setRefreshKey(prev => prev + 1)
    if (onRefreshContent) {
      onRefreshContent()
    }
  }

  async function loadContent() {
    if (!window.electronAPI || !selectedId) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Load content based on selectedType
      switch (selectedType) {
        case 'page': {
          const result = await window.electronAPI.getPage(selectedId)
          if (result.success) {
            setContentData({
              type: 'page',
              id: selectedId,
              pageId: selectedId,
              content: result.page?.content
            })
          } else {
            setError(result.error || 'Failed to load page content')
          }
          break
        }
        case 'chapter': {
          const result = await window.electronAPI.getPages(selectedId)
          if (result.success) {
            setContentData({
              type: 'chapter',
              id: selectedId,
              items: result.pages || []
            })
          } else {
            setError(result.error || 'Failed to load pages')
          }
          break
        }
        case 'book': {
          const result = await window.electronAPI.getChapters(selectedId)
          if (result.success) {
            setContentData({
              type: 'book',
              id: selectedId,
              items: result.chapters || []
            })
          } else {
            setError(result.error || 'Failed to load chapters')
          }
          break
        }
        // Add more cases for other content types if needed
      }
    } catch (err) {
      console.error('Failed to load content:', err)
      setError('Failed to load content')
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePage = () => {
    if (onCreatePage && selectedId && selectedType === 'chapter') {
      onCreatePage(selectedId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-matrix-black bg-opacity-90 text-matrix-amber p-8">
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-matrix-gold opacity-20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-matrix-gold animate-spin"></div>
          </div>
          <p className="mt-4 text-matrix-gold">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full bg-matrix-black bg-opacity-90 text-matrix-amber p-8 flex items-center justify-center">
        <div className="bg-matrix-error bg-opacity-5 border border-matrix-error border-opacity-30 rounded-lg p-8 flex flex-col items-center max-w-md">
          <div className="text-matrix-error text-xl mb-4 font-bold">Error Loading Content</div>
          <p className="text-matrix-error mb-6 text-center">{error}</p>
          <button 
            className="px-6 py-3 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded-lg flex items-center transition-colors"
            onClick={refreshContent}
          >
            <RefreshCwIcon size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  // For page content, render the full page editor
  if (contentData?.type === 'page') {
    return (
      <div className="w-full h-full">
        <PageEditor 
          pageId={contentData.pageId!} 
          onStatsChange={onEditorStatsChange}
        />
      </div>
    )
  }

  // For other content types (like chapters, books), show a grid view
  return (
    <div className="w-full h-full bg-matrix-black bg-opacity-90 overflow-auto">
      {/* Header for content collections */}
      <div className="flex justify-between items-center p-4 border-b border-matrix-gold/30 sticky top-0 z-10 backdrop-blur-md bg-matrix-black/90">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-matrix-gold/10 flex items-center justify-center mr-3">
            {selectedType === 'chapter' ? (
              <FileIcon size={18} className="text-matrix-gold" />
            ) : (
              <BookIcon size={18} className="text-matrix-gold" />
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-matrix-gold">
              {selectedType === 'chapter' ? 'Pages' : 
              selectedType === 'book' ? 'Chapters' : 'Content'}
            </h2>
            {contentData && contentData.title && (
              <p className="text-matrix-amber text-sm">{contentData.title}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedType === 'chapter' && (
            <button 
              className="px-4 py-2 bg-matrix-gold/20 hover:bg-matrix-gold/30 text-matrix-gold rounded-lg flex items-center transition-colors"
              onClick={handleCreatePage}
            >
              <PlusIcon size={16} className="mr-2" />
              New Page
            </button>
          )}
          <button
            className="px-4 py-2 bg-matrix-amber/10 hover:bg-matrix-amber/20 text-matrix-amber rounded-lg flex items-center transition-colors"
            onClick={refreshContent}
          >
            <RefreshCwIcon size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Grid layout for items */}
      {contentData?.type === 'chapter' && (
        <div className="p-6">
          <div className="flex items-center mb-4">
            <LayoutGrid size={16} className="text-matrix-amber mr-2" />
            <h3 className="text-matrix-amber text-sm font-medium">
              {contentData.items?.length || 0} {contentData.items?.length === 1 ? 'Page' : 'Pages'}
            </h3>
          </div>
          
          {contentData.items && contentData.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {contentData.items.map((page) => (
                <div
                  key={page.id}
                  className="group bg-matrix-black/70 border border-matrix-gold/20 hover:border-matrix-gold/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-matrix-gold/5 hover:-translate-y-0.5"
                  onClick={() => {
                    setSelectedType('page')
                    setSelectedId(page.id)
                  }}
                >
                  <div className="p-4 border-b border-matrix-gold/10 flex items-center">
                    <FileTextIcon size={16} className="text-matrix-gold mr-2 flex-shrink-0" />
                    <h3 className="text-matrix-gold font-medium truncate">{page.title}</h3>
                  </div>
                  
                  <div className="px-4 py-3 text-xs">
                    <div className="flex justify-between text-matrix-amber opacity-70">
                      <span>{page.page_type || 'note'}</span>
                      <span className="font-mono">
                        {new Date(page.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add New Page Card */}
              <div
                className="group bg-matrix-black/40 border border-dashed border-matrix-gold/20 hover:border-matrix-gold/50 rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-6 hover:bg-matrix-gold/5"
                onClick={handleCreatePage}
              >
                <div className="w-12 h-12 rounded-full bg-matrix-gold/10 group-hover:bg-matrix-gold/20 flex items-center justify-center mb-3">
                  <PlusIcon size={20} className="text-matrix-gold" />
                </div>
                <span className="text-matrix-gold text-sm font-medium">New Page</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-matrix-black/20 rounded-lg border border-dashed border-matrix-gold/20">
              <FileTextIcon size={48} className="text-matrix-gold/30 mb-4" />
              <p className="text-white opacity-70 mb-4">No pages found in this chapter</p>
              <button 
                className="px-5 py-2.5 bg-matrix-gold/20 hover:bg-matrix-gold/30 text-matrix-gold rounded-lg flex items-center"
                onClick={handleCreatePage}
              >
                <PlusIcon size={16} className="mr-2" />
                Create a page
              </button>
            </div>
          )}
        </div>
      )}

      {/* Similar layout for book chapters */}
      {contentData?.type === 'book' && (
        <div className="p-6">
          <div className="flex items-center mb-4">
            <LayoutGrid size={16} className="text-matrix-amber mr-2" />
            <h3 className="text-matrix-amber text-sm font-medium">
              {contentData.items?.length || 0} {contentData.items?.length === 1 ? 'Chapter' : 'Chapters'}
            </h3>
          </div>
          
          {contentData.items && contentData.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {contentData.items.map((chapter) => (
                <div
                  key={chapter.id}
                  className="group bg-matrix-black/70 border border-matrix-gold/20 hover:border-matrix-gold/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-matrix-gold/5 hover:-translate-y-0.5"
                  onClick={() => {
                    setSelectedType('chapter')
                    setSelectedId(chapter.id)
                  }}
                >
                  <div className="p-4 border-b border-matrix-gold/10 flex items-center">
                    <FileIcon size={16} className="text-matrix-gold mr-2 flex-shrink-0" />
                    <h3 className="text-matrix-gold font-medium truncate">{chapter.name}</h3>
                  </div>
                  
                  <div className="px-4 py-3 text-xs">
                    <div className="flex justify-between text-matrix-amber opacity-70">
                      <span>Chapter</span>
                      <span className="font-mono">
                        {new Date(chapter.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-matrix-black/20 rounded-lg border border-dashed border-matrix-gold/20">
              <BookIcon size={48} className="text-matrix-gold/30 mb-4" />
              <p className="text-white opacity-70 mb-4">No chapters found in this book</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ContentContainer 
