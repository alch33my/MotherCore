import React from 'react'
import { useState } from 'react'
import { SaveIcon, XIcon, Folder } from 'lucide-react'

interface CreateProjectFormProps {
  organizationId: string
  onClose: () => void
  onSuccess: () => void
}

function CreateProjectForm({ organizationId, onClose, onSuccess }: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }
    
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const formData = {
        organization_id: organizationId,
        name: projectName.trim(),
        description: projectDesc.trim() || null
      }
      
      const result = await window.electronAPI.createProject(formData)
      
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Failed to create project')
      }
    } catch (err) {
      console.error('Failed to create project:', err)
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
            <div className="w-10 h-10 rounded-lg bg-matrix-amber bg-opacity-10 flex items-center justify-center">
              <Folder size={24} className="text-matrix-amber" />
            </div>
            <h2 className="text-2xl font-bold text-matrix-gold">New Project</h2>
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
            <label htmlFor="projectName" className="form-label">
              Name <span className="text-matrix-error">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="form-input"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="projectDesc" className="form-label">
              Description
            </label>
            <textarea
              id="projectDesc"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
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
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProjectForm 

