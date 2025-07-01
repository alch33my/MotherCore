import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

interface PageEditorProps {
  pageId: string
  initialContent?: string
  onStatsChange?: (stats: { words: number, characters: number }) => void
}

function PageEditor({ pageId, initialContent = '', onStatsChange }: PageEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    loadPageContent()
  }, [pageId])
  
  // Calculate word and character count when content changes
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const chars = content.length
    
    setWordCount(words)
    setCharCount(chars)
    
    if (onStatsChange) {
      onStatsChange({ words, characters: chars })
    }
  }, [content, onStatsChange])

  async function loadPageContent() {
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }

    try {
      const result = await window.electronAPI.getPageContent(pageId)
      if (result.success && result.content) {
        setContent(result.content)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      console.error('Failed to load page content:', err)
      setError('Failed to load page content')
      window.electronAPI?.logError(String(err))
    }
  }

  async function savePageContent() {
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }

    try {
      setIsSaving(true)
      setSaveStatus('saving')
      
      const result = await window.electronAPI.updatePageContent(
        pageId,
        content,
        content // Using the same content for both rich and plain text for now
      )
      
      if (result.success) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setError(result.error || 'Failed to save content')
      }
    } catch (err) {
      console.error('Failed to save page content:', err)
      setSaveStatus('error')
      setError('Failed to save content')
      window.electronAPI?.logError(String(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-matrix-gold border-opacity-30">
        <h2 className="text-white text-lg">Editor</h2>
        <div className="flex items-center">
          <div className="text-matrix-amber text-sm mr-4">
            <span>{wordCount} words</span>
            <span className="mx-2">|</span>
            <span>{charCount} characters</span>
          </div>
          {saveStatus === 'saved' && (
            <span className="text-matrix-success text-sm mr-2">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-matrix-error text-sm mr-2">{error || 'Error saving'}</span>
          )}
          <button
            onClick={savePageContent}
            disabled={isSaving}
            className="flex items-center px-3 py-1 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded"
          >
            <Save size={16} className="mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-matrix-black border border-matrix-gold border-opacity-30 rounded p-4 text-white resize-none focus:outline-none focus:border-matrix-gold"
          placeholder="Start writing your content here..."
        />
      </div>
    </div>
  )
}

export default PageEditor 