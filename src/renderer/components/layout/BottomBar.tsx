import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Activity, 
  Database, 
  Wifi, 
  HardDrive, 
  Clock,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Search,
  X, // ADD: Close icon
  Send, // ADD: Send icon
  Trash2 // ADD: Clear icon
} from 'lucide-react';

interface BottomBarProps {
  stats?: {
    organizations?: number;
    projects?: number;
    notes?: number;
    storage?: string;
  }
}

function BottomBar({ 
  stats = { organizations: 0, projects: 0, notes: 0, storage: '0 KB' } 
}: BottomBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal'); // Default to terminal
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  // ADD: Terminal state management
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '> MotherCore Terminal v1.0.0',
    '> Type "help" for available commands',
    ''
  ]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // ADD: Terminal command handler
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

  // ADD: Key handler for terminal
  const handleTerminalKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTerminalCommand(terminalInput);
    }
  };

  return (
    <div className={`bottom-bar ${isExpanded ? 'expanded' : ''}`}>
      {/* Main Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <div className="status-item">
            <Database className="w-3 h-3" />
            <span>{stats.organizations} orgs • {stats.projects} projects • {stats.notes} notes</span>
          </div>
          
          <div className="status-item">
            <HardDrive className="w-3 h-3" />
            <span>{stats.storage}</span>
          </div>
          
          <div className="status-item">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span>Ready</span>
          </div>
        </div>

        <div className="status-center">
          <div 
            className="status-item clickable" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Terminal className="w-3 h-3" />
            <span>Console</span>
            <ChevronUp className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <div className="status-right">
          <div className="status-item">
            <Clock className="w-3 h-3" />
            <span>{currentTime}</span>
          </div>
          
          <div className="status-item">
            <Activity className="w-3 h-3" />
            <span>Local</span>
          </div>
        </div>
      </div>

      {/* Expandable Console */}
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
                Status
              </button>
              <button 
                className={`console-tab ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                Logs
              </button>
              <button 
                className={`console-tab ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                Search
              </button>
            </div>
            
            {/* ADD: Close button */}
            <button 
              className="console-close"
              onClick={() => setIsExpanded(false)}
              title="Close Console"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="console-content">
            {/* ADD: Real Terminal Tab */}
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

            {activeTab === 'status' && (
              <div className="console-status">
                <div className="status-grid">
                  <div className="status-card">
                    <h4>Database</h4>
                    <p>Connected • {stats.storage} used</p>
                  </div>
                  <div className="status-card">
                    <h4>Last Activity</h4>
                    <p>Just now</p>
                  </div>
                  <div className="status-card">
                    <h4>Backup</h4>
                    <p>Local only</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="console-logs">
                <div className="log-entry">
                  <span className="log-time">{new Date().toLocaleTimeString()}</span>
                  <span className="log-level info">INFO</span>
                  <span className="log-message">Application started successfully</span>
                </div>
                <div className="log-entry">
                  <span className="log-time">{new Date().toLocaleTimeString()}</span>
                  <span className="log-level info">INFO</span>
                  <span className="log-message">Database connection established</span>
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="console-search">
                <div className="search-container">
                  <Search className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search across all notes..." 
                    className="search-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BottomBar; 