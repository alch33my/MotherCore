import React, { useState } from 'react';
import { Settings, Minimize, Square, X, Bell, User } from 'lucide-react';

interface TitleBarProps {
  onSettingsClick?: () => void;
  currentUser?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ onSettingsClick, currentUser }) => {
  const [isMaximized, setIsMaximized] = useState(false);

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
        </div>
      </div>

      {/* Center: Draggable Area with Breadcrumbs */}
      <div className="title-bar-center draggable-area">
        <div className="breadcrumb">
          <span className="breadcrumb-item">Knowledge Repository</span>
          {currentUser && (
            <>
              <span className="breadcrumb-separator">•</span>
              <span className="breadcrumb-item">{currentUser}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="title-bar-right">
        <div className="title-bar-actions">
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