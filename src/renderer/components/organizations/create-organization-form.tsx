import React, { useState } from 'react'
import { SaveIcon, XIcon } from 'lucide-react'

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
      const result = await window.electronAPI.createOrganization({
        name: orgName.trim(),
        description: orgDesc.trim() || null,
        color: orgColor,
        icon: null // We can add icon selection later
      })
      
      if (result.success) {
        onSuccess()
        onClose()
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
    <div className="bg-matrix-dark-gray p-6 rounded-lg border border-matrix-green shadow-lg w-96">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-matrix-gold">New Organization</h2>
        <button 
          onClick={onClose}
          className="text-matrix-amber hover:text-matrix-gold transition-colors"
        >
          <XIcon size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="orgName" className="block text-sm text-matrix-amber mb-1">
            Name <span className="text-matrix-error">*</span>
          </label>
          <input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Organization name"
            className="w-full bg-matrix-black border border-matrix-green p-2 rounded text-matrix-green focus:border-matrix-gold focus:outline-none"
          />
        </div>
        
        <div>
          <label htmlFor="orgDesc" className="block text-sm text-matrix-amber mb-1">
            Description
          </label>
          <textarea
            id="orgDesc"
            value={orgDesc}
            onChange={(e) => setOrgDesc(e.target.value)}
            placeholder="Brief description (optional)"
            rows={3}
            className="w-full bg-matrix-black border border-matrix-green p-2 rounded text-matrix-green focus:border-matrix-gold focus:outline-none"
          />
        </div>
        
        <div>
          <label htmlFor="orgColor" className="block text-sm text-matrix-amber mb-1">
            Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="orgColor"
              type="color"
              value={orgColor}
              onChange={(e) => setOrgColor(e.target.value)}
              className="bg-matrix-black border border-matrix-green p-1 h-8 w-12 cursor-pointer"
            />
            <span className="text-matrix-green">{orgColor}</span>
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

export default CreateOrganizationForm 