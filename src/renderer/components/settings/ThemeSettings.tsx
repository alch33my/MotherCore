import React, { useState } from 'react'
// No imports needed for useState
import { useTheme } from '../../context/ThemeContext'
import type { DesignStyle, ColorTheme } from '../../hooks/useTheme'

function ThemeSettings() {
  const { themeConfig, colorThemes, designStyles, setColorTheme, setDesignStyle } = useTheme()
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>('')
  const [selectedDesignStyle, setSelectedDesignStyle] = useState<string>('')

  return (
    <div className="settings-section">
      <h3 className="text-lg font-semibold text-primary mb-4">Theme & Appearance</h3>
      
      {/* Design Style Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-secondary mb-2">
          Design Style
        </label>
        <div className="grid gap-3">
          {designStyles.map((style: DesignStyle) => (
            <div
              key={style.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                themeConfig.designStyle.id === style.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setDesignStyle(style.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-text">{style.name}</h4>
                  <p className="text-sm text-text-secondary">{style.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {style.matrixRain && (
                    <span className="text-xs px-2 py-1 bg-success/20 text-success rounded">
                      Matrix Rain
                    </span>
                  )}
                  {style.animations && (
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                      Animations
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Theme Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-secondary mb-2">
          Color Theme
        </label>
        <div className="grid grid-cols-2 gap-3">
          {colorThemes.map((theme: ColorTheme) => (
            <div
              key={theme.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                themeConfig.colorTheme.id === theme.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setColorTheme(theme.id)}
            >
              {/* Theme Preview */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-1">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: theme.secondary }}
                  />
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: theme.accent }}
                  />
                </div>
                <span className="text-sm font-medium text-text">{theme.name}</span>
              </div>
              
              {/* Theme Details */}
              <div className="text-xs text-text-secondary">
                Primary: {theme.primary}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Theme Info */}
      <div className="p-4 bg-surface border border-border rounded-lg">
        <h4 className="font-medium text-text mb-2">Current Configuration</h4>
        <div className="text-sm text-text-secondary space-y-1">
          <div>Style: <span className="text-text">{themeConfig.designStyle.name}</span></div>
          <div>Color: <span className="text-text">{themeConfig.colorTheme.name}</span></div>
          <div>Matrix Rain: <span className="text-text">{themeConfig.designStyle.matrixRain ? 'Enabled' : 'Disabled'}</span></div>
        </div>
      </div>
    </div>
  )
}

export default ThemeSettings 
