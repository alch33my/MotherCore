import { createContext, useContext, useState } from 'react'
import type { ReactNode, FC } from 'react'
import type { ThemeConfig, ColorTheme, DesignStyle } from '../hooks/useTheme'
import { COLOR_THEMES, DESIGN_STYLES } from '../hooks/useTheme'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  themeConfig: ThemeConfig
  colorThemes: ColorTheme[]
  designStyles: DesignStyle[]
  setColorTheme: (themeId: string) => void
  setDesignStyle: (styleId: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark')
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => ({
    colorTheme: COLOR_THEMES[0],
    designStyle: DESIGN_STYLES[0]
  }))

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const setColorTheme = (themeId: string) => {
    const newTheme = COLOR_THEMES.find(theme => theme.id === themeId)
    if (newTheme) {
      setThemeConfig(prev => ({ ...prev, colorTheme: newTheme }))
    }
  }

  const setDesignStyle = (styleId: string) => {
    const newStyle = DESIGN_STYLES.find(style => style.id === styleId)
    if (newStyle) {
      setThemeConfig(prev => ({ ...prev, designStyle: newStyle }))
    }
  }

  const themeData: ThemeContextType = {
    theme,
    toggleTheme,
    themeConfig,
    colorThemes: COLOR_THEMES,
    designStyles: DESIGN_STYLES,
    setColorTheme,
    setDesignStyle
  }

  return (
    <ThemeContext.Provider value={themeData}>
      <div data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 
