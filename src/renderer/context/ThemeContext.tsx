import { createContext, useContext, useState } from 'react'
import type { ReactNode, FC } from 'react'
import type { ThemeConfig, ColorTheme, DesignStyle } from '../hooks/useTheme'

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const themeData: ThemeContextType = {
    theme,
    toggleTheme,
    themeConfig: {} as ThemeConfig,
    colorThemes: [],
    designStyles: [],
    setColorTheme: () => {},
    setDesignStyle: () => {}
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
