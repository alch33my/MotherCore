import React, { useEffect, useState } from 'react';
import { Database, FolderOpen, RotateCcw } from 'lucide-react';

interface DatabaseLocationInfo {
  path: string;
  isCustom: boolean;
  directory?: string;
  filename?: string;
}

interface DatabaseLocationSettingsProps {
  onLocationChanged?: () => void;
}

function DatabaseLocationSettings({ onLocationChanged }: DatabaseLocationSettingsProps) {
  const [dbLocation, setDbLocation] = useState<DatabaseLocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load current database location
  useEffect(() => {
    loadDatabaseLocation();
  }, []);

  const loadDatabaseLocation = async () => {
    if (!window.electronAPI) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const result = await window.electronAPI.getDatabaseLocation();
      
      if (result.success && result.path) {
        setDbLocation({
          path: result.path,
          isCustom: result.isCustom || false,
          directory: result.directory,
          filename: result.filename
        });
      } else {
        setError(result.error || 'Failed to get database location');
      }
    } catch (err) {
      console.error('Failed to get database location:', err);
      setError('An error occurred while fetching database location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeLocation = async () => {
    if (!window.electronAPI) return;
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // Open directory selection dialog
      const dirResult = await window.electronAPI.selectDirectory();
      
      if (dirResult.canceled || !dirResult.path) {
        setIsLoading(false);
        return;
      }
      
      // Set the new database location
      const result = await window.electronAPI.changeDatabaseLocation(dirResult.path);
      
      if (result.success) {
        // Use the path from the result, or fall back to the selected directory path
        const path = result.path || dirResult.path;
        
        setDbLocation({
          path,
          isCustom: true,
          directory: dirResult.path,
          filename: dbLocation?.filename
        });
        setSuccess('Database location changed successfully');
        if (onLocationChanged) onLocationChanged();
      } else {
        setError(result.error || 'Failed to change database location');
      }
    } catch (err) {
      console.error('Failed to change database location:', err);
      setError('An error occurred while changing database location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLocation = async () => {
    if (!window.electronAPI) return;
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // Reset database location to default
      const result = await window.electronAPI.resetDatabaseLocation();
      
      if (result.success) {
        // Use the path from the result, or use empty string as fallback
        const path = result.path || '';
        
        setDbLocation({
          path,
          isCustom: false
        });
        setSuccess('Database location reset to default');
        if (onLocationChanged) onLocationChanged();
      } else {
        setError(result.error || 'Failed to reset database location');
      }
    } catch (err) {
      console.error('Failed to reset database location:', err);
      setError('An error occurred while resetting database location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <Database className="w-5 h-5 mr-2" />
        <h3>Database Location</h3>
      </div>
      
      <div className="settings-section-content">
        <p className="settings-description">
          Choose where your database file is stored. By default, it's in the app's root folder,
          which makes it portable when running from a flash drive.
        </p>
        
        {isLoading ? (
          <div className="settings-loading">
            <div className="loading-spinner" />
            <span>Loading database info...</span>
          </div>
        ) : error ? (
          <div className="settings-error">{error}</div>
        ) : dbLocation ? (
          <div className="database-info">
            <div className="database-path">
              <span className="label">Current location:</span>
              <span className="path">{dbLocation.path}</span>
              <span className={`badge ${dbLocation.isCustom ? 'custom' : 'default'}`}>
                {dbLocation.isCustom ? 'Custom' : 'Default'}
              </span>
            </div>
            
            {success && (
              <div className="settings-success">{success}</div>
            )}
            
            <div className="database-actions">
              <button
                onClick={handleChangeLocation}
                disabled={isLoading}
                className="settings-button primary"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Change Location
              </button>
              
              {dbLocation.isCustom && (
                <button
                  onClick={handleResetLocation}
                  disabled={isLoading}
                  className="settings-button secondary"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="database-not-found">
            Database location information not available
          </div>
        )}
      </div>
    </div>
  );
}

export default DatabaseLocationSettings; 