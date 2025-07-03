import React, { useState, useEffect } from 'react'
import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import PageEditor from './page-editor'

// Import the ContentType from App.tsx or define it here
type ContentType = 'organization' | 'project' | 'book' | 'chapter' | 'page' | null

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
          const result = await window.electronAPI.getPageContent(selectedId)
          if (result.success) {
            setContentData({
              type: 'page',
              id: selectedId,
              pageId: selectedId,
              content: result.content
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
      <div className="flex items-center justify-center w-full h-full bg-matrix-black bg-opacity-60 text-matrix-amber p-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-matrix-gold mb-4"></div>
          <p>Loading content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full bg-matrix-black bg-opacity-60 text-matrix-amber p-8">
        <div className="bg-matrix-error bg-opacity-10 border border-matrix-error border-opacity-30 rounded-lg p-6 flex flex-col items-center">
          <div className="text-matrix-error text-xl mb-4">Error Loading Content</div>
          <p className="text-matrix-error mb-6">{error}</p>
          <button 
            className="px-4 py-2 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded flex items-center"
            onClick={refreshContent}
          >
            <RefreshCwIcon size={16} className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-matrix-black bg-opacity-60 overflow-auto">
      <div className="flex justify-between items-center p-4 border-b border-matrix-gold border-opacity-30 bg-matrix-black bg-opacity-60">
        <div>
          <h2 className="text-white text-lg">
            {selectedType === 'page' ? 'Page Content' : 
             selectedType === 'chapter' ? 'Pages' : 
             selectedType === 'book' ? 'Chapters' : 'Content'}
          </h2>
          {contentData && contentData.title && (
            <p className="text-matrix-amber text-sm">{contentData.title}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedType === 'chapter' && (
            <button 
              className="px-3 py-1 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded flex items-center"
              onClick={handleCreatePage}
            >
              <PlusIcon size={16} className="mr-1" />
              New Page
            </button>
          )}
          <button
            className="px-3 py-1 bg-matrix-amber bg-opacity-20 hover:bg-opacity-30 text-matrix-amber rounded flex items-center"
            onClick={refreshContent}
          >
            <RefreshCwIcon size={16} className="mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {contentData?.type === 'chapter' && (
        <>
          {contentData.items && contentData.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {contentData.items.map((page) => (
                <div
                  key={page.id}
                  className="bg-matrix-black bg-opacity-70 border border-matrix-gold border-opacity-20 hover:border-opacity-40 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-1"
                  onClick={() => {
                    setSelectedType('page')
                    setSelectedId(page.id)
                  }}
                >
                  <h3 className="text-matrix-gold text-lg mb-2">{page.title}</h3>
                  <div className="flex justify-between text-xs text-matrix-amber opacity-70">
                    <span>Type: {page.page_type || 'note'}</span>
                    <span>
                      {new Date(page.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6">
              <p className="text-white opacity-70 mb-4">No pages found in this chapter.</p>
              <button 
                className="px-4 py-2 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded flex items-center"
                onClick={handleCreatePage}
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
            pageId={contentData.pageId!} 
            onStatsChange={onEditorStatsChange}
          />
        </div>
      )}
    </div>
  )
}

export default ContentContainer 