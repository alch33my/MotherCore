import React, { forwardRef, useImperativeHandle } from 'react'
import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';;
import { 
  FileText, 
  Code, 
  Image as ImageIcon,
  Table,
  FileSpreadsheet,
  Video,
  File,
  X,
  Plus,
  Maximize2,
  Minimize2,
  ListChecks,
  LayoutGrid,
  Settings
} from 'lucide-react';
import PageEditor from './page-editor';
import CodeEditor from './code-editor';
import ImageViewer from './image-viewer';
import MatrixRain from '../effects/matrix-rain';
import Icon from '../ui/Icon';
import { useTheme } from '../../context/ThemeContext';
import SettingsPage from '../settings/SettingsPage';
import { ErrorBoundary } from 'react-error-boundary';

interface MainContentProps {
  selectedItem: any;
  selectedType: string;
  currentTime?: string;
  wordCount?: number;
  charCount?: number;
  onEditorStatsChange?: (stats: { words: number, characters: number }) => void;
  onRefreshContent?: () => void;
  onAddProject?: (projectId: string) => void;
  onAddBook?: (bookId: string) => void;
  onAddChapter?: (chapterId: string) => void;
  onAddPage?: (pageId: string) => void;
  onCreateOrganization?: () => void;
  onSelectItem?: (item: any, type: string) => void;
  ref?: React.RefObject<any>;
}

interface Tab {
  id: string;
  title: string;
  type: 'note' | 'code' | 'image' | 'video' | 'csv' | 'task' | 'other' | 'settings';
  content?: any;
  isActive: boolean;
  isRenaming?: boolean;
}

// Add interface for ref methods
interface MainContentRef {
  openSettingsTab: () => void;
}

const MainContent = forwardRef<MainContentRef, MainContentProps>((props, ref) => {
  const {
    selectedItem,
    selectedType,
    currentTime,
    wordCount = 0,
    charCount = 0,
    onEditorStatsChange,
    onRefreshContent,
    onAddProject,
    onAddBook,
    onAddChapter,
    onAddPage,
    onCreateOrganization,
    onSelectItem
  } = props;

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [showEmptyState, setShowEmptyState] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTabTypeDropdown, setShowTabTypeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const newTabButtonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useTheme();
  const [matrixSettings, setMatrixSettings] = useState({
    intensity: 50,
    speed: 50,
    colorScheme: 'gold' as const,
    density: 0.5,
    enabled: true
  });
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        newTabButtonRef.current && 
        !newTabButtonRef.current.contains(event.target as Node)
      ) {
        setShowTabTypeDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle selection changes
  useEffect(() => {
    if (selectedItem && selectedType) {
      loadContentData(selectedItem, selectedType)
      
      if (selectedType === 'page') {
        const tabExists = tabs.some(tab => tab.id === selectedItem.id)
        
        if (!tabExists) {
          // Get the correct type based on the page's type
          const pageType = getFileType(selectedItem)
          
          const newTab: Tab = {
            id: selectedItem.id,
            title: selectedItem.title || selectedItem.name || 'Untitled',
            type: pageType,
            isActive: true
          }
          
          const updatedTabs = tabs.map(tab => ({
            ...tab,
            isActive: false
          }))
          
          setTabs([...updatedTabs, newTab])
          setShowEmptyState(false)
        } else {
          const updatedTabs = tabs.map(tab => ({
            ...tab,
            isActive: tab.id === selectedItem.id
          }))
          
          setTabs(updatedTabs)
          setShowEmptyState(false)
        }
      }
    }
  }, [selectedItem, selectedType])
  
  // Function to load content data from database
  const loadContentData = async (item: any, type: string) => {
    if (!window.electronAPI || !item || !item.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`Loading data for ${type} with ID ${item.id}`)
      
      switch (type) {
        case 'page': {
          // Get the page data including metadata
          const pageData = await window.electronAPI.getPage(item.id)
          if (!pageData) {
            setError('Failed to load page data')
            return
          }
          
          // Get the page type
          const pageType = getFileType(pageData)
          
          // Check if tab exists
          const tabExists = tabs.some(tab => tab.id === item.id)
          
          if (!tabExists) {
            const newTab: Tab = {
              id: item.id,
              title: pageData.title || 'Untitled',
              type: pageType,
              content: pageData,
              isActive: true
            }
            
            const updatedTabs = tabs.map(tab => ({
              ...tab,
              isActive: false
            }))
            
            setTabs([...updatedTabs, newTab])
            setShowEmptyState(false)
          } else {
            // Update existing tab
            const updatedTabs = tabs.map(tab => ({
              ...tab,
              isActive: tab.id === item.id,
              content: tab.id === item.id ? pageData : tab.content
            }))
            
            setTabs(updatedTabs)
          }
          break
        }
        case 'organization': {
          // Load projects for this organization
          const result = await window.electronAPI.getProjects(item.id);
          if (result.success) {
            console.log(`Loaded ${result.projects?.length || 0} projects for organization ${item.id}`);
            // We don't need to update the UI since we're not displaying the projects view
          } else {
            setError(result.error || 'Failed to load projects');
          }
          break;
        }
        case 'project': {
          // Load books for this project
          const result = await window.electronAPI.getBooks(item.id);
          if (result.success) {
            console.log(`Loaded ${result.books?.length || 0} books for project ${item.id}`);
            // We don't need to update the UI since we're not displaying the books view
          } else {
            setError(result.error || 'Failed to load books');
          }
          break;
        }
        case 'book': {
          // Load chapters for this book
          const result = await window.electronAPI.getChapters(item.id);
          if (result.success) {
            console.log(`Loaded ${result.chapters?.length || 0} chapters for book ${item.id}`);
            // We don't need to update the UI since we're not displaying the chapters view
          } else {
            setError(result.error || 'Failed to load chapters');
          }
          break;
        }
        case 'chapter': {
          // Load pages for this chapter
          const result = await window.electronAPI.getPages(item.id);
          if (result.success) {
            console.log(`Loaded ${result.pages?.length || 0} pages for chapter ${item.id}`);
            // We don't need to update the UI since we're not displaying the pages view
          } else {
            setError(result.error || 'Failed to load pages');
          }
          break;
        }
      }
    } catch (err) {
      console.error(`Error loading data for ${type} ${item.id}:`, err)
      setError(`Failed to load ${type} data`)
      window.electronAPI?.logError(String(err))
    } finally {
      setIsLoading(false)
    }
  };
  
  // Determine file type based on metadata or extension
  const getFileType = (item: any): Tab['type'] => {
    if (!item) return 'note'
    
    // First check the page_type property
    if (item.page_type) {
      const type = item.page_type.toLowerCase()
      switch (type) {
        case 'code': return 'code'
        case 'image': return 'image'
        case 'video': return 'video'
        case 'csv': return 'csv'
        case 'task': return 'task'
        case 'note': return 'note'
        default: return 'other'
      }
    }
    
    // If no page_type, try to determine from metadata
    if (item.metadata) {
      try {
        const metadata = typeof item.metadata === 'string' 
          ? JSON.parse(item.metadata) 
          : item.metadata
          
        if (metadata.mimeType) {
          if (metadata.mimeType.startsWith('image/')) return 'image'
          if (metadata.mimeType.startsWith('video/')) return 'video'
          if (metadata.mimeType === 'text/csv') return 'csv'
        }
        
        if (metadata.language) return 'code'
      } catch (e) {
        console.error('Error parsing metadata:', e)
      }
    }
    
    return 'note'
  };
  
  // Close a tab
  const closeTab = (tabId: string) => {
    // Find the tab to close
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    const isActiveTab = tabs[tabIndex].isActive;
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    
    // If we closed the active tab, activate another tab if available
    if (isActiveTab && newTabs.length > 0) {
      // Try to activate the tab to the left, or the first tab
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      newTabs[newActiveIndex].isActive = true;
    }
    
    setTabs(newTabs);
    
    // Show empty state if no tabs left
    if (newTabs.length === 0) {
      setShowEmptyState(true);
    }
  };
  
  // Activate a tab
  const activateTab = (tabId: string) => {
    const updatedTabs = tabs.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    }));
    
    setTabs(updatedTabs);
  };
  
  // Get the currently active tab
  const getActiveTab = () => {
    return tabs.find(tab => tab.isActive);
  };
  
  // Render tab icon based on type
  const renderTabIcon = (type: Tab['type']) => {
    switch (type) {
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'code':
        return <Code className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'task':
        return <ListChecks className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };
  
  // Create a new empty tab
  const createNewFile = async (type: Tab['type'] = 'note') => {
    if (!window.electronAPI) {
      setError('Application error: API not available')
      return
    }
    
    try {
      setIsLoading(true)
      
      const parentId = activeChapterId || ''
      
      if (!parentId) {
        setError('Please select a chapter first to create a new file')
        setIsLoading(false)
        return
      }
      
      // Create a temporary title that can be renamed
      const tempTitle = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`
      
      // Initialize metadata based on type
      const metadata: any = {
        lastModified: new Date().toISOString()
      }
      
      // Add type-specific metadata
      switch (type) {
        case 'image':
          metadata.mimeType = 'image/*'
          break
        case 'code':
          metadata.language = 'typescript' // Default language
          break
        case 'video':
          metadata.mimeType = 'video/*'
          break
        case 'csv':
          metadata.mimeType = 'text/csv'
          break
      }
      
      const result = await window.electronAPI.createPage({
        title: tempTitle,
        chapter_id: parentId,
        content: '',
        page_type: type,
        metadata
      })
      
      if (result.success && result.page) {
        const newTab: Tab = {
          id: result.page.id,
          title: tempTitle,
          type: type,
          isActive: true,
          isRenaming: true
        }
        
        // Set all other tabs as inactive
        const updatedTabs = tabs.map(tab => ({
          ...tab,
          isActive: false
        }))
        
        // Add the new tab
        setTabs([...updatedTabs, newTab])
        setShowEmptyState(false)
        
        // Update the selected item and type
        if (onSelectItem) {
          onSelectItem(result.page, 'page')
        }
      } else {
        setError(result.error || 'Failed to create new file')
      }
    } catch (err) {
      console.error('Failed to create new file:', err)
      setError('Failed to create new file')
      window.electronAPI?.logError(String(err))
    } finally {
      setIsLoading(false)
    }
  };

  // Get the active chapter ID from the selected item
  const activeChapterId = selectedItem?.chapter_id || 
                         (selectedType === 'chapter' ? selectedItem?.id : null);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openSettingsTab: () => {
      // Check if settings tab already exists
      const settingsTab = tabs.find(tab => tab.type === 'settings');
      if (settingsTab) {
        // Activate existing settings tab
        activateTab(settingsTab.id);
        return;
      }

      // Create new settings tab with properly initialized content
      const newTab: Tab = {
        id: 'settings-tab',
        title: 'Settings',
        type: 'settings',
        content: {
          matrixSettings: {
            intensity: matrixSettings.intensity,
            speed: matrixSettings.speed,
            colorScheme: matrixSettings.colorScheme,
            density: matrixSettings.density,
            enabled: matrixSettings.enabled
          },
          onMatrixSettingsChange: (newSettings: any) => {
            setMatrixSettings(newSettings);
            // Update the tab content to reflect the new settings
            setTabs(prevTabs => prevTabs.map(tab => 
              tab.id === 'settings-tab' 
                ? { ...tab, content: { ...tab.content, matrixSettings: newSettings } }
                : tab
            ));
          }
        },
        isActive: true
      };

      // Set all other tabs as inactive
      const updatedTabs = tabs.map(tab => ({
        ...tab,
        isActive: false
      }));

      setTabs([...updatedTabs, newTab]);
      setShowEmptyState(false);
    }
  }));
  
  // Render empty state
  if (showEmptyState || tabs.length === 0) {
    return (
      <div className="content-area empty-editor-state">
        {/* Matrix Rain Background */}
        <div className="matrix-background">
          <MatrixRain 
            intensity={70}
            speed={50}
            colorScheme="gold"
            density={0.8}
            theme={theme}
          />
        </div>
        <div className="empty-editor-content">
                      <div className="mothercore-logo">
              {/* MotherCore Logo */}
              <Icon name="app-icon-main" size={120} className="mc-logo" />
            </div>
          <div className="empty-editor-actions">
            <div className="new-tab-container">
              <button 
                ref={newTabButtonRef}
                className="new-tab-button empty-state-button"
                onClick={() => setShowTabTypeDropdown(!showTabTypeDropdown)}
                disabled={!activeChapterId || isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Tab
              </button>
              
              {showTabTypeDropdown && (
                <div ref={dropdownRef} className="tab-type-dropdown">
                  <div 
                    className="tab-type-option" 
                    onClick={() => {
                      createNewFile('note');
                      setShowTabTypeDropdown(false);
                    }}
                  >
                    <span className="tab-type-icon">
                      <FileText size={14} />
                    </span>
                    <span className="tab-type-label">Note</span>
                  </div>
                  <div 
                    className="tab-type-option"
                    onClick={() => {
                      createNewFile('code');
                      setShowTabTypeDropdown(false);
                    }}
                  >
                    <span className="tab-type-icon">
                      <Code size={14} />
                    </span>
                    <span className="tab-type-label">Code</span>
                  </div>
                  <div 
                    className="tab-type-option"
                    onClick={() => {
                      createNewFile('image');
                      setShowTabTypeDropdown(false);
                    }}
                  >
                    <span className="tab-type-icon">
                      <ImageIcon size={14} />
                    </span>
                    <span className="tab-type-label">Image</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Show loading indicator or error if applicable */}
          {isLoading && (
            <div className="mt-4 text-matrix-amber">
              Loading data...
            </div>
          )}
          {error && (
            <div className="mt-4 text-matrix-error">
              {error}
            </div>
          )}
          {!activeChapterId && !error && !isLoading && (
            <div className="mt-4 text-matrix-amber">
              Select a chapter in the navigation tree to create new content
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Get active tab
  const activeTab = getActiveTab();
  
  // Update the tab content rendering
  const renderTabContent = (tab: Tab) => {
    // If we have no content yet, show loading
    if (!tab.content && tab.type !== 'settings') {
      return <div className="loading">Loading...</div>
    }
    
    switch (tab.type) {
      case 'settings':
        return (
          <div className="settings-tab-container">
            <ErrorBoundary fallback={<div>Error loading settings</div>}>
              <SettingsPage
                onClose={() => closeTab(tab.id)}
                matrixSettings={tab.content?.matrixSettings}
                onMatrixSettingsChange={tab.content?.onMatrixSettingsChange}
              />
            </ErrorBoundary>
          </div>
        )
        
      case 'note':
        return (
          <ErrorBoundary fallback={<div>Error loading note editor</div>}>
            <PageEditor 
              pageId={tab.id} 
              onStatsChange={onEditorStatsChange}
            />
          </ErrorBoundary>
        )
        
      case 'code':
        return (
          <ErrorBoundary fallback={<div>Error loading code editor</div>}>
            <CodeEditor 
              pageId={tab.id}
              language={tab.content?.metadata?.language || 'typescript'}
            />
          </ErrorBoundary>
        )
        
      case 'image':
        return (
          <ErrorBoundary fallback={<div>Error loading image viewer</div>}>
            <ImageViewer 
              pageId={tab.id}
            />
          </ErrorBoundary>
        )
        
      case 'video':
        return <div className="video-player">
          <div className="video-player-placeholder">
            Video Player (Placeholder)
          </div>
        </div>;
      case 'csv':
        return <div className="csv-viewer">
          <div className="csv-viewer-placeholder">
            CSV/Table Viewer (Placeholder)
          </div>
        </div>;
      case 'task':
        return <div className="task-view">
          <div className="task-view-placeholder">
            Task View (Placeholder)
          </div>
        </div>;
      case 'other':
        return <div className="generic-file-view">
          <div className="generic-file-placeholder">
            File Viewer (Placeholder)
          </div>
        </div>;
      default:
        return (
          <div className="unsupported-file-type">
            <div className="placeholder">
              Unsupported file type: {tab.type}
            </div>
          </div>
        )
    }
  };
  
  return (
    <div className="main-content">
      {/* Matrix rain as background when no content */}
      {(showEmptyState || tabs.length === 0) && (
        <div className="matrix-rain-container">
          <MatrixRain 
            intensity={70}
            speed={50}
            colorScheme="gold"
            density={0.8}
            theme={theme}
          />
        </div>
      )}

      {/* Tabs Bar */}
      <div className="tabs-bar">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            className={`tab ${tab.isActive ? 'active' : ''}`}
            onClick={() => activateTab(tab.id)}
          >
            <div className="tab-content">
              {renderTabIcon(tab.type)}
              {tab.isRenaming ? (
                <input
                  type="text"
                  value={tab.title}
                  onChange={(e) => {
                    const updatedTabs = tabs.map(t => 
                      t.id === tab.id ? { ...t, title: e.target.value } : t
                    )
                    setTabs(updatedTabs)
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const result = await window.electronAPI?.updatePage({
                        id: tab.id,
                        title: tab.title
                      })
                      if (result?.success) {
                        const updatedTabs = tabs.map(t => 
                          t.id === tab.id ? { ...t, isRenaming: false } : t
                        )
                        setTabs(updatedTabs)
                      }
                    }
                  }}
                  onBlur={async () => {
                    const result = await window.electronAPI?.updatePage({
                      id: tab.id,
                      title: tab.title
                    })
                    if (result?.success) {
                      const updatedTabs = tabs.map(t => 
                        t.id === tab.id ? { ...t, isRenaming: false } : t
                      )
                      setTabs(updatedTabs)
                    }
                  }}
                  className="tab-title-input"
                  autoFocus
                />
              ) : (
                <span className="tab-title">{tab.title}</span>
              )}
            </div>
            <button 
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {/* Only show new tab button if we're not on settings */}
        {!tabs.find(tab => tab.id === 'settings') && (
          <div className="new-tab-container">
            <button 
              ref={newTabButtonRef}
              className="new-tab-button"
              onClick={() => setShowTabTypeDropdown(!showTabTypeDropdown)}
              disabled={!activeChapterId || isLoading}
            >
              <Plus className="w-4 h-4" />
            </button>
            
            {showTabTypeDropdown && (
              <div ref={dropdownRef} className="tab-type-dropdown">
                <div 
                  className="tab-type-option" 
                  onClick={() => {
                    createNewFile('note');
                    setShowTabTypeDropdown(false);
                  }}
                >
                  <span className="tab-type-icon">
                    <FileText size={14} />
                  </span>
                  <span className="tab-type-label">Note</span>
                </div>
                <div 
                  className="tab-type-option"
                  onClick={() => {
                    createNewFile('code');
                    setShowTabTypeDropdown(false);
                  }}
                >
                  <span className="tab-type-icon">
                    <Code size={14} />
                  </span>
                  <span className="tab-type-label">Code</span>
                </div>
                <div 
                  className="tab-type-option"
                  onClick={() => {
                    createNewFile('image');
                    setShowTabTypeDropdown(false);
                  }}
                >
                  <span className="tab-type-icon">
                    <ImageIcon size={14} />
                  </span>
                  <span className="tab-type-label">Image</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="tab-content-area">
        {activeTab && renderTabContent(activeTab)}
      </div>
    </div>
  );
});

MainContent.displayName = 'MainContent';

export default MainContent; 


