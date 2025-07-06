import React from 'react'
import { useState, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react'

interface ImageViewerProps {
  pageId: string
}

function ImageViewer({ pageId }: ImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  
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
        // Check if the page content is a base64 image
        if (result.page.content?.startsWith('data:image/')) {
          setImageUrl(result.page.content)
        } 
        // Check if the page has an image path
        else if (result.page.metadata?.imagePath) {
          // In a real implementation, you would load the image from the file system
          console.log(`Image path: ${result.page.metadata.imagePath}`)
          setImageUrl(result.page.metadata.imagePath)
        }
        // If neither, show an error
        else {
          setError('No image data found')
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
    <div className="image-viewer-container">
      {/* Image Viewer Toolbar */}
      <div className="image-viewer-toolbar">
        <div className="image-viewer-info">
          <span>Image Viewer</span>
        </div>
        
        <div className="image-viewer-actions">
          <button 
            className="image-viewer-action"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn size={14} />
          </button>
          
          <button 
            className="image-viewer-action"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
          >
            <ZoomOut size={14} />
          </button>
          
          <button 
            className="image-viewer-action"
            onClick={handleRotate}
          >
            <RotateCw size={14} />
          </button>
          
          <button 
            className="image-viewer-action"
            onClick={handleDownload}
            disabled={!imageUrl}
          >
            <Download size={14} />
          </button>
          
          <button className="image-viewer-action">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
      
      {/* Image display area */}
      <div className="image-viewer-content">
        {loading ? (
          <div className="image-viewer-loading">
            Loading image...
          </div>
        ) : error ? (
          <div className="image-viewer-error">
            {error}
          </div>
        ) : imageUrl ? (
          <div className="image-viewer-image-container">
            <img 
              src={imageUrl} 
              alt="Image content"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
              className="image-viewer-image"
            />
          </div>
        ) : (
          <div className="image-viewer-placeholder">
            No image data available
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="image-viewer-statusbar">
        <div className="image-viewer-zoom">
          Zoom: {Math.round(zoom * 100)}%
        </div>
        <div className="image-viewer-rotation">
          Rotation: {rotation}°
        </div>
      </div>
    </div>
  )
}

export default ImageViewer 