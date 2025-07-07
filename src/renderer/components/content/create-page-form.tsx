import React from 'react'
import { useState } from 'react'
import { SaveIcon, XIcon, File, Image } from 'lucide-react'

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
  const [imageFile, setImageFile] = useState<File | null>(null)
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
    setImageFile(file)
    if (!pageTitle) {
      setPageTitle(file.name.split('.')[0]) // Use filename as default title
    }
  }

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
      
      let content = ''
      let contentText = ''
      let metadata = null
      
      // Handle image file if present
      if (pageType === 'image' && imageFile) {
        const reader = new FileReader()
        const base64Content = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(imageFile)
        })
        
        metadata = {
          mimeType: imageFile.type,
          originalFileName: imageFile.name,
          fileSize: imageFile.size,
          lastModified: new Date(imageFile.lastModified).toISOString()
        }
        
        // Store content and metadata together
        content = JSON.stringify({
          content: base64Content,
          metadata
        })
        contentText = `Image: ${imageFile.name}`
      }
      
      const result = await window.electronAPI.createPage({
        chapter_id: chapterId,
        title: pageTitle.trim(),
        page_type: pageType,
        content,
        content_text: contentText,
        metadata
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

  const getAcceptTypes = (type: string) => {
    switch (type) {
      case 'image':
        return 'image/*';
      case 'pdf':
        return '.pdf';
      case 'audio':
        return 'audio/*';
      case 'video':
        return 'video/*';
      case 'spreadsheet':
        return '.csv,.xlsx,.xls';
      default:
        return '*/*';
    }
  };

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
              <option value="code">Code</option>
              <option value="image">Image</option>
              <option value="pdf">PDF Document</option>
              <option value="spreadsheet">Spreadsheet</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
              <option value="diagram">Diagram</option>
            </select>
          </div>
          
          {(pageType === 'image' || pageType === 'pdf' || pageType === 'audio' || pageType === 'video' || pageType === 'spreadsheet') && (
            <div>
              <label htmlFor="file" className="form-label">
                File
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="file"
                  type="file"
                  accept={getAcceptTypes(pageType)}
                  onChange={handleFileSelect}
                  className="form-input"
                />
                {imageFile && (
                  <div className="text-sm text-matrix-amber">
                    Selected: {imageFile.name}
                  </div>
                )}
              </div>
            </div>
          )}
          
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
