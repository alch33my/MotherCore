import { useEffect, useRef } from 'react'

interface MatrixRainProps {
  width?: number
  height?: number
  density?: number
  speed?: number
  fontSize?: number
  characterSet?: 'binary' | 'katakana' | 'mixed'
  colorScheme?: 'green' | 'gold' | 'gradient'
}

function MatrixRain({ 
  width = window.innerWidth, 
  height = window.innerHeight, 
  density = 0.5,
  speed = 50,
  fontSize = 16,
  characterSet = 'mixed',
  colorScheme = 'gradient'
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height

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

    // Get color based on position and scheme
    function getColor(position: number): string {
      switch (colorScheme) {
        case 'green':
          return '#00ff41'
        case 'gold':
          return '#ffd700'
        case 'gradient':
          // Gradient from gold to green
          const r = Math.floor(255 - (position * 255))
          const g = 215 + Math.floor(position * 40)
          const b = Math.floor(65 * position)
          return `rgb(${r}, ${g}, ${b})`
        default:
          return '#00ff41'
      }
    }

    function drawMatrix() {
      // Semi-transparent black to create trails
      ctx!.fillStyle = 'rgba(10, 10, 10, 0.05)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      for (let i = 0; i < rainDrops.length; i++) {
        const drop = rainDrops[i]
        const text = characters.charAt(Math.floor(Math.random() * characters.length))

        // Set color and opacity
        ctx!.fillStyle = drop.color
        ctx!.font = `${fontSize}px monospace`
        ctx!.globalAlpha = drop.opacity
        
        // Draw the character
        ctx!.fillText(text, i * fontSize, drop.position * fontSize)
        
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
    }
  }, [width, height, density, speed, fontSize, characterSet, colorScheme])

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 z-[-1] pointer-events-none" 
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export default MatrixRain 