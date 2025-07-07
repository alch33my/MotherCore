import React, { forwardRef } from 'react';
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import Sidebar from '../navigation/Sidebar';
import ChatPanel from './ChatPanel';
import TitleBar from './TitleBar';
import BottomBar from './BottomBar';
import MainContent from '../content/MainContent';
import { useTheme } from '../../context/ThemeContext';

interface MainLayoutProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
  selectedItem: any;
  selectedType: string;
  onSelectItem: (item: any, type: string) => void;
}

const MainLayout = forwardRef<any, MainLayoutProps>((
  { isChatOpen, onToggleChat, selectedItem, selectedType, onSelectItem },
  ref
) => {
  const contentRef = React.useRef<any>(null);

  // Forward methods from MainContent
  React.useImperativeHandle(ref, () => ({
    openSettingsTab: (...args: any[]) => {
      contentRef.current?.openSettingsTab(...args);
    }
  }));

  const { theme } = useTheme();

  return (
    <div>
      <div className={`main-layout ${isChatOpen ? 'has-chat' : ''}`}>
        <div className="sidebar">
          <Sidebar onSelectItem={onSelectItem} />
        </div>
        
        <div className="content-container">
          <MainContent 
            ref={contentRef}
            selectedItem={selectedItem} 
            selectedType={selectedType} 
          />
        </div>
        
        <div className={`chat-panel ${isChatOpen ? 'open' : ''}`}>
          <ChatPanel isOpen={isChatOpen} onClose={onToggleChat} />
        </div>
      </div>
    </div>
  );
});

MainLayout.displayName = 'MainLayout';

export default MainLayout; 