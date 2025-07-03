import React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Save, AlertCircle, CheckCircle, FileText, Calendar, Clock, Hash, Settings, Download } from 'lucide-react'

interface PageEditorProps {
  pageId: string
  initialContent?: string
  onStatsChange?: (stats: { words: number, characters: number }) => void
  onSave?: (content: string) => Promise<void>
  isSaving?: boolean
  saveStatus?: 'idle' | 'saved' | 'error'
  saveMessage?: string
  wordCount?: number
  charCount?: number
}

function PageEditor({ 
  pageId, 
  initialContent = '', 
  onStatsChange, 
  onSave,
  isSaving: externalIsSaving,
  saveStatus: externalSaveStatus,
  // saveMessage is unused but kept for API compatibility
  wordCount: externalWordCount,
  charCount: externalCharCount
}: PageEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [internalIsSaving, setInternalIsSaving] = useState(false)
  const [internalSaveStatus, setInternalSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [internalWordCount, setInternalWordCount] = useState(0)
  const [internalCharCount, setInternalCharCount] = useState(0)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  
  // Use external props if provided, otherwise use internal state
  const isSaving = externalIsSaving !== undefined ? externalIsSaving : internalIsSaving
  const saveStatus = externalSaveStatus !== undefined ? externalSaveStatus : internalSaveStatus
  const wordCount = externalWordCount !== undefined ? externalWordCount : internalWordCount
  const charCount = externalCharCount !== undefined ? externalCharCount : internalCharCount
  
  // Save content with debounce
  const savePageContent = useCallback(async () => {
    // If external onSave is provided, use it
    if (onSave) {
      try {
        await onSave(content)
        setIsDirty(false)
        setLastSaved(new Date())
        return true
      } catch (err) {
        console.error('Failed to save via external handler:', err)
        setError('Failed to save content')
        return false
      }
    }
    
    // Otherwise use internal save logic
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return false
    }
    
    if (!isDirty) {
      return true // No changes to save
    }

    try {
      setInternalIsSaving(true)
      setInternalSaveStatus('saving')
      
      const result = await window.electronAPI.updatePageContent(
        pageId,
        content,
        content // Using the same content for both rich and plain text for now
      )
      
      if (result.success) {
        setInternalSaveStatus('saved')
        setIsDirty(false)
        setLastSaved(new Date())
        setTimeout(() => setInternalSaveStatus('idle'), 2000)
        return true
      } else {
        setInternalSaveStatus('error')
        setError(result.error || 'Failed to save content')
        return false
      }
    } catch (err) {
      console.error('Failed to save page content:', err)
      setInternalSaveStatus('error')
      setError('Failed to save content')
      window.electronAPI?.logError(String(err))
      return false
    } finally {
      setInternalIsSaving(false)
    }
  }, [pageId, content, isDirty, onSave])
  
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
    
    // Only update internal counts if external counts are not provided
    if (externalWordCount === undefined) {
      setInternalWordCount(words)
    }
    if (externalCharCount === undefined) {
      setInternalCharCount(chars)
    }
    
    if (onStatsChange) {
      onStatsChange({ words, characters: chars })
    }
    
    // Mark as dirty only if content changed from initial state
    if (content !== initialContent) {
      setIsDirty(true)
    }
  }, [content, onStatsChange, initialContent, externalWordCount, externalCharCount])

  async function loadPageContent() {
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }

    try {
      setInternalSaveStatus('idle')
      const result = await window.electronAPI.getPage(pageId)
      if (result.success && result.page?.content) {
        setContent(result.page.content)
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
  
  const toggleInfoPanel = () => {
    setShowInfoPanel(!showInfoPanel)
  }

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }

  return (
    <div className="flex h-full">
      {/* Main Editor Area */}
      <div className="flex flex-col flex-grow h-full">
        {/* Editor Toolbar */}
        <div className="bg-matrix-black bg-opacity-90 border-b border-matrix-gold/30 backdrop-blur-sm flex justify-between items-center p-3 sticky top-0 z-10">
          <div className="flex items-center">
            <FileText size={16} className="mr-2 text-matrix-gold" />
            <span className="text-matrix-gold font-medium">Editor</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-matrix-amber text-xs mr-4 flex items-center space-x-3">
              <div className="flex items-center">
                <Hash size={14} className="mr-1" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                <span>{charCount} chars</span>
              </div>
              {lastSaved && (
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  <span>Saved: {formatLastSaved()}</span>
                </div>
              )}
            </div>
            
            {saveStatus === 'saved' && (
              <span className="text-matrix-success text-xs flex items-center px-2 py-1 bg-matrix-success/10 rounded-md">
                <CheckCircle size={14} className="mr-1" /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-matrix-error text-xs flex items-center px-2 py-1 bg-matrix-error/10 rounded-md">
                <AlertCircle size={14} className="mr-1" /> {error || 'Error saving'}
              </span>
            )}
            <div className="flex items-center space-x-1">
              <button
                onClick={savePageContent}
                disabled={isSaving || !isDirty}
                className={`flex items-center px-2 py-1 rounded ${
                  isDirty 
                    ? "bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold"
                    : "bg-matrix-dark-gray bg-opacity-50 text-matrix-amber text-opacity-50"
                }`}
                title="Save content (Ctrl+S)"
              >
                <Save size={14} className="mr-1" />
                {isSaving ? 'Saving...' : isDirty ? 'Save' : 'Saved'}
              </button>
              
              <button
                onClick={toggleInfoPanel}
                className="flex items-center px-2 py-1 rounded hover:bg-matrix-gold/10"
                title="Toggle info panel"
              >
                <Settings size={14} className={showInfoPanel ? "text-matrix-gold" : "text-matrix-amber"} />
              </button>
              
              <button
                className="flex items-center px-2 py-1 rounded hover:bg-matrix-gold/10 text-matrix-amber"
                title="Export content"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Editor Content */}
        <div 
          className="flex-1 p-0 bg-matrix-black/70 overflow-auto"
          onClick={focusEditor}
        >
          <div className="h-full flex">
            <div className="h-full w-full flex flex-col">
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full bg-matrix-black/60 text-white p-6 resize-none focus:outline-none font-mono leading-relaxed text-lg"
                placeholder="Start writing your content here..."
                style={{ minHeight: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Info Side Panel */}
      {showInfoPanel && (
        <div className="w-64 border-l border-matrix-gold/30 bg-matrix-black/70 h-full overflow-y-auto">
          <div className="p-4">
            <h3 className="text-matrix-gold font-medium border-b border-matrix-gold/30 pb-2 mb-3">
              Document Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase text-matrix-amber/70 mb-1 font-medium">Statistics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-matrix-amber">Words:</span>
                    <span className="text-white">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-amber">Characters:</span>
                    <span className="text-white">{charCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-amber">Lines:</span>
                    <span className="text-white">{content.split('\n').length}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs uppercase text-matrix-amber/70 mb-1 font-medium">Page Info</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-matrix-amber">Last Saved:</span>
                    <span className="text-white">{lastSaved?.toLocaleString() || 'Never'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-amber">ID:</span>
                    <span className="text-white text-xs font-mono">{pageId.substring(0, 8)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs uppercase text-matrix-amber/70 mb-1 font-medium">Actions</h4>
                <div className="space-y-2">
                  <button 
                    className="w-full py-1.5 px-3 bg-matrix-gold/10 hover:bg-matrix-gold/20 text-matrix-gold text-sm rounded flex items-center justify-center"
                    onClick={savePageContent}
                    disabled={isSaving || !isDirty}
                  >
                    <Save size={14} className="mr-2" />
                    Save Changes
                  </button>
                  
                  <button className="w-full py-1.5 px-3 bg-matrix-amber/10 hover:bg-matrix-amber/20 text-matrix-amber text-sm rounded flex items-center justify-center">
                    <Download size={14} className="mr-2" />
                    Export Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PageEditor 
