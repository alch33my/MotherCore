# MotherCore Editors & Viewers Patch Guide

## 🔍 Current Issues Analysis

### Editor Issues
1. **Content Type Handling**
   - Notes don't properly save to database
   - Image handling lacks drag & drop support
   - File selection dialog not implemented
   - Code editor UI misaligned with design

2. **UI Inconsistencies**
   - Code editor layout doesn't match page editor
   - Hidden icons due to improper theme color usage
   - Sidebar components using hardcoded colors
   - Inconsistent theme variable implementation

3. **Backend Integration**
   - Missing database tables for different content types
   - Incomplete storage logic for files and images
   - No proper content type validation
   - Missing IPC handlers for file operations

## 🎯 Required Fixes

### Phase 1: Database & Backend Integration

#### 1. Database Schema Updates
```sql
-- Content storage table
CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('note', 'code', 'image')),
  title TEXT NOT NULL,
  content TEXT,
  file_path TEXT,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- File attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(content_id) REFERENCES content(id)
);
```

#### 2. IPC Handlers Implementation
```typescript
// src/main/content-manager.ts
interface ContentManager {
  // Content operations
  createContent(type: string, data: any): Promise<number>;
  updateContent(id: number, data: any): Promise<void>;
  getContent(id: number): Promise<any>;
  deleteContent(id: number): Promise<void>;
  
  // File operations
  saveFile(file: Buffer, path: string): Promise<string>;
  importFile(sourcePath: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}

// IPC Handlers
ipcMain.handle('content:create', async (_, type: string, data: any) => {
  return await contentManager.createContent(type, data);
});

ipcMain.handle('content:update', async (_, id: number, data: any) => {
  return await contentManager.updateContent(id, data);
});

ipcMain.handle('file:import', async (_, filePath: string) => {
  return await contentManager.importFile(filePath);
});
```

### Phase 2: Editor Components

#### 1. Base Editor Component
```typescript
// src/renderer/components/content/BaseEditor.tsx
interface EditorProps {
  type: 'note' | 'code' | 'image';
  content: any;
  onSave: (content: any) => Promise<void>;
}

function BaseEditor({ type, content, onSave }: EditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);
  
  const handleSave = async () => {
    try {
      await onSave(currentContent);
      setIsEditing(false);
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <div className="editor-container">
      <EditorToolbar 
        type={type}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
      />
      <EditorContent
        type={type}
        content={currentContent}
        isEditing={isEditing}
        onChange={setCurrentContent}
      />
    </div>
  );
}
```

#### 2. Image Handling
```typescript
// src/renderer/components/content/ImageViewer.tsx
function ImageViewer() {
  const dropRef = useRef<HTMLDivElement>(null);
  
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    await handleFiles(files);
  };
  
  const handleFileSelect = async () => {
    const result = await window.electron.invoke('dialog:openFile', {
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
    });
    if (result.filePaths?.length) {
      await handleFiles([result.filePaths[0]]);
    }
  };
  
  return (
    <div 
      ref={dropRef}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="image-viewer"
    >
      {/* Image viewer content */}
    </div>
  );
}
```

### Phase 3: UI Fixes

#### 1. Theme Integration
```typescript
// src/renderer/styles/editor-theme.css
.editor-container {
  --editor-bg: var(--theme-background);
  --editor-text: var(--theme-text);
  --editor-border: var(--theme-border);
  --editor-accent: var(--theme-accent);
  
  background-color: var(--editor-bg);
  color: var(--editor-text);
  border: 1px solid var(--editor-border);
}

.editor-toolbar {
  background-color: var(--theme-surface);
  border-bottom: 1px solid var(--theme-border);
}

.editor-content {
  background-color: var(--theme-background);
}
```

#### 2. Code Editor Layout
```typescript
// src/renderer/components/content/CodeEditor.tsx
function CodeEditor() {
  return (
    <div className="code-editor-container">
      <div className="editor-toolbar">
        {/* Language selector, settings, etc */}
      </div>
      <div className="editor-content">
        <MonacoEditor
          theme={isDarkMode ? 'vs-dark' : 'vs-light'}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            automaticLayout: true
          }}
        />
      </div>
    </div>
  );
}
```

## 📋 Implementation Steps

### Phase 1: Backend Integration
1. Create database tables for content and attachments
2. Implement ContentManager with CRUD operations
3. Add IPC handlers for content and file operations
4. Set up file system management for attachments
5. Implement content type validation

### Phase 2: Editor Components
1. Create BaseEditor component
2. Implement specific editors (Note, Code, Image)
3. Add drag & drop support for images
4. Implement file selection dialog
5. Add content save/load functionality

### Phase 3: UI Fixes
1. Update theme variables across components
2. Fix code editor layout
3. Implement consistent toolbar design
4. Fix icon visibility issues
5. Update sidebar component colors

### Phase 4: Testing & Validation
1. Test content creation and editing
2. Verify file operations
3. Check theme consistency
4. Validate editor layouts
5. Test drag & drop functionality

## 🚨 Critical Notes

1. **Data Integrity**
   - Validate all content before saving
   - Implement proper error handling
   - Add content type checking
   - Ensure proper file cleanup

2. **Performance**
   - Optimize file handling
   - Implement content caching
   - Lazy load editors
   - Handle large files efficiently

3. **User Experience**
   - Consistent UI across editors
   - Clear feedback for all operations
   - Proper loading states
   - Autosave functionality

## 🎯 Next Steps

1. Implement database schema changes
2. Add content management system
3. Update editor components
4. Fix theme implementation
5. Test full editing workflow

This patch will transform the editors and viewers into a fully functional system with proper database integration, consistent UI, and improved user experience. 