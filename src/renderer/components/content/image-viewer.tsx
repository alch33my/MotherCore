import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Upload, Image } from 'lucide-react'

interface ImageViewerProps {
  pageId: string
}

function ImageViewer({ pageId }: ImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  // Load image when component mounts or pageId changes
  useEffect(() => {
    loadImage()
  }, [pageId])
  
  const loadImage = async () => {
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    try {
      setLoading(true)
      const result = await window.electronAPI.getPage(pageId)
      
      if (result.success && result.page) {
        let imageContent = result.page.content
        let metadata = null
        
        // Try to parse content as JSON
        if (imageContent) {
          try {
            const parsed = JSON.parse(imageContent)
            if (parsed.content) {
              imageContent = parsed.content
              metadata = parsed.metadata
            }
          } catch {
            // If parsing fails, assume content is direct base64
          }
        }
        
        if (typeof imageContent === 'string' && imageContent.startsWith('data:image/')) {
          setImageUrl(imageContent)
          setError(null)
        } else {
          setImageUrl(null)
          setError(null) // Clear error for empty state
        }
      } else {
        setError(result.error || 'Failed to load image')
      }
    } catch (err) {
      console.error('Failed to load image:', err)
      setError('Failed to load image')
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(false)
    }
  }
  
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
    try {
      setLoading(true)
      
      // Read file as base64
      const reader = new FileReader()
      const base64Content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      
      if (!window.electronAPI) {
        throw new Error('Application error: API not available')
      }
      
      // Create metadata object
      const metadata = {
        mimeType: file.type,
        originalFileName: file.name,
        fileSize: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      }
      
      // Store content and metadata together
      const content = JSON.stringify({
        content: base64Content,
        metadata
      })
      
      const result = await window.electronAPI.updatePageContent(
        pageId,
        content,
        `Image: ${file.name}`
      )
      
      if (result.success) {
        setImageUrl(base64Content)
        setError(null)
      } else {
        setError(result.error || 'Failed to save image')
      }
    } catch (err) {
      console.error('Failed to save image:', err)
      setError('Failed to save image')
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(false)
    }
  }
  
  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [])
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }
  
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }
  
  const handleDownload = () => {
    if (!imageUrl) return
    
    // Create a temporary anchor element to trigger download
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `image-${pageId}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  
  return (
    <div className="image-viewer-container h-full w-full flex flex-col bg-surface">
      {/* Toolbar */}
      <div className="image-viewer-toolbar flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <Image className="w-4 h-4 text-primary/70" />
          <span className="text-text-secondary">Image Viewer</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {imageUrl && (
            <>
              <button 
                onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4 text-primary/70" />
              </button>
              
              <button 
                onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
                className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                disabled={zoom <= 0.25}
              >
                <ZoomOut className="w-4 h-4 text-primary/70" />
              </button>
              
              <button 
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-1.5 hover:bg-primary/10 rounded transition-colors"
              >
                <RotateCw className="w-4 h-4 text-primary/70" />
              </button>
              
              <button 
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = imageUrl
                  a.download = `image-${pageId}.png`
                  a.click()
                }}
                className="p-1.5 hover:bg-primary/10 rounded transition-colors"
              >
                <Download className="w-4 h-4 text-primary/70" />
              </button>
            </>
          )}
          
          <label 
            className="p-1.5 hover:bg-primary/10 rounded transition-colors cursor-pointer"
            title="Upload image"
          >
            <Upload className="w-4 h-4 text-primary/70" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
          </label>
        </div>
      </div>
      
      {/* Main content area */}
      <div 
        className={`flex-1 relative w-full overflow-hidden ${
          !imageUrl ? 'flex items-center justify-center' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-error text-center p-4">{error}</div>
        ) : imageUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={imageUrl}
              alt="Image content"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              className="transition-transform duration-200"
            />
          </div>
        ) : (
          <div 
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg m-4 transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <Image className="w-16 h-16 text-primary/30 mb-4" />
            <p className="text-text-secondary mb-2">
              Drag and drop an image here, or
            </p>
            <label className="btn btn-primary cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Choose File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
            </label>
          </div>
        )}
      </div>
      
      {/* Status bar */}
      {imageUrl && (
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-border">
          <div className="text-text-secondary text-sm">
            Zoom: {Math.round(zoom * 100)}%
          </div>
          <div className="text-text-secondary text-sm">
            Rotation: {rotation}°
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageViewer 