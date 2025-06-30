import React, { useEffect, useRef } from 'react'

interface MatrixRainProps {
  width?: number
  height?: number
  density?: number
}

function MatrixRain({ 
  width = window.innerWidth, 
  height = window.innerHeight, 
  density = 0.5 
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height

    const characters = '01'
    const fontSize = 16
    const columns = canvas.width / fontSize

    const rainDrops: number[] = []
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = 1
    }

    function drawMatrix() {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00ff41'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < rainDrops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length))
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize)

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > density) {
          rainDrops[i] = 0
        }
        rainDrops[i]++
      }
    }

    const animationFrame = setInterval(drawMatrix, 50)

    return () => {
      clearInterval(animationFrame)
    }
  }, [width, height, density])

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 z-[-1] pointer-events-none" 
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export default MatrixRain 