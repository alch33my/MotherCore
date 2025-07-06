import React from 'react'
import { useState } from 'react';
import type { FC } from 'react';;
import { 
  Terminal, 
  Activity, 
  Database, 
  HardDrive, 
  Clock,
  ChevronUp,
  CheckCircle,
  Search,
  X,
  Send,
  Trash2,
  MessageSquare
} from 'lucide-react';

interface BottomBarProps {
  stats?: {
    organizations: number;
    projects: number;
    books: number;
    chapters: number;
    notes: number;
    storage: string;
  };
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

// Default stats for when none are provided
const defaultStats = {
  organizations: 0,
  projects: 0,
  books: 0,
  chapters: 0,
  notes: 0,
  storage: '0 KB'
};

const BottomBar: FC<BottomBarProps> = ({ 
  stats = defaultStats, 
  onToggleChat,
  isChatOpen = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '> MotherCore Terminal v1.0.0',
    '> Type "help" for available commands',
    ''
  ]);

  // Terminal command handler
  const handleTerminalCommand = (command: string) => {
    const cmd = command.trim().toLowerCase();
    const newHistory = [...terminalHistory];
    
    newHistory.push(`> ${command}`);
    
    switch (cmd) {
      case 'help':
        newHistory.push('Available commands:');
        newHistory.push('  help     - Show this help message');
        newHistory.push('  clear    - Clear terminal history');
        newHistory.push('  status   - Show application status');
        newHistory.push('  stats    - Show database statistics');
        newHistory.push('  theme    - Show current theme info');
        break;
      case 'clear':
        setTerminalHistory([
          '> MotherCore Terminal v1.0.0',
          '> Terminal cleared',
          ''
        ]);
        setTerminalInput('');
        return;
      case 'status':
        newHistory.push(`Database: Connected (${stats.storage})`);
        newHistory.push('Matrix Rain: Active');
        newHistory.push('Security: Local encryption enabled');
        break;
      case 'stats':
        newHistory.push(`Organizations: ${stats.organizations}`);
        newHistory.push(`Projects: ${stats.projects}`);
        newHistory.push(`Books: ${stats.books}`);
        newHistory.push(`Chapters: ${stats.chapters}`);
        newHistory.push(`Notes: ${stats.notes}`);
        newHistory.push(`Storage Used: ${stats.storage}`);
        break;
      case 'theme':
        newHistory.push('Current Theme: Cyberpunk Gold');
        newHistory.push('Matrix Rain: Enabled');
        newHistory.push('Color Scheme: Gold/Amber');
        break;
      default:
        newHistory.push(`Command not found: ${command}`);
        newHistory.push('Type "help" for available commands');
    }
    
    newHistory.push('');
    setTerminalHistory(newHistory);
    setTerminalInput('');
  };

  const handleTerminalKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTerminalCommand(terminalInput);
    }
  };

  return (
    <div className={`bottom-bar ${isExpanded ? 'expanded' : ''}`}>
      {/* Bottom bar content */}
      <div className="bottom-bar-content">
        {/* Left section */}
        <div className="bottom-bar-section">
          <div className="app-info">
            <span className="logo-text">MOTHERCORE</span>
            <div className="logo-version">v1.0.0</div>
          </div>
          <div className="status-item">
            <Database className="status-icon" />
            <span>Connected</span>
          </div>
          <div className="status-item">
            <HardDrive className="status-icon" />
            <span>{stats.storage}</span>
          </div>
        </div>
        
        {/* Center section with terminal toggle */}
        <div className="bottom-bar-section">
          <button 
            className="bottom-bar-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Terminal className="button-icon" />
            <span>Terminal</span>
            <ChevronUp 
              className={`chevron-icon ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          
          <button 
            className={`bottom-bar-button ${isChatOpen ? 'active' : ''}`}
            onClick={onToggleChat}
          >
            <MessageSquare className="button-icon" />
            <span>{isChatOpen ? 'Close Chat' : 'Open Chat'}</span>
          </button>
        </div>
        
        {/* Right section */}
        <div className="bottom-bar-section">
          <div className="status-item">
            <Activity className="status-icon" />
            <span>System Ready</span>
          </div>
          <div className="status-item">
            <Clock className="status-icon" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Terminal panel (shown when expanded) */}
      {isExpanded && (
        <div className="console-panel">
          <div className="console-header">
            <div className="console-tabs">
              <button 
                className={`console-tab ${activeTab === 'terminal' ? 'active' : ''}`}
                onClick={() => setActiveTab('terminal')}
              >
                <Terminal className="w-3 h-3 mr-1" />
                Terminal
              </button>
              <button 
                className={`console-tab ${activeTab === 'status' ? 'active' : ''}`}
                onClick={() => setActiveTab('status')}
              >
                <Activity className="w-3 h-3 mr-1" />
                Status
              </button>
              <button 
                className={`console-tab ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <Database className="w-3 h-3 mr-1" />
                Logs
              </button>
              <button 
                className={`console-tab ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                <Search className="w-3 h-3 mr-1" />
                Search
              </button>
            </div>
            
            {/* Close button */}
            <button 
              className="console-close"
              onClick={() => setIsExpanded(false)}
              title="Close Console"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="console-content">
            {/* Terminal Tab */}
            {activeTab === 'terminal' && (
              <div className="console-terminal">
                <div className="terminal-output">
                  {terminalHistory.map((line, index) => (
                    <div key={index} className="terminal-line">
                      {line}
                    </div>
                  ))}
                </div>
                <div className="terminal-input-container">
                  <span className="terminal-prompt">{'>'}</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyPress={handleTerminalKeyPress}
                    className="terminal-input"
                    placeholder="Enter command..."
                    autoFocus
                  />
                  <button 
                    className="terminal-send"
                    onClick={() => handleTerminalCommand(terminalInput)}
                  >
                    <Send className="w-3 h-3" />
                  </button>
                  <button 
                    className="terminal-clear"
                    onClick={() => setTerminalHistory(['> Terminal cleared', ''])}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">System Status</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black bg-opacity-40 p-3 rounded border border-amber-400/20">
                    <div className="flex items-center mb-2">
                      <Database className="w-4 h-4 text-amber-400 mr-2" />
                      <span className="text-xs font-medium text-amber-400">Database</span>
                    </div>
                    <div className="text-xs text-amber-300/80">
                      <div className="flex justify-between mb-1">
                        <span>Status:</span>
                        <span className="text-green-400">Connected</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Storage:</span>
                        <span>{stats.storage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entries:</span>
                        <span>{stats.organizations + stats.projects + stats.books + stats.chapters + stats.notes}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black bg-opacity-40 p-3 rounded border border-amber-400/20">
                    <div className="flex items-center mb-2">
                      <Activity className="w-4 h-4 text-amber-400 mr-2" />
                      <span className="text-xs font-medium text-amber-400">Performance</span>
                    </div>
                    <div className="text-xs text-amber-300/80">
                      <div className="flex justify-between mb-1">
                        <span>Memory:</span>
                        <span>128 MB</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>CPU:</span>
                        <span>2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span>00:42:18</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">System Logs</h3>
                
                <div className="console-logs text-xs">
                  <div className="log-entry">
                    <span className="log-time">10:42:15</span>
                    <span className="log-level info">INFO</span>
                    <span className="log-message">Application started</span>
                  </div>
                  <div className="log-entry">
                    <span className="log-time">10:42:16</span>
                    <span className="log-level info">INFO</span>
                    <span className="log-message">Database connected</span>
                  </div>
                  <div className="log-entry">
                    <span className="log-time">10:42:18</span>
                    <span className="log-level warn">WARN</span>
                    <span className="log-message">Cache initialization delayed</span>
                  </div>
                  <div className="log-entry">
                    <span className="log-time">10:42:20</span>
                    <span className="log-level info">INFO</span>
                    <span className="log-message">UI components rendered</span>
                  </div>
                </div>
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">Search Console</h3>
                
                <div className="mb-4">
                  <input 
                    type="text" 
                    className="console-search w-full bg-black bg-opacity-50 border border-amber-400/30 rounded px-3 py-2 text-amber-400 text-xs"
                    placeholder="Search logs, commands, or documentation..."
                  />
                </div>
                
                <div className="text-xs text-amber-400/70 italic">
                  Enter a search term and press Enter to search.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomBar; 


