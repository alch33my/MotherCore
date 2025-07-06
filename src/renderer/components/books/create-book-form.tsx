import React from 'react'
import { useState } from 'react'
import { SaveIcon, XIcon, BookOpen } from 'lucide-react'

interface CreateBookFormProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

function CreateBookForm({ projectId, onClose, onSuccess }: CreateBookFormProps) {
  const [bookName, setBookName] = useState('')
  const [bookDesc, setBookDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bookName.trim()) {
      setError('Book name is required')
      return
    }
    
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    try {
      setIsSubmitting(true)
      const result = await window.electronAPI.createBook({
        project_id: projectId,
        name: bookName.trim(),
        description: bookDesc.trim() || null,
        position: 0 // Default position at start
      })
      
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to create book')
      }
    } catch (err) {
      console.error('Failed to create book:', err)
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
              <BookOpen size={24} className="text-matrix-green" />
            </div>
            <h2 className="text-2xl font-bold text-matrix-gold">New Book</h2>
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
            <label htmlFor="bookName" className="form-label">
              Name <span className="text-matrix-error">*</span>
            </label>
            <input
              id="bookName"
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="Book name"
              className="form-input"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="bookDesc" className="form-label">
              Description
            </label>
            <textarea
              id="bookDesc"
              value={bookDesc}
              onChange={(e) => setBookDesc(e.target.value)}
              placeholder="Brief description (optional)"
              rows={3}
              className="form-input"
            />
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
                  Create Book
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBookForm 
