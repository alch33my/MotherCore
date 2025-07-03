import React from 'react'
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Settings, Minimize, Square, X, Bell, User, RefreshCw } from 'lucide-react';

interface TitleBarProps {
  onSettingsClick?: () => void;
  onDebugRefresh?: () => void;
  currentUser?: string;
}

const TitleBar: FC<TitleBarProps> = ({ onSettingsClick, onDebugRefresh, currentUser }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showDebugTools, setShowDebugTools] = useState(false);

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

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="custom-title-bar">
      {/* Left: Logo and Title */}
      <div className="title-bar-left">
        <div className="app-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">MOTHERCORE</span>
          <div className="logo-version">v1.0.0</div>
        </div>
      </div>

      {/* Center: Draggable Area with Enhanced Breadcrumbs */}
      <div className="title-bar-center draggable-area">
        <div className="breadcrumb-enhanced">
          <span className="breadcrumb-primary">Knowledge Repository</span>
          {currentUser && (
            <>
              <span className="breadcrumb-separator">•</span>
              <span className="breadcrumb-user">
                <User className="w-3 h-3 inline mr-1" />
                {currentUser}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="title-bar-right">
        <div className="title-bar-actions">
          {/* Debug refresh button - only shown when debug tools are enabled */}
          {showDebugTools && onDebugRefresh && (
            <button 
              className="title-bar-action" 
              onClick={onDebugRefresh}
              title="Debug: Force Refresh"
              style={{ backgroundColor: 'rgba(255, 60, 60, 0.2)' }}
            >
              <RefreshCw className="w-4 h-4 text-matrix-error" />
            </button>
          )}
          <button 
            className="title-bar-action" 
            onClick={onSettingsClick}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button className="title-bar-action" title="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          <button className="title-bar-action" title="Profile">
            <User className="w-4 h-4" />
          </button>
        </div>
        
        <div className="window-controls">
          <button 
            className="window-control minimize" 
            onClick={handleMinimize}
            title="Minimize"
          >
            <Minimize className="w-3 h-3" />
          </button>
          <button 
            className="window-control maximize" 
            onClick={handleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            className="window-control close" 
            onClick={handleClose}
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar; 

