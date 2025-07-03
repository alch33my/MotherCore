import React from 'react'
import { useState } from 'react'
import { SaveIcon, XIcon, CheckCircleIcon, Users } from 'lucide-react'

interface CreateOrganizationFormProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateOrganizationForm({ onClose, onSuccess }: CreateOrganizationFormProps) {
  const [orgName, setOrgName] = useState('')
  const [orgDesc, setOrgDesc] = useState('')
  const [orgColor, setOrgColor] = useState('#ffd700') // Default gold color
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orgName.trim()) {
      setError('Organization name is required')
      return
    }
    
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      
      const result = await window.electronAPI.createOrganization({
        name: orgName.trim(),
        description: orgDesc.trim() || null,
        color: orgColor,
        icon: null // We can add icon selection later
      })
      
      if (result.success) {
        setSuccessMessage(`Organization "${orgName}" created successfully!`)
        
        // Show success message for 1.5 seconds before closing
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Failed to create organization')
      }
    } catch (err) {
      console.error('Failed to create organization:', err)
      setError('An unexpected error occurred')
      window.electronAPI?.logError(String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-matrix-dark-gray backdrop-blur-lg p-8 rounded-xl border border-matrix-gold/30 shadow-matrix max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-matrix-gold bg-opacity-10 flex items-center justify-center">
            <Users size={24} className="text-matrix-gold" />
          </div>
          <h2 className="text-2xl font-bold text-matrix-gold">New Organization</h2>
        </div>
        
        <button 
          onClick={onClose}
          className="text-matrix-amber hover:text-matrix-gold transition-colors rounded-full hover:bg-matrix-gold/10 p-1"
          disabled={isSubmitting}
          aria-label="Close"
        >
          <XIcon size={20} />
        </button>
      </div>
      
      {successMessage ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-matrix-success bg-opacity-10 flex items-center justify-center mb-4">
            <CheckCircleIcon size={40} className="text-matrix-success" />
          </div>
          <p className="text-white text-xl text-center">{successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="orgName" className="block text-sm text-matrix-amber mb-2 font-medium">
              Name <span className="text-matrix-error">*</span>
            </label>
            <input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter organization name"
              className="w-full bg-matrix-black bg-opacity-60 border border-matrix-gold/30 p-3 rounded-lg text-white focus:border-matrix-gold focus:ring-1 focus:ring-matrix-gold focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="orgDesc" className="block text-sm text-matrix-amber mb-2 font-medium">
              Description
            </label>
            <textarea
              id="orgDesc"
              value={orgDesc}
              onChange={(e) => setOrgDesc(e.target.value)}
              placeholder="Brief description of this organization (optional)"
              rows={3}
              className="w-full bg-matrix-black bg-opacity-60 border border-matrix-gold/30 p-3 rounded-lg text-white focus:border-matrix-gold focus:ring-1 focus:ring-matrix-gold focus:outline-none resize-none transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="orgColor" className="block text-sm text-matrix-amber mb-2 font-medium">
              Color
            </label>
            <div className="flex items-center gap-4">
              <div className="p-1 border border-matrix-gold/30 rounded-lg">
                <input
                  id="orgColor"
                  type="color"
                  value={orgColor}
                  onChange={(e) => setOrgColor(e.target.value)}
                  className="bg-transparent border-0 h-8 w-12 cursor-pointer"
                />
              </div>
              
              <div className="flex gap-2 flex-1">
                {['#ffd700', '#00ff41', '#4169e1', '#9400d3', '#ff4500'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-transform ${orgColor === color ? 'scale-110 ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setOrgColor(color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              
              <span className="text-white text-sm font-mono">{orgColor}</span>
            </div>
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
                  Create Organization
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default CreateOrganizationForm 
