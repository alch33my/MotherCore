import type { FC, ReactNode } from 'react';
import Sidebar from '../navigation/Sidebar';
import ChatPanel from './ChatPanel';

interface MainLayoutProps {
  isChatOpen: boolean;
  sidebarContent: ReactNode;
  mainContent: ReactNode;
  chatContent: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ 
  isChatOpen, 
  sidebarContent, 
  mainContent, 
  chatContent 
}) => {
  return (
    <div className={`main-content-layout ${isChatOpen ? 'chat-open' : ''}`}>
      <div className="sidebar">
        {sidebarContent}
      </div>
      
      <div className="content-area">
        {mainContent}
      </div>
      
      {isChatOpen && (
        <div className="chat-panel">
          {chatContent}
        </div>
      )}
    </div>
  );
};

export default MainLayout; 