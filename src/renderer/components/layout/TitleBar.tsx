import React from 'react'
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Settings, Minimize, Square, X, RefreshCw, ChevronRight } from 'lucide-react';
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
      { 
        label: 'New',
        submenu: [
          { label: 'Organization', action: () => console.log('New Organization'), shortcut: 'Ctrl+Shift+O' },
          { label: 'Project', action: () => console.log('New Project'), shortcut: 'Ctrl+Shift+P' },
          { label: 'Book', action: () => console.log('New Book'), shortcut: 'Ctrl+Shift+B' },
          { label: 'Chapter', action: () => console.log('New Chapter'), shortcut: 'Ctrl+Shift+C' },
          { 
            label: 'Page',
            submenu: [
              { label: 'Note', action: () => console.log('New Note'), shortcut: 'Ctrl+N' },
              { label: 'Code', action: () => console.log('New Code'), shortcut: 'Ctrl+Alt+C' },
              { label: 'Image', action: () => console.log('New Image'), shortcut: 'Ctrl+Alt+I' },
              { label: 'PDF', action: () => console.log('New PDF'), shortcut: 'Ctrl+Alt+P' },
              { label: 'Spreadsheet', action: () => console.log('New CSV'), shortcut: 'Ctrl+Alt+S' },
              { label: 'Audio', action: () => console.log('New Audio'), shortcut: 'Ctrl+Alt+A' },
              { label: 'Video', action: () => console.log('New Video'), shortcut: 'Ctrl+Alt+V' }
            ]
          }
        ]
      },
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
      { label: 'Paste', action: () => console.log('Paste'), shortcut: 'Ctrl+V' },
      { label: 'Rename', action: () => console.log('Rename'), shortcut: 'F2' },
      { label: 'Delete', action: () => console.log('Delete'), shortcut: 'Delete' }
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
    <div className="custom-title-bar flex flex-row items-center h-8 bg-gray-900 text-white" style={{ WebkitAppRegion: 'drag' }}>
      <div className="menu-bar flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' }}>
        {Object.entries(menus).map(([menuName, items]) => (
          <div key={menuName} className="relative">
            <button
              className={`px-3 h-full hover:bg-gray-700 text-sm ${activeMenu === menuName ? 'bg-gray-700' : ''}`}
              onClick={() => handleMenuClick(menuName)}
            >
              {menuName}
            </button>
            {activeMenu === menuName && (
              <div className="dropdown-menu">
                {items.map((item, index) => (
                  <div key={index}>
                    {item.submenu ? (
                      <div className="submenu-item">
                        <button
                          className="w-full px-4 py-1.5 text-left hover:bg-gray-700 text-sm flex justify-between items-center"
                        >
                          <span>{item.label}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="submenu absolute left-full top-0 bg-gray-900 border border-gray-700 rounded shadow-lg">
                          {item.submenu.map((subItem, subIndex) => (
                            <button
                              key={subIndex}
                              className="w-full px-4 py-1.5 text-left hover:bg-gray-700 text-sm flex justify-between items-center"
                              onClick={() => handleMenuItemClick(subItem.action)}
                            >
                              <span>{subItem.label}</span>
                              {subItem.shortcut && (
                                <span className="text-gray-400 text-xs ml-4">{subItem.shortcut}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        className="w-full px-4 py-1.5 text-left hover:bg-gray-700 text-sm flex justify-between items-center"
                        onClick={() => handleMenuItemClick(item.action)}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-gray-400 text-xs ml-4">{item.shortcut}</span>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="window-controls flex items-center ml-auto" style={{ WebkitAppRegion: 'no-drag' }}>
        {showDebugTools && (
          <button className="window-control p-2 hover:bg-gray-700" onClick={onDebugRefresh}>
            <RefreshCw size={14} />
          </button>
        )}
        {onSettingsClick && (
          <button 
            className="window-control p-2 hover:bg-gray-700" 
            onClick={() => {
              console.log('Settings button clicked');
              if (onSettingsClick) onSettingsClick();
            }}
          >
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

