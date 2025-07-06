import React from 'react'
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
  LayoutGrid
} from 'lucide-react';
import PageEditor from './page-editor';
import CodeEditor from './code-editor';
import ImageViewer from './image-viewer';
import MatrixRain from '../effects/matrix-rain';
import Icon from '../ui/Icon';
import { useTheme } from '../../context/ThemeContext';

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
}

interface Tab {
  id: string;
  title: string;
  type: 'note' | 'code' | 'image' | 'video' | 'csv' | 'task' | 'other';
  content?: any;
  isActive: boolean;
}

const MainContent: FC<MainContentProps> = ({ 
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
}) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [showEmptyState, setShowEmptyState] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTabTypeDropdown, setShowTabTypeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const newTabButtonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useTheme();
  
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
      // Load data from database based on selectedType
      loadContentData(selectedItem, selectedType);
      
      // Only create tabs for page-level items
      if (selectedType === 'page') {
        // Check if tab already exists
        const tabExists = tabs.some(tab => tab.id === selectedItem.id);
        
        if (!tabExists) {
          // Create a new tab
          const newTab: Tab = {
            id: selectedItem.id,
            title: selectedItem.title || selectedItem.name || 'Untitled',
            type: getFileType(selectedItem),
            isActive: true
          };
          
          // Set all other tabs as inactive
          const updatedTabs = tabs.map(tab => ({
            ...tab,
            isActive: false
          }));
          
          // Add the new tab
          setTabs([...updatedTabs, newTab]);
          setShowEmptyState(false);
        } else {
          // Set this tab as active
          const updatedTabs = tabs.map(tab => ({
            ...tab,
            isActive: tab.id === selectedItem.id
          }));
          
          setTabs(updatedTabs);
          setShowEmptyState(false);
        }
      }
    }
  }, [selectedItem, selectedType]);
  
  // Function to load content data from database
  const loadContentData = async (item: any, type: string) => {
    if (!window.electronAPI || !item || !item.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Loading data for ${type} with ID ${item.id}`);
      
      switch (type) {
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
        case 'page': {
          // Page content is loaded by the PageEditor component
          console.log(`Page ${item.id} will be loaded by PageEditor component`);
          break;
        }
      }
    } catch (err) {
      console.error(`Error loading data for ${type} ${item.id}:`, err);
      setError(`Failed to load ${type} data`);
      window.electronAPI?.logError(String(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine file type based on metadata or extension
  const getFileType = (item: any): Tab['type'] => {
    if (!item) return 'note';
    
    if (item.page_type === 'code') return 'code';
    if (item.page_type === 'image') return 'image';
    if (item.page_type === 'video') return 'video';
    if (item.page_type === 'csv') return 'csv';
    if (item.page_type === 'task') return 'task';
    
    // Default to note
    return 'note';
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
      default:
        return <File className="w-4 h-4" />;
    }
  };
  
  // Create a new empty tab
  const createNewTab = async (type: Tab['type'] = 'note') => {
    if (!window.electronAPI) {
      setError('Application error: API not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a new page in the database
      // If we have an active chapter, use that as the parent
      const parentId = activeChapterId || '';
      
      if (!parentId) {
        setError('Please select a chapter first to create a new page');
        setIsLoading(false);
        return;
      }
      
      const pageType = type === 'note' ? 'note' : 
                       type === 'code' ? 'code' : 
                       type === 'image' ? 'image' : 'note';
      
      const pageName = type === 'note' ? 'New Note' : 
                       type === 'code' ? 'New Code File' : 
                       type === 'image' ? 'New Image' : 'New File';
      
      const result = await window.electronAPI.createPage({
        title: pageName,
        chapter_id: parentId,
        content: '',
        page_type: pageType
      });
      
      if (result.success && result.page) {
        // Create a new tab for this page
        const newTab: Tab = {
          id: result.page.id,
          title: result.page.title || pageName,
          type: type,
          isActive: true
        };
        
        // Set all other tabs as inactive
        const updatedTabs = tabs.map(tab => ({
          ...tab,
          isActive: false
        }));
        
        // Add the new tab
        setTabs([...updatedTabs, newTab]);
        setShowEmptyState(false);
        
        // Also update the selected item and type
        if (onSelectItem) {
          onSelectItem(result.page, 'page');
        }
      } else {
        setError(result.error || 'Failed to create new page');
      }
    } catch (err) {
      console.error('Failed to create new tab:', err);
      setError('Failed to create new tab');
      window.electronAPI?.logError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Get the active chapter ID from the selected item
  const activeChapterId = selectedItem?.chapter_id || 
                         (selectedType === 'chapter' ? selectedItem?.id : null);
  
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
                      createNewTab('note');
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
                      createNewTab('code');
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
                      createNewTab('image');
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
  
  return (
    <div className="content-area">
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
              <span className="tab-title">{tab.title}</span>
            </div>
            <button 
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
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
                  createNewTab('note');
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
                  createNewTab('code');
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
                  createNewTab('image');
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
        
        <div className="tabs-actions">
          <button className="tab-action">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="tab-content-area">
        {activeTab?.type === 'note' && <PageEditor 
          pageId={activeTab.id} 
          onStatsChange={onEditorStatsChange}
        />}
        {activeTab?.type === 'code' && <CodeEditor 
          pageId={activeTab.id}
        />}
        {activeTab?.type === 'image' && <ImageViewer 
          pageId={activeTab.id}
        />}
        {activeTab?.type === 'video' && (
          <div className="video-player">
            <div className="video-player-placeholder">
              Video Player (Placeholder)
            </div>
          </div>
        )}
        {activeTab?.type === 'csv' && (
          <div className="csv-viewer">
            <div className="csv-viewer-placeholder">
              CSV/Table Viewer (Placeholder)
            </div>
          </div>
        )}
        {activeTab?.type === 'task' && (
          <div className="task-view">
            <div className="task-view-placeholder">
              Task View (Placeholder)
            </div>
          </div>
        )}
        {activeTab?.type === 'other' && (
          <div className="generic-file-view">
            <div className="generic-file-placeholder">
              File Viewer (Placeholder)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent; 


