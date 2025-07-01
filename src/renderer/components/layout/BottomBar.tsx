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
  Search
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
  const [activeTab, setActiveTab] = useState('status');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

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
          <div className="console-tabs">
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

          <div className="console-content">
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