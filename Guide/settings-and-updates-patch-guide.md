# MotherCore Settings & Updates Patch Guide

## 🔍 Current Issues Analysis

### Settings Page Issues
1. **Save Functionality Not Working**
   - Settings only save to localStorage
   - No proper IPC handlers for settings operations
   - Matrix settings only saved locally
   - Profile settings only saved to localStorage

2. **Missing Backend Integration**
   - No proper database table for settings
   - No IPC handlers for settings CRUD operations
   - No validation or error handling

### Update Manager Issues
1. **Mock Implementation**
   - Update manager has placeholder functions
   - No actual GitHub release integration
   - Missing IPC handlers for update functions
   - No package extraction or installation logic

2. **Missing GitHub Release Integration**
   - No configuration for GitHub releases
   - No auto-update functionality using electron-updater
   - No proper release management system

## 🎯 Required Fixes

### Phase 1: Settings System

#### 1. Database Integration
```sql
-- Add settings table to database schema
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- Default settings
INSERT OR IGNORE INTO settings (category, key, value) VALUES
('theme', 'matrixIntensity', '60'),
('theme', 'matrixSpeed', '50'),
('theme', 'matrixColorScheme', 'gold'),
('theme', 'matrixDensity', '40'),
('updates', 'autoCheck', 'false'),
('updates', 'checkOnStartup', 'false'),
('updates', 'requireApproval', 'true'),
('updates', 'backupBeforeUpdate', 'true'),
('updates', 'updateSource', 'manual');
```

#### 2. IPC Handlers (main/settings-manager.ts)
```typescript
interface SettingsManager {
  getSetting(category: string, key: string): Promise<string>;
  setSetting(category: string, key: string, value: string): Promise<void>;
  getSettingsByCategory(category: string): Promise<Record<string, string>>;
  resetSettings(category?: string): Promise<void>;
}

// IPC Handlers
ipcMain.handle('settings:get', async (_, category: string, key: string) => {
  return await settingsManager.getSetting(category, key);
});

ipcMain.handle('settings:set', async (_, category: string, key: string, value: string) => {
  return await settingsManager.setSetting(category, key, value);
});
```

#### 3. Settings Page Integration
- Connect all settings to database
- Implement proper save functionality
- Add validation and error handling
- Add settings sync between windows

### Phase 2: Update System

#### 1. GitHub Release Integration
```typescript
// src/main/update-manager.ts
import { autoUpdater } from 'electron-updater';
import { app, ipcMain } from 'electron';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  files: Array<{
    url: string;
    sha512: string;
    size: number;
  }>;
}

class UpdateManager {
  constructor() {
    // Configure autoUpdater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    
    // Set GitHub options
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'your-username',
      repo: 'mothercore',
      private: false,
      releaseType: 'release'
    });
    
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('checking');
    });

    autoUpdater.on('update-available', (info) => {
      this.sendStatusToWindow('available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      this.sendStatusToWindow('not-available', info);
    });

    autoUpdater.on('error', (err) => {
      this.sendStatusToWindow('error', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.sendStatusToWindow('downloading', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindow('downloaded', info);
    });
  }

  private sendStatusToWindow(status: string, data?: any) {
    // Send to all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('update-status', { status, data });
    });
  }

  public async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.sendStatusToWindow('error', error);
    }
  }

  public async downloadUpdate() {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.sendStatusToWindow('error', error);
    }
  }

  public async installUpdate() {
    try {
      autoUpdater.quitAndInstall();
    } catch (error) {
      this.sendStatusToWindow('error', error);
    }
  }
}
```

#### 2. Update Settings UI
```typescript
// src/renderer/components/settings/UpdateSettings.tsx
interface UpdateSettings {
  autoCheck: boolean;
  checkOnStartup: boolean;
  requireApproval: boolean;
  backupBeforeUpdate: boolean;
  updateSource: 'manual' | 'local-network' | 'secure-https';
}

function UpdateSettings() {
  const [settings, setSettings] = useState<UpdateSettings>();
  const [updateStatus, setUpdateStatus] = useState<string>('idle');
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  useEffect(() => {
    // Listen for update status from main process
    window.electron.on('update-status', ({ status, data }) => {
      setUpdateStatus(status);
      if (data) setUpdateInfo(data);
    });

    // Load settings
    loadSettings();
  }, []);

  const handleCheckForUpdates = async () => {
    await window.electron.invoke('update:check');
  };

  const handleDownloadUpdate = async () => {
    await window.electron.invoke('update:download');
  };

  const handleInstallUpdate = async () => {
    await window.electron.invoke('update:install');
  };

  return (
    <div className="settings-section">
      <h2>Update Settings</h2>
      
      {/* Settings Form */}
      <form onSubmit={handleSaveSettings}>
        {/* Add settings controls */}
      </form>

      {/* Update Status */}
      <div className="update-status">
        {/* Add status display */}
      </div>

      {/* Action Buttons */}
      <div className="update-actions">
        <button onClick={handleCheckForUpdates}>
          Check for Updates
        </button>
        {updateStatus === 'available' && (
          <button onClick={handleDownloadUpdate}>
            Download Update
          </button>
        )}
        {updateStatus === 'downloaded' && (
          <button onClick={handleInstallUpdate}>
            Install Update
          </button>
        )}
      </div>
    </div>
  );
}
```

## 📋 Implementation Steps

### Phase 1: Settings System
1. Create settings table in database
2. Implement SettingsManager in main process
3. Add IPC handlers for settings
4. Update SettingsPage to use database
5. Add validation and error handling
6. Test settings persistence

### Phase 2: Update System
1. Configure electron-updater
2. Implement UpdateManager
3. Add IPC handlers for updates
4. Create UpdateSettings UI
5. Test update workflow
6. Setup GitHub release workflow

### Phase 3: Testing & Validation
1. Test settings persistence
2. Verify update process
3. Test error handling
4. Validate user experience

## 🚨 Critical Notes

1. **Security**
   - All settings must be validated
   - Updates must be signed
   - User approval required for updates
   - Backup before update

2. **Performance**
   - Settings should be cached
   - Update checks should be throttled
   - Background downloads only

3. **User Experience**
   - Clear feedback for all operations
   - Progress indicators for updates
   - Error messages must be user-friendly
   - Rollback option for failed updates

## 🎯 Next Steps

1. Implement settings database integration
2. Add settings IPC handlers
3. Update UI components
4. Configure GitHub releases
5. Test full update workflow

This patch will transform the settings and update system from mock implementations to fully functional features with proper persistence, security, and user experience.

## 🔑 GitHub Release Configuration

### 1. Create GitHub Token
1. Go to GitHub.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set token name: "MotherCore Release Token"
4. Set expiration: No expiration (or as needed)
5. Select scopes:
   - `repo` (all)
   - `workflow`
   - `write:packages`
   - `delete:packages`

### 2. Configure Token in Repository
1. Go to your public repository settings
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add the following secrets:
   ```
   Name: GH_TOKEN
   Value: [Your generated token]
   ```

### 3. Configure Local Development
1. Create `.env` file in project root:
   ```
   GH_TOKEN=your_token_here
   ```
2. Add to `.gitignore`:
   ```
   .env
   ```

### 4. Release Process
1. Update version in `package.json`
2. Create release commit:
   ```bash
   git add package.json
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin main --tags
   ```
3. Run release command:
   ```bash
   # Windows
   set GH_TOKEN=your_token_here && npm run release

   # Mac/Linux
   GH_TOKEN=your_token_here npm run release
   ```

### 5. Automatic Release Workflow
For automated releases, create `.github/workflows/release.yml`:
```yaml
name: Release MotherCore

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    
    steps:
      - name: Check out Git repository
        uses: actions/checkout@v3

      - name: Install Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
        env:
          GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}

      - name: Build and release
        run: npm run release
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

### 6. Testing Updates
1. Create test release:
   ```bash
   # Bump version in package.json to "0.0.2"
   npm run release
   ```
2. In development:
   - Set `autoCheck: true` in settings to test auto-updates
   - Use Settings UI to manually check for updates
   - Test offline scenarios
   - Verify update installation process

### 7. Security Notes
- NEVER commit tokens to source control
- Use repository secrets for CI/CD
- Regularly rotate tokens if needed
- Monitor token usage in GitHub settings
- Consider setting up webhook notifications for releases
