import React from 'react'
import { useState } from 'react'
import { SaveIcon, XIcon, File } from 'lucide-react'

interface CreatePageFormProps {
  chapterId: string
  onClose: () => void
  onSuccess: () => void
}

function CreatePageForm({ chapterId, onClose, onSuccess }: CreatePageFormProps) {
  const [pageTitle, setPageTitle] = useState('')
  const [pageType, setPageType] = useState('note')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pageTitle.trim()) {
      setError('Page title is required')
      return
    }
    
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      
      const result = await window.electronAPI.createPage({
        chapter_id: chapterId,
        title: pageTitle.trim(),
        page_type: pageType,
        content: '',
        content_text: ''
      })
      
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to create page')
      }
    } catch (err) {
      console.error('Failed to create page:', err)
      setError('An unexpected error occurred')
      window.electronAPI?.logError(String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-matrix-green bg-opacity-10 flex items-center justify-center">
              <File size={24} className="text-matrix-green" />
            </div>
            <h2 className="text-2xl font-bold text-matrix-gold">New Page</h2>
          </div>
          
          <button 
            onClick={onClose}
            className="text-matrix-amber hover:text-matrix-gold transition-colors rounded-full hover:bg-matrix-gold/10 p-1"
            disabled={isSubmitting}
          >
            <XIcon size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="pageTitle" className="form-label">
              Title <span className="text-matrix-error">*</span>
            </label>
            <input
              id="pageTitle"
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Page title"
              className="form-input"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="pageType" className="form-label">
              Page Type
            </label>
            <select
              id="pageType"
              value={pageType}
              onChange={(e) => setPageType(e.target.value)}
              className="form-input"
            >
              <option value="note">Note</option>
              <option value="document">Document</option>
              <option value="code">Code</option>
              <option value="diagram">Diagram</option>
            </select>
          </div>
          
          {error && (
            <div className="text-matrix-error text-sm bg-matrix-error bg-opacity-10 p-3 rounded-lg border border-matrix-error border-opacity-30 flex items-center gap-2">
              <XIcon size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-buttons">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              <XIcon size={16} className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <SaveIcon size={16} className="mr-2" />
                  Create Page
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePageForm 
