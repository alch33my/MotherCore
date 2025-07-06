import React from 'react'
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Settings, Minimize, Square, X, RefreshCw } from 'lucide-react';
import Icon from '../ui/Icon';

interface TitleBarProps {
  onSettingsClick?: () => void;
  onDebugRefresh?: () => void;
  currentUser?: string;
}

interface MenuAction {
  label: string;
  action?: () => void;
  shortcut?: string;
  submenu?: MenuAction[];
}

const TitleBar: FC<TitleBarProps> = ({ onSettingsClick, onDebugRefresh, currentUser }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Show debug tools with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        setShowDebugTools(prev => !prev);
        console.log('Debug tools', showDebugTools ? 'hidden' : 'shown');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebugTools]);

  // Check window maximized state only once on mount
  useEffect(() => {
    const checkMaximized = async () => {
      try {
        if (window.electronAPI) {
          const maximized = await window.electronAPI.maximizeWindow();
          setIsMaximized(maximized);
        }
      } catch (error) {
        console.error('Failed to check window state:', error);
      }
    };

    checkMaximized();
    
    const handleMaximizeChange = (isMax: boolean) => {
      setIsMaximized(isMax);
    };
    
    if (window.electronAPI && window.electronAPI.onMaximizeChange) {
      window.electronAPI.onMaximizeChange(handleMaximizeChange);
    }
    
    return () => {
      if (window.electronAPI && window.electronAPI.offMaximizeChange) {
        window.electronAPI.offMaximizeChange(handleMaximizeChange);
      }
    };
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      const maximized = await window.electronAPI.maximizeWindow();
      setIsMaximized(maximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuItemClick = (action?: () => void) => {
    if (action) {
      action();
    }
    setActiveMenu(null);
  };

  // Menu definitions moved after function declarations
  const menus: Record<string, MenuAction[]> = {
    'File': [
      { label: 'New Project', action: () => console.log('New Project'), shortcut: 'Ctrl+N' },
      { label: 'Open Project', action: () => console.log('Open Project'), shortcut: 'Ctrl+O' },
      { label: 'Save', action: () => console.log('Save'), shortcut: 'Ctrl+S' },
      { label: 'Save All', action: () => console.log('Save All'), shortcut: 'Ctrl+Shift+S' },
      { label: 'Exit', action: handleClose, shortcut: 'Alt+F4' }
    ],
    'Edit': [
      { label: 'Undo', action: () => console.log('Undo'), shortcut: 'Ctrl+Z' },
      { label: 'Redo', action: () => console.log('Redo'), shortcut: 'Ctrl+Y' },
      { label: 'Cut', action: () => console.log('Cut'), shortcut: 'Ctrl+X' },
      { label: 'Copy', action: () => console.log('Copy'), shortcut: 'Ctrl+C' },
      { label: 'Paste', action: () => console.log('Paste'), shortcut: 'Ctrl+V' }
    ],
    'View': [
      { label: 'Toggle Sidebar', action: () => console.log('Toggle Sidebar'), shortcut: 'Ctrl+B' },
      { label: 'Toggle Terminal', action: () => console.log('Toggle Terminal'), shortcut: 'Ctrl+`' },
      { label: 'Zoom In', action: () => console.log('Zoom In'), shortcut: 'Ctrl+Plus' },
      { label: 'Zoom Out', action: () => console.log('Zoom Out'), shortcut: 'Ctrl+Minus' }
    ],
    'Help': [
      { label: 'Documentation', action: () => console.log('Documentation'), shortcut: 'F1' },
      { label: 'About', action: () => console.log('About') }
    ]
  };

  return (
    <div className="custom-title-bar flex flex-row items-center h-8 bg-gray-900 text-white">
      <div className="title-section flex items-center space-x-2 px-2">
        <div className="app-icon">
          <Icon name="app-icon-main" size={16} />
        </div>
        <div className="app-title text-sm">MotherCore</div>
        <div className="app-version text-xs text-gray-400">v0.1.0</div>
      </div>

      <div className="menu-bar flex items-center h-full">
        {Object.entries(menus).map(([menuName, items]) => (
          <div key={menuName} className="relative">
            <button
              className={`px-3 h-full hover:bg-gray-700 text-sm ${activeMenu === menuName ? 'bg-gray-700' : ''}`}
              onClick={() => handleMenuClick(menuName)}
            >
              {menuName}
            </button>
            {activeMenu === menuName && (
              <div className="absolute top-full left-0 bg-gray-800 shadow-lg rounded-b min-w-[200px] py-1 z-50">
                {items.map((item, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-1.5 text-left hover:bg-gray-700 text-sm flex justify-between items-center"
                    onClick={() => handleMenuItemClick(item.action)}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-gray-400 text-xs ml-4">{item.shortcut}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="window-controls flex items-center ml-auto">
        {showDebugTools && (
          <button className="window-control p-2 hover:bg-gray-700" onClick={onDebugRefresh}>
            <RefreshCw size={14} />
          </button>
        )}
        {onSettingsClick && (
          <button className="window-control p-2 hover:bg-gray-700" onClick={onSettingsClick}>
            <Settings size={14} />
          </button>
        )}
        <button className="window-control p-2 hover:bg-gray-700" onClick={handleMinimize}>
          <Minimize size={14} />
        </button>
        <button className="window-control p-2 hover:bg-gray-700" onClick={handleMaximize}>
          <Square size={14} />
        </button>
        <button className="window-control p-2 hover:bg-red-600" onClick={handleClose}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 

