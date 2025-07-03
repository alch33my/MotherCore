import React from 'react'
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'
import type { ThemeConfig, ColorTheme, DesignStyle } from '../hooks/useTheme'

interface ThemeContextType {
  themeConfig: ThemeConfig
  colorThemes: ColorTheme[]
  designStyles: DesignStyle[]
  setColorTheme: (themeId: string) => void
  setDesignStyle: (styleId: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeData = useTheme()

  return (
    <ThemeContext.Provider value={themeData}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
} 
