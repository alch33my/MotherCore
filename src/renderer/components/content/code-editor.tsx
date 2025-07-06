import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Save, Copy, Download, FileCode, AlertCircle, CheckCircle } from 'lucide-react'

interface CodeEditorProps {
  pageId: string
  language?: string
  onSave?: (content: string) => Promise<void>
}

function CodeEditor({ pageId, language = 'javascript', onSave }: CodeEditorProps) {
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Load code content when component mounts or pageId changes
  useEffect(() => {
    loadCodeContent()
  }, [pageId])
  
  const loadCodeContent = async () => {
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    try {
      const result = await window.electronAPI.getPage(pageId)
      if (result.success && result.page) {
        setContent(result.page.content || '// Write your code here')
        setIsDirty(false)
        
        // Try to detect language from page metadata
        if (result.page.metadata?.language) {
          // language = result.page.metadata.language
          console.log(`Detected language: ${result.page.metadata.language}`)
        }
      } else {
        setError(result.error || 'Failed to load code content')
      }
    } catch (err) {
      console.error('Failed to load code content:', err)
      setError('Failed to load code content')
      window.electronAPI?.logError(String(err))
    }
  }
  
  const saveCodeContent = async () => {
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    if (!isDirty) return
    
    try {
      setIsSaving(true)
      
      // If external onSave is provided, use it
      if (onSave) {
        await onSave(content)
        setIsDirty(false)
        setLastSaved(new Date())
        return
      }
      
      // Otherwise use internal save logic
      // Add language info as a comment at the top of the file for metadata
      const contentWithMetadata = `// language: ${language}\n${content}`
      
      const result = await window.electronAPI.updatePageContent(
        pageId,
        contentWithMetadata, // Rich content
        content // Plain text content
      )
      
      if (result.success) {
        setIsDirty(false)
        setLastSaved(new Date())
        setError(null)
      } else {
        setError(result.error || 'Failed to save code')
      }
    } catch (err) {
      console.error('Failed to save code:', err)
      setError('Failed to save code')
      window.electronAPI?.logError(String(err))
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setIsDirty(true)
  }
  
  // Auto-save feature
  useEffect(() => {
    if (!isDirty) return
    
    const timer = setTimeout(() => {
      saveCodeContent()
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [content, isDirty])
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveCodeContent()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
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
    <div className="code-editor-container h-full w-full flex flex-col bg-surface overflow-hidden">
      {/* Editor Toolbar */}
      <div className="editor-toolbar flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <FileCode className="w-4 h-4 text-primary/70" />
            <span className="text-text-secondary">{language}</span>
          </div>
          {lastSaved && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-text-secondary">
                Saved {formatLastSaved()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {error && (
            <div className="flex items-center text-error text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
          {!error && !isSaving && lastSaved && (
            <div className="flex items-center text-success text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Saved
            </div>
          )}
          <button
            onClick={saveCodeContent}
            disabled={isSaving || !isDirty}
            className="p-1.5 hover:bg-primary/10 rounded transition-colors flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4 text-primary/70 mr-1" />
            <span className="text-text-secondary">
              {isSaving ? 'Saving...' : 'Save'}
            </span>
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="p-1.5 hover:bg-primary/10 rounded transition-colors flex items-center text-sm"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4 text-primary/70 mr-1" />
            <span className="text-text-secondary">Copy</span>
          </button>
          <button
            onClick={() => {
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `code.${language}`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-1.5 hover:bg-primary/10 rounded transition-colors flex items-center text-sm"
            title="Export file"
          >
            <Download className="w-4 h-4 text-primary/70 mr-1" />
            <span className="text-text-secondary">Export</span>
          </button>
        </div>
      </div>
      
      {/* Main Editor Area */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-full p-6 bg-surface text-text resize-none outline-none font-mono leading-relaxed"
          spellCheck="false"
          wrap="off"
          autoFocus
        />
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-surface">
        <div className="text-text-secondary text-sm">
          {language}
        </div>
        <div className="text-text-secondary text-sm">
          {content.split('\n').length} lines
        </div>
      </div>
    </div>
  )
}

export default CodeEditor 