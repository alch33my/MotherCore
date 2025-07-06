import React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertCircle, CheckCircle, FileText, Calendar, Clock, Hash, Settings, Download } from 'lucide-react'

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

  // Load page content function
  const loadPageContent = useCallback(async () => {
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
  }, [pageId])

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
    <div className="editor-container">
      <div className="editor-toolbar">
        <div className="editor-status">
          {isSaving && <Clock className="w-4 h-4 text-warning animate-spin" />}
          {saveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-success" />}
          {saveStatus === 'error' && <AlertCircle className="w-4 h-4 text-error" />}
          <span className="status-text">{saveStatus === 'error' ? 'Error saving changes' : saveStatus === 'saved' ? 'All changes saved' : ''}</span>
        </div>
        <div className="editor-stats">
          <span className="stat-item">
            <Hash className="w-4 h-4" />
            {wordCount} words
          </span>
          <span className="stat-item">
            <Calendar className="w-4 h-4" />
            {charCount} characters
          </span>
        </div>
      </div>
      <div className="editor-content">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="page-editor"
          placeholder="Start typing..."
          spellCheck="false"
        />
      </div>
    </div>
  );
}

export default PageEditor; 
