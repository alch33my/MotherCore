import React, { useState, useEffect } from 'react';
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

type SettingsSection = 'profile' | 'appearance' | 'updates' | 'security' | 'data' | 'system' | 'about';

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  onClose, 
  matrixSettings, 
  onMatrixSettingsChange 
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
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

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        if (!window.electronAPI) return;
        const settings = await window.electronAPI.getSettingsGroup('profile');
        setProfileData({
          displayName: settings.name || '',
          email: settings.email || ''
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    loadProfileData();
  }, []);

  const navigationItems = [
    { id: 'profile' as SettingsSection, label: 'Profile', icon: User },
    { id: 'appearance' as SettingsSection, label: 'Appearance', icon: Palette },
    { id: 'updates' as SettingsSection, label: 'Updates', icon: Download },
    { id: 'security' as SettingsSection, label: 'Security', icon: Shield },
    { id: 'data' as SettingsSection, label: 'Data & Backup', icon: Database },
    { id: 'system' as SettingsSection, label: 'System', icon: Monitor },
    { id: 'about' as SettingsSection, label: 'About', icon: Info }
  ];

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    if (!window.electronAPI) return;
    setIsSaving(true);
    try {
      await window.electronAPI.updateSetting('profile', 'name', profileData.displayName);
      await window.electronAPI.updateSetting('profile', 'email', profileData.email);
      alert('Profile saved successfully!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
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
                  onClick={handleSaveProfile}
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
          </div>
        );

      case 'updates':
        return <UpdateSettings onClose={() => setActiveSection('appearance')} />;

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
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2" />
          <h2>Settings</h2>
        </div>
        <button onClick={onClose} className="settings-close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {navigationItems.map(item => (
            <button
              key={item.id}
              className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <item.icon className="w-4 h-4 mr-2" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="settings-content-container">
          {renderContent()}
        </div>
      </div>

      <div className="settings-footer">
        <button 
          onClick={async () => {
            setIsSaving(true);
            try {
              localStorage.setItem('mothercore-settings', JSON.stringify(settings));
              localStorage.setItem('mothercore-matrix-settings', JSON.stringify(matrixSettings));
              localStorage.setItem('mothercore-profile', JSON.stringify(profileData));
              
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
  );
};

export default SettingsPage; 


