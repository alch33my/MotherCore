import { useState, useEffect } from 'react'

// Theme system: Style (layout/design) + Color scheme
export interface ColorTheme {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
}

export interface DesignStyle {
  id: string
  name: string
  description: string
  // Style-specific properties like animations, spacing, etc.
  animations: boolean
  borderRadius: number
  matrixRain: boolean
}

// Available color themes
export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'cyberpunk-gold',
    name: 'Cyberpunk Gold',
    primary: '#ffd700',
    secondary: '#ffb000', 
    accent: '#fff700',
    background: '#0a0a0a',
    surface: 'rgba(0, 0, 0, 0.95)',
    text: '#ffb000',
    textSecondary: 'rgba(255, 215, 0, 0.7)',
    border: 'rgba(255, 215, 0, 0.3)',
    success: '#00ff41',
    warning: '#ff8c00',
    error: '#ff4444'
  },
  {
    id: 'matrix-green',
    name: 'Matrix Green',
    primary: '#00ff41',
    secondary: '#00cc33',
    accent: '#66ff66',
    background: '#000000',
    surface: 'rgba(0, 0, 0, 0.95)',
    text: '#00ff41',
    textSecondary: 'rgba(0, 255, 65, 0.7)',
    border: 'rgba(0, 255, 65, 0.3)',
    success: '#00ff41',
    warning: '#ffff00',
    error: '#ff0000'
  },
  {
    id: 'cyber-blue',
    name: 'Cyber Blue',
    primary: '#00bfff',
    secondary: '#0099cc',
    accent: '#66ccff',
    background: '#000011',
    surface: 'rgba(0, 0, 17, 0.95)',
    text: '#00bfff',
    textSecondary: 'rgba(0, 191, 255, 0.7)',
    border: 'rgba(0, 191, 255, 0.3)',
    success: '#00ff41',
    warning: '#ffaa00',
    error: '#ff4466'
  },
  {
    id: 'neon-purple',
    name: 'Neon Purple',
    primary: '#9d4edd',
    secondary: '#7b2cbf',
    accent: '#c77dff',
    background: '#10002b',
    surface: 'rgba(16, 0, 43, 0.95)',
    text: '#9d4edd',
    textSecondary: 'rgba(157, 78, 221, 0.7)',
    border: 'rgba(157, 78, 221, 0.3)',
    success: '#06ffa5',
    warning: '#ffbe0b',
    error: '#fb8500'
  }
]

// Available design styles
export const DESIGN_STYLES: DesignStyle[] = [
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Cyberpunk aesthetic with matrix rain and terminal-inspired UI',
    animations: true,
    borderRadius: 6,
    matrixRain: true
  }
  // Future styles can be added here:
  // {
  //   id: 'minimal',
  //   name: 'Minimal',
  //   description: 'Clean, minimal interface',
  //   animations: false,
  //   borderRadius: 12,
  //   matrixRain: false
  // }
]

export interface ThemeConfig {
  colorTheme: ColorTheme
  designStyle: DesignStyle
}

export function useTheme() {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    // Load from localStorage or use defaults
    const savedTheme = localStorage.getItem('mothercore-theme-config')
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        const colorTheme = COLOR_THEMES.find(t => t.id === parsed.colorThemeId) || COLOR_THEMES[0]
        const designStyle = DESIGN_STYLES.find(s => s.id === parsed.designStyleId) || DESIGN_STYLES[0]
        return { colorTheme, designStyle }
      } catch {
        // Fall back to defaults
      }
    }
    
    return {
      colorTheme: COLOR_THEMES[0], // Default to Cyberpunk Gold
      designStyle: DESIGN_STYLES[0] // Default to Matrix style
    }
  })

  // Apply theme to CSS custom properties
  useEffect(() => {
    const root = document.documentElement
    const { colorTheme } = themeConfig
    
    root.style.setProperty('--color-primary', colorTheme.primary)
    root.style.setProperty('--color-secondary', colorTheme.secondary)
    root.style.setProperty('--color-accent', colorTheme.accent)
    root.style.setProperty('--color-background', colorTheme.background)
    root.style.setProperty('--color-surface', colorTheme.surface)
    root.style.setProperty('--color-text', colorTheme.text)
    root.style.setProperty('--color-text-secondary', colorTheme.textSecondary)
    root.style.setProperty('--color-border', colorTheme.border)
    root.style.setProperty('--color-success', colorTheme.success)
    root.style.setProperty('--color-warning', colorTheme.warning)
    root.style.setProperty('--color-error', colorTheme.error)
  }, [themeConfig])

  const setColorTheme = (themeId: string) => {
    const colorTheme = COLOR_THEMES.find(t => t.id === themeId)
    if (colorTheme) {
      const newConfig = { ...themeConfig, colorTheme }
      setThemeConfig(newConfig)
      
      // Save to localStorage
      localStorage.setItem('mothercore-theme-config', JSON.stringify({
        colorThemeId: colorTheme.id,
        designStyleId: themeConfig.designStyle.id
      }))
    }
  }

  const setDesignStyle = (styleId: string) => {
    const designStyle = DESIGN_STYLES.find(s => s.id === styleId)
    if (designStyle) {
      const newConfig = { ...themeConfig, designStyle }
      setThemeConfig(newConfig)
      
      // Save to localStorage
      localStorage.setItem('mothercore-theme-config', JSON.stringify({
        colorThemeId: themeConfig.colorTheme.id,
        designStyleId: designStyle.id
      }))
    }
  }

  return {
    themeConfig,
    colorThemes: COLOR_THEMES,
    designStyles: DESIGN_STYLES,
    setColorTheme,
    setDesignStyle
  }
} 