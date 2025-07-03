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
      <div className="flex items-center justify-between w-full h-full px-4">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <div className="status-item flex items-center">
            <Database className="w-3 h-3 mr-1 text-amber-400" />
            <span className="text-xs text-amber-400">Connected</span>
          </div>
          <div className="status-item flex items-center">
            <HardDrive className="w-3 h-3 mr-1 text-amber-400" />
            <span className="text-xs text-amber-400">{stats.storage}</span>
          </div>
        </div>
        
        {/* Center section with terminal toggle */}
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center px-4 py-1 rounded hover:bg-amber-500/10 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Terminal className="w-3 h-3 mr-2 text-amber-400" />
            <span className="text-xs text-amber-400">Terminal</span>
            <ChevronUp 
              className={`w-3 h-3 ml-2 text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          
          <button 
            className={`flex items-center px-4 py-1 rounded transition-colors ${
              isChatOpen 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'hover:bg-amber-500/10 text-amber-400/80'
            }`}
            onClick={onToggleChat}
          >
            <MessageSquare className="w-3 h-3 mr-2" />
            <span className="text-xs">Chat</span>
          </button>
        </div>
        
        {/* Right section */}
        <div className="flex items-center space-x-4">
          <div className="status-item flex items-center">
            <Activity className="w-3 h-3 mr-1 text-amber-400" />
            <span className="text-xs text-amber-400">System Ready</span>
          </div>
          <div className="status-item flex items-center">
            <Clock className="w-3 h-3 mr-1 text-amber-400" />
            <span className="text-xs text-amber-400">{new Date().toLocaleTimeString()}</span>
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
                      <h4 className="text-sm font-medium text-amber-400">Database</h4>
                    </div>
                    <div className="text-xs space-y-1 text-amber-400/70">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> Connected
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span>{stats.storage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Backup:</span>
                        <span>None</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black bg-opacity-40 p-3 rounded border border-amber-400/20">
                    <div className="flex items-center mb-2">
                      <HardDrive className="w-4 h-4 text-amber-400 mr-2" />
                      <h4 className="text-sm font-medium text-amber-400">Content</h4>
                    </div>
                    <div className="text-xs space-y-1 text-amber-400/70">
                      <div className="flex justify-between">
                        <span>Organizations:</span>
                        <span>{stats.organizations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projects:</span>
                        <span>{stats.projects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Books:</span>
                        <span>{stats.books}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-amber-400">Application Logs</h3>
                  <button className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                    Clear Logs
                  </button>
                </div>
                <div className="text-xs space-y-1 text-amber-400/70">
                  <div className="bg-black bg-opacity-40 p-2 rounded border border-amber-400/10">
                    <span className="text-amber-400/50">[12:45:32]</span> Application started
                  </div>
                  <div className="bg-black bg-opacity-40 p-2 rounded border border-amber-400/10">
                    <span className="text-amber-400/50">[12:45:35]</span> Database connected
                  </div>
                  <div className="bg-black bg-opacity-40 p-2 rounded border border-amber-400/10">
                    <span className="text-amber-400/50">[12:46:01]</span> User session initialized
                  </div>
                </div>
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-amber-400/50" />
                  <input
                    type="text"
                    placeholder="Search across all content..."
                    className="w-full bg-black bg-opacity-40 text-amber-400 border border-amber-400/30 rounded pl-10 pr-4 py-2 text-sm focus:border-amber-400/50 focus:outline-none"
                  />
                </div>
                <div className="text-xs text-amber-400/70 text-center py-10">
                  Enter a search term to find content across all notes
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Default stats when none provided
const defaultStats = {
  organizations: 0,
  projects: 0,
  books: 0,
  chapters: 0,
  notes: 0,
  storage: '0 KB'
};

export default BottomBar; 


