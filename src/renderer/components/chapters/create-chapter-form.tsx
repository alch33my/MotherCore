import React from 'react'
import { useState } from 'react'
import { SaveIcon, XIcon, FileText } from 'lucide-react'

interface CreateChapterFormProps {
  bookId: string
  onClose: () => void
  onSuccess: () => void
}

function CreateChapterForm({ bookId, onClose, onSuccess }: CreateChapterFormProps) {
  const [chapterName, setChapterName] = useState('')
  const [position, setPosition] = useState<number | string>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!chapterName.trim()) {
      setError('Chapter name is required')
      return
    }

    // Ensure position is a valid number
    const positionNum = position === '' ? 0 : Number(position)
    if (isNaN(positionNum)) {
      setError('Position must be a valid number')
      return
    }
    
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    try {
      setIsSubmitting(true)
      const result = await window.electronAPI.createChapter({
        book_id: bookId,
        name: chapterName.trim(),
        position: positionNum
      })
      
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to create chapter')
      }
    } catch (err) {
      console.error('Failed to create chapter:', err)
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
            <div className="w-10 h-10 rounded-lg bg-matrix-blue bg-opacity-10 flex items-center justify-center">
              <FileText size={24} className="text-matrix-blue" />
            </div>
            <h2 className="text-2xl font-bold text-matrix-gold">New Chapter</h2>
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
            <label htmlFor="chapterName" className="form-label">
              Name <span className="text-matrix-error">*</span>
            </label>
            <input
              id="chapterName"
              type="text"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              placeholder="Chapter name"
              className="form-input"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="position" className="form-label">
              Position
            </label>
            <input
              id="position"
              type="number"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="0"
              min="0"
              className="form-input"
            />
            <p className="text-matrix-green text-xs mt-1 opacity-70">
              The order this chapter appears in the book (0 = first)
            </p>
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
                  Create Chapter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateChapterForm 

