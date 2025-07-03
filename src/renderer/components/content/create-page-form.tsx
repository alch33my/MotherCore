import React from 'react'
import { useState } from 'react'
import { SaveIcon, XIcon } from 'lucide-react'

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
    <div className="bg-matrix-dark-gray p-6 rounded-lg border border-matrix-gold shadow-matrix w-96">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-matrix-gold">New Page</h2>
        <button 
          onClick={onClose}
          className="text-matrix-amber hover:text-matrix-gold transition-colors"
          disabled={isSubmitting}
        >
          <XIcon size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pageTitle" className="block text-sm text-matrix-amber mb-1">
            Title <span className="text-matrix-error">*</span>
          </label>
          <input
            id="pageTitle"
            type="text"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            placeholder="Page title"
            className="w-full bg-matrix-black border border-matrix-gold p-2 rounded text-white focus:border-matrix-gold focus:outline-none"
          />
        </div>
        
        <div>
          <label htmlFor="pageType" className="block text-sm text-matrix-amber mb-1">
            Page Type
          </label>
          <select
            id="pageType"
            value={pageType}
            onChange={(e) => setPageType(e.target.value)}
            className="w-full bg-matrix-black border border-matrix-gold p-2 rounded text-white focus:border-matrix-gold focus:outline-none"
          >
            <option value="note">Note</option>
            <option value="document">Document</option>
            <option value="code">Code</option>
            <option value="diagram">Diagram</option>
          </select>
        </div>
        
        {error && (
          <div className="text-matrix-error text-sm bg-matrix-error bg-opacity-10 p-2 rounded border border-matrix-error border-opacity-30">
            {error}
          </div>
        )}
        
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 px-4 py-2 text-white hover:text-matrix-gold"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded"
          >
            {isSubmitting ? 'Creating...' : (
              <>
                <SaveIcon size={16} className="mr-1" />
                Create
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreatePageForm 
