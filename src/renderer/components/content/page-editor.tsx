import { useState, useEffect, useCallback } from 'react'
import { Save, AlertCircle, CheckCircle } from 'lucide-react'

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
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Save content with debounce
  const savePageContent = useCallback(async () => {
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return false
    }
    
    if (!isDirty) {
      return true // No changes to save
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
        setIsDirty(false)
        setLastSaved(new Date())
        setTimeout(() => setSaveStatus('idle'), 2000)
        return true
      } else {
        setSaveStatus('error')
        setError(result.error || 'Failed to save content')
        return false
      }
    } catch (err) {
      console.error('Failed to save page content:', err)
      setSaveStatus('error')
      setError('Failed to save content')
      window.electronAPI?.logError(String(err))
      return false
    } finally {
      setIsSaving(false)
    }
  }, [pageId, content, isDirty])
  
  // Auto-save feature - save content after 2 seconds of inactivity
  useEffect(() => {
    if (!isDirty) return
    
    const timer = setTimeout(() => {
      savePageContent()
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [content, isDirty, savePageContent])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        savePageContent()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [savePageContent])

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
    
    // Mark as dirty only if content changed from initial state
    if (content !== initialContent) {
      setIsDirty(true)
    }
  }, [content, onStatsChange, initialContent])

  async function loadPageContent() {
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }

    try {
      setSaveStatus('idle')
      const result = await window.electronAPI.getPageContent(pageId)
      if (result.success && result.content) {
        setContent(result.content)
        setIsDirty(false)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      console.error('Failed to load page content:', err)
      setError('Failed to load page content')
      window.electronAPI?.logError(String(err))
    }
  }

  const formatLastSaved = () => {
    if (!lastSaved) return ''
    
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000)
    
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    
    return lastSaved.toLocaleTimeString()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-matrix-gold border-opacity-30 bg-matrix-black bg-opacity-60">
        <h2 className="text-white text-lg">Editor</h2>
        <div className="flex items-center">
          <div className="text-matrix-amber text-sm mr-4">
            <span>{wordCount} words</span>
            <span className="mx-2">|</span>
            <span>{charCount} characters</span>
            {lastSaved && (
              <>
                <span className="mx-2">|</span>
                <span>Last saved: {formatLastSaved()}</span>
              </>
            )}
          </div>
          {saveStatus === 'saved' && (
            <span className="text-matrix-success text-sm mr-2 flex items-center">
              <CheckCircle size={14} className="mr-1" /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-matrix-error text-sm mr-2 flex items-center">
              <AlertCircle size={14} className="mr-1" /> {error || 'Error saving'}
            </span>
          )}
          <button
            onClick={savePageContent}
            disabled={isSaving || !isDirty}
            className={`flex items-center px-3 py-1 rounded ${
              isDirty 
                ? "bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold"
                : "bg-matrix-dark-gray bg-opacity-50 text-matrix-amber text-opacity-50"
            }`}
            title="Save content (Ctrl+S)"
          >
            <Save size={16} className="mr-1" />
            {isSaving ? 'Saving...' : isDirty ? 'Save' : 'Saved'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4 bg-matrix-black bg-opacity-70">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-matrix-black bg-opacity-60 border border-matrix-gold border-opacity-30 rounded p-4 text-white resize-none focus:outline-none focus:border-matrix-gold focus:border-opacity-60"
          placeholder="Start writing your content here..."
        />
      </div>
    </div>
  )
}

export default PageEditor 