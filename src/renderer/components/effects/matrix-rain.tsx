import React from 'react'
import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface MatrixRainProps {
  width?: number
  height?: number
  density?: number
  speed?: number
  fontSize?: number
  characterSet?: 'binary' | 'katakana' | 'mixed'
  colorScheme?: 'green' | 'gold' | 'blue' | 'purple' | 'gradient'
  intensity?: number // 0-100 for overall visibility
  theme: 'dark' | 'light'
}

function MatrixRain({ 
  density = 0.8, // Increased default density
  speed = 50,
  fontSize = 16,
  characterSet = 'mixed',
  colorScheme = 'gold',
  intensity = 70, // Increased default intensity
  theme
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme: currentTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas to full window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Character sets based on options
    let characters = '01'
    if (characterSet === 'katakana' || characterSet === 'mixed') {
      // Japanese katakana characters and some mathematical symbols
      characters = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ+-×÷=≠≥≤∞√∫∑∏∂∇∮∴∵∀∃∈∉∋∨∧⊂⊃⊆⊇'
      if (characterSet === 'mixed') {
        characters += '01'
      }
    }

    const columns = Math.floor(canvas.width / fontSize)
    const rainDrops: { position: number; speed: number; opacity: number; color: string }[] = []
    
    for (let x = 0; x < columns; x++) {
      // Randomize starting positions and speeds for a more natural look
      rainDrops[x] = {
        position: Math.floor(Math.random() * canvas.height / fontSize) * -1, 
        speed: Math.random() * 0.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
        color: getColor(Math.random())
      }
    }

    // Get color based on position and scheme with enhanced visibility
    function getColor(position: number): string {
      const baseIntensity = 40 + (intensity / 100) * 60; // 40-100% range
      const brightness = baseIntensity + Math.random() * 30;
      
      switch (colorScheme) {
        case 'green':
          return `hsl(120, 100%, ${brightness}%)`
        case 'gold':
          return `hsl(45, 100%, ${brightness}%)`
        case 'blue':
          return `hsl(220, 100%, ${brightness}%)`
        case 'purple':
          return `hsl(300, 100%, ${brightness}%)`
        case 'gradient':
          // Enhanced gradient from gold to green
          const hue = 45 + (position * 75); // 45 (gold) to 120 (green)
          return `hsl(${hue}, 100%, ${brightness}%)`
        default:
          return `hsl(45, 100%, ${brightness}%)` // Default to gold
      }
    }

    function drawMatrix() {
      // Enhanced trail effect with intensity consideration
      const fadeAmount = 0.02 + (intensity / 100) * 0.03; // 0.02-0.05 range
      ctx!.fillStyle = `rgba(10, 10, 10, ${fadeAmount})`
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      for (let i = 0; i < rainDrops.length; i++) {
        const drop = rainDrops[i]
        const text = characters.charAt(Math.floor(Math.random() * characters.length))

        // Set color and opacity with glow effect
        ctx!.fillStyle = drop.color
        ctx!.font = `${fontSize}px 'Fira Code', monospace`
        ctx!.globalAlpha = drop.opacity
        
        // Add glow effect for enhanced visibility
        ctx!.shadowColor = drop.color
        ctx!.shadowBlur = 3
        
        // Draw the character
        ctx!.fillText(text, i * fontSize, drop.position * fontSize)
        
        // Reset shadow
        ctx!.shadowBlur = 0
        
        // Reset drop when it reaches bottom or randomly based on density
        if (drop.position * fontSize > canvas!.height && Math.random() > density) {
          drop.position = 0
          drop.speed = Math.random() * 0.5 + 0.5
          drop.opacity = Math.random() * 0.5 + 0.5
          drop.color = getColor(Math.random())
        } else {
          drop.position += drop.speed
        }
      }
      
      // Reset opacity for next frame
      ctx!.globalAlpha = 1.0
    }

    const animationFrame = setInterval(drawMatrix, speed)

    // Window resize handler
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        // Recalculate columns after resize
        const newColumns = Math.floor(canvas.width / fontSize)
        
        // Adjust rainDrops array for new width
        if (newColumns > rainDrops.length) {
          for (let i = rainDrops.length; i < newColumns; i++) {
            rainDrops[i] = {
              position: Math.random() * canvas.height / fontSize * -1,
              speed: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.5 + 0.5,
              color: getColor(Math.random())
            }
          }
        }
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(animationFrame)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [density, speed, fontSize, characterSet, colorScheme, intensity])

  return (
    <canvas 
      ref={canvasRef} 
      className="matrix-rain"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: intensity / 100 // Make opacity configurable based on intensity
      }}
    />
  )
}

export default MatrixRain 
