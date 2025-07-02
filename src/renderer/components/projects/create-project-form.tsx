import React, { useState } from 'react'
import { SaveIcon, XIcon } from 'lucide-react'

interface CreateProjectFormProps {
  organizationId: string
  onClose: () => void
  onSuccess: () => void
}

function CreateProjectForm({ organizationId, onClose, onSuccess }: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectColor, setProjectColor] = useState('#ffb000') // Default amber color
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
        description: projectDesc.trim() || null,
        color: projectColor
      }
      
      console.log('Submitting project form data:', formData)
      console.log('Organization ID:', organizationId)
      
      const result = await window.electronAPI.createProject(formData)
      
      console.log('Create project result:', result)
      
      if (result.success) {
        console.log('Project created successfully with ID:', result.id)
        onSuccess()
        onClose()
      } else {
        console.error('Failed to create project:', result.error)
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
    <div className="bg-matrix-dark-gray p-6 rounded-lg border border-matrix-green shadow-lg w-96">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-matrix-gold">New Project</h2>
        <button 
          onClick={onClose}
          className="text-matrix-amber hover:text-matrix-gold transition-colors"
        >
          <XIcon size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="projectName" className="block text-sm text-matrix-amber mb-1">
            Name <span className="text-matrix-error">*</span>
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            className="w-full bg-matrix-black border border-matrix-green p-2 rounded text-matrix-green focus:border-matrix-gold focus:outline-none"
          />
        </div>
        
        <div>
          <label htmlFor="projectDesc" className="block text-sm text-matrix-amber mb-1">
            Description
          </label>
          <textarea
            id="projectDesc"
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            placeholder="Brief description (optional)"
            rows={3}
            className="w-full bg-matrix-black border border-matrix-green p-2 rounded text-matrix-green focus:border-matrix-gold focus:outline-none"
          />
        </div>
        
        <div>
          <label htmlFor="projectColor" className="block text-sm text-matrix-amber mb-1">
            Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="projectColor"
              type="color"
              value={projectColor}
              onChange={(e) => setProjectColor(e.target.value)}
              className="bg-matrix-black border border-matrix-green p-1 h-8 w-12 cursor-pointer"
            />
            <span className="text-matrix-green">{projectColor}</span>
          </div>
        </div>
        
        {error && (
          <div className="text-matrix-error text-sm">{error}</div>
        )}
        
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 px-4 py-2 text-matrix-green hover:text-matrix-gold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-matrix-green bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded"
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

export default CreateProjectForm 