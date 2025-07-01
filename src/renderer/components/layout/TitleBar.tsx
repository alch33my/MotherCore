import React from 'react';

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="title-bar">
      <div className="text-sm text-amber-300 font-mono">
        MotherCore - Your Digital Library
      </div>
      <div className="title-bar-buttons">
        <button 
          onClick={handleMinimize}
          className="title-bar-button"
          title="Minimize"
        >
          —
        </button>
        <button 
          onClick={handleMaximize}
          className="title-bar-button"
          title="Maximize"
        >
          □
        </button>
        <button 
          onClick={handleClose}
          className="title-bar-button close"
          title="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 