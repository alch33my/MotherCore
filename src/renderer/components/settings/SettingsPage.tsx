import React, { useState, createContext, useContext } from 'react';
import type { FC, ReactNode } from 'react';
import { 
  Monitor, 
  Palette, 
  Database, 
  Shield, 
  Settings as SettingsIcon, 
  X,
  Download,
  Upload,
  User, 
  Info
} from 'lucide-react';
import UpdateSettings from './UpdateSettings';
import ThemeSettings from './ThemeSettings';
import DatabaseLocationSettings from './DatabaseLocationSettings';
import IconTester from '../ui/IconTester';

// Create a context for tabs
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

// Simple tabs implementation
const Tabs: FC<TabsProps> = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`mc-tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

const TabsList: FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`mc-tabs-list ${className}`}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

const TabsTrigger: FC<TabsTriggerProps> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }
  
  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;
  
  return (
    <button
      className={`mc-tabs-trigger ${isActive ? 'active' : ''} ${className}`}
      onClick={() => setActiveTab(value)}
      type="button"
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

const TabsContent: FC<TabsContentProps> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }
  
  const { activeTab } = context;
  
  if (activeTab !== value) {
    return null;
  }
  
  return (
    <div className={`mc-tabs-content ${className}`}>
      {children}
    </div>
  );
};

interface MatrixSettings {
  intensity: number;
  speed: number;
  colorScheme: 'gold' | 'green' | 'blue' | 'purple' | 'gradient';
  density: number;
  enabled: boolean;
}

interface SettingsPageProps {
  onClose: () => void;
  matrixSettings: MatrixSettings;
  onMatrixSettingsChange: (settings: MatrixSettings) => void;
}

type SettingsTab = 'profile' | 'appearance' | 'updates' | 'security' | 'data' | 'system' | 'about';

const SettingsPage: FC<SettingsPageProps> = ({ onClose, matrixSettings, onMatrixSettingsChange }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [settings, setSettings] = useState({
    theme: 'cyberpunk',
    matrixSpeed: 50,
    matrixDensity: 30,
    soundEnabled: true,
    notifications: true,
    autoSave: true,
    backupLocation: '',
  });
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showIconTester, setShowIconTester] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'updates', label: 'Updates', icon: Download },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Backup', icon: Database },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'about', label: 'About', icon: Info },
  ];

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="settings-content">
            <h3 className="settings-section-title">Profile Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your name"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </div>
              <div className="setting-item">
                <label className="setting-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="your@email.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="setting-item">
                <button 
                  className="btn btn-primary"
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      // Save profile data to local storage or backend
                      localStorage.setItem('mothercore-profile', JSON.stringify(profileData));
                      alert('Profile saved successfully!');
                    } catch (err) {
                      console.error('Failed to save profile:', err);
                      alert('Failed to save profile. Please try again.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-content">
            <ThemeSettings />
            <h3 className="settings-section-title">Matrix Effects</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">Matrix Rain Enabled</label>
                <label className="setting-toggle">
                  <input
                    type="checkbox"
                    checked={matrixSettings.enabled}
                    onChange={(e) => onMatrixSettingsChange({
                      ...matrixSettings,
                      enabled: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">Color Scheme</label>
                <select 
                  className="setting-select"
                  value={matrixSettings.colorScheme}
                  onChange={(e) => onMatrixSettingsChange({
                    ...matrixSettings,
                    colorScheme: e.target.value as MatrixSettings['colorScheme']
                  })}
                >
                  <option value="gold">Cyberpunk Gold</option>
                  <option value="green">Matrix Green</option>
                  <option value="blue">Cyber Blue</option>
                  <option value="purple">Neon Purple</option>
                  <option value="gradient">Rainbow Gradient</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">
                  Matrix Rain Intensity: {matrixSettings.intensity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={matrixSettings.intensity}
                  onChange={(e) => onMatrixSettingsChange({
                    ...matrixSettings,
                    intensity: parseInt(e.target.value)
                  })}
                  className="setting-slider"
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  Matrix Rain Speed: {matrixSettings.speed}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={matrixSettings.speed}
                  onChange={(e) => onMatrixSettingsChange({
                    ...matrixSettings,
                    speed: parseInt(e.target.value)
                  })}
                  className="setting-slider"
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  Matrix Rain Density: {Math.round(matrixSettings.density * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={matrixSettings.density * 100}
                  onChange={(e) => onMatrixSettingsChange({
                    ...matrixSettings,
                    density: parseInt(e.target.value) / 100
                  })}
                  className="setting-slider"
                />
              </div>
            </div>
          </div>
        );

      case 'updates':
        return <UpdateSettings onClose={() => setActiveTab('appearance')} />;

      case 'security':
        return (
          <div className="settings-content">
            <h3 className="settings-section-title">Security Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">Auto-lock Timeout</label>
                <select className="setting-select">
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="0">Never</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="settings-content">
            <h3 className="settings-section-title">Data Management</h3>
            
            {/* Database Location Section */}
            <div className="setting-group mt-4 mb-8 p-4 bg-matrix-black/30 border border-matrix-amber/20 rounded-lg">
              <h4 className="text-matrix-gold text-lg mb-4 flex items-center">
                <Database size={18} className="mr-2" />
                Database Location
              </h4>
              
              <DatabaseLocationSettings />
            </div>
            
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">Export All Data</label>
                <button 
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      if (window.electronAPI) {
                        const result = await window.electronAPI.saveFileDialog({
                          title: 'Export MotherCore Data',
                          defaultPath: `mothercore-export-${new Date().toISOString().split('T')[0]}.json`,
                          filters: [
                            { name: 'JSON Files', extensions: ['json'] },
                            { name: 'All Files', extensions: ['*'] }
                          ]
                        });
                        
                        if (!result.canceled && result.filePath) {
                          // In a real implementation, you'd export the data here
                          console.log('Would export data to:', result.filePath);
                          alert('Export functionality coming soon!');
                        }
                      }
                    } catch (err) {
                      console.error('Export failed:', err);
                      alert('Export failed. Please try again.');
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">Import Data</label>
                <button 
                  className="btn btn-secondary"
                  onClick={async () => {
                    try {
                      if (window.electronAPI) {
                        const result = await window.electronAPI.openFileDialog({
                          title: 'Import MotherCore Data',
                          filters: [
                            { name: 'JSON Files', extensions: ['json'] },
                            { name: 'All Files', extensions: ['*'] }
                          ],
                          properties: ['openFile']
                        });
                        
                        if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
                          // In a real implementation, you'd import the data here
                          console.log('Would import data from:', result.filePaths[0]);
                          alert('Import functionality coming soon!');
                        }
                      }
                    } catch (err) {
                      console.error('Import failed:', err);
                      alert('Import failed. Please try again.');
                    }
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </button>
              </div>

              <div className="setting-item">
                <label className="setting-label">Auto-save</label>
                <label className="setting-toggle">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => updateSetting('autoSave', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="settings-content">
            <h3 className="settings-section-title">System Preferences</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">Notifications</label>
                <label className="setting-toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => updateSetting('notifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">Sound Effects</label>
                <label className="setting-toggle">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="settings-content">
            <h3 className="settings-section-title">About MotherCore</h3>
            <div className="about-content">
              <div className="about-logo">
                <div className="logo-symbol large">⚡</div>
                <h2>MOTHERCORE</h2>
                <p className="version">Version 1.0.0</p>
              </div>
              
              <div className="about-info">
                <p>A revolutionary knowledge management system built for the digital age.</p>
                <p>Built with Electron, React, and SQLite for maximum performance and reliability.</p>
              </div>

              <div className="about-stats">
                <div className="stat">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Organizations</span>
                </div>
                <div className="stat">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Projects</span>
                </div>
                <div className="stat">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Notes</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div className="flex items-center">
            <SettingsIcon className="w-5 h-5 mr-2" />
            <h2>MotherCore Settings</h2>
          </div>
          <button onClick={onClose} className="settings-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="settings-body">
          {/* Sidebar */}
          <div className="settings-sidebar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="settings-main">
            <Tabs defaultValue="appearance">
              <TabsList>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="database">Database</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="appearance">
            {renderTabContent()}
                
                <div className="settings-section">
                  <h2 className="settings-section-title">Icons</h2>
                  <div className="settings-section-content">
                    <button 
                      className="button primary" 
                      onClick={() => setShowIconTester(prev => !prev)}
                    >
                      {showIconTester ? 'Hide Icon Tester' : 'Show Icon Tester'}
                    </button>
                    
                    {showIconTester && (
                      <div className="icon-tester-container">
                        <IconTester onClose={() => setShowIconTester(false)} />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="database">
                <DatabaseLocationSettings />
              </TabsContent>
              
              <TabsContent value="updates">
                <UpdateSettings onClose={() => console.log('Update settings closed')} />
              </TabsContent>
              
              <TabsContent value="advanced">
                <div className="settings-section">
                  <h2 className="settings-section-title">Advanced Settings</h2>
                  <div className="settings-section-content">
                    <p>Advanced settings will be available in future versions.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button 
            onClick={async () => {
              setIsSaving(true);
              try {
                // Save all settings
                localStorage.setItem('mothercore-settings', JSON.stringify(settings));
                localStorage.setItem('mothercore-matrix-settings', JSON.stringify(matrixSettings));
                localStorage.setItem('mothercore-profile', JSON.stringify(profileData));
                
                // Brief delay to show saving state
                await new Promise(resolve => setTimeout(resolve, 500));
                
                onClose();
              } catch (err) {
                console.error('Failed to save settings:', err);
                alert('Failed to save settings. Please try again.');
              } finally {
                setIsSaving(false);
              }
            }}
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 


