import React from 'react'
import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';;
import { 
  FileText, 
  User, 
  Hash, 
  Book, 
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image,
  Code,
  Link,
  Table,
  Save,
  PanelLeft,
  PanelRight,
  Settings,
  Plus,
  Star,
  Download,
  Trash,
  RefreshCw,
  CheckCircle,
  Clock,
  Tag,
  Folder,
  Edit
} from 'lucide-react';
import PageEditor from './page-editor';

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
}

// Define content type interfaces
interface ContentData {
  projects?: any[];
  books?: any[];
  chapters?: any[];
  pages?: any[];
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
  onAddPage 
}) => {
  const [content, setContent] = useState<string | ContentData>('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  
  useEffect(() => {
    if (selectedItem && selectedType === 'page') {
      loadPageContent(selectedItem.id);
    } else {
      setContent('');
    }
  }, [selectedItem, selectedType]);

  const loadPageContent = async (pageId: string) => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getPage(pageId);
        if (result.success && result.page) {
          setContent(result.page.content || '# New page\n\nStart writing your content here...');
        }
      }
    } catch (error) {
      console.error('Error loading page content:', error);
    }
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerText;
    setContent(newContent);
  };

  const handleSave = async () => {
    if (!selectedItem || selectedType !== 'page') return;

    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('Saving...');

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.updatePage({
          id: selectedItem.id,
          content: typeof content === 'string' ? content : JSON.stringify(content)
        });
        if (result.success) {
          setSaveStatus('saved');
          setSaveMessage('Saved successfully');
          setTimeout(() => {
            setSaveStatus('idle');
            setSaveMessage('');
          }, 3000);
        } else {
          setSaveStatus('error');
          setSaveMessage(result.error || 'Failed to save');
        }
      }
    } catch (error) {
      console.error('Error saving page:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!selectedItem || !window.electronAPI) return;

    switch (action) {
      case 'refresh':
        loadPageContent(selectedItem.id);
        break;
      case 'favorite':
        console.log(`Favorite ${selectedType} with ID ${selectedItem.id}`);
        break;
      case 'edit':
        console.log(`Edit ${selectedType} with ID ${selectedItem.id}`);
        break;
      case 'export':
        console.log(`Export ${selectedType} with ID ${selectedItem.id}`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete this ${selectedType}? This action cannot be undone.`)) {
          console.log(`Delete ${selectedType} with ID ${selectedItem.id}`);
        }
        break;
      case 'add':
        if (selectedType === 'organization' && onAddProject) {
          onAddProject(selectedItem.id);
        } else if (selectedType === 'project' && onAddBook) {
          onAddBook(selectedItem.id);
        } else if (selectedType === 'book' && onAddChapter) {
          onAddChapter(selectedItem.id);
        } else if (selectedType === 'chapter' && onAddPage) {
          onAddPage(selectedItem.id);
        }
        break;
    }
  };

  // Type guard to check if content is ContentData
  const isContentData = (content: string | ContentData): content is ContentData => {
    return typeof content !== 'string' && content !== null && typeof content === 'object';
  };

  // Helper function to render content safely
  const renderContent = () => {
    if (typeof content === 'string') {
      return content;
    } else if (isContentData(content)) {
      // If it's a ContentData object, return empty string as we'll render it differently
      return '';
    }
    return '';
  };

  if (!selectedItem) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-icon">📚</div>
          <h2 className="welcome-title">Welcome to MotherCore</h2>
          <p className="welcome-subtitle">
            Your personal knowledge repository with a hierarchical structure designed for deep learning and easy retrieval.
          </p>
          <div className="welcome-features">
            <p>• Create organizations to group related projects</p>
            <p>• Build books with chapters and pages</p>
            <p>• Rich text editing with multimedia support</p>
            <p>• Local-first with powerful search capabilities</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedType === 'page') {
    return (
      <div className="editor-container">
        <div className="editor-header">
          <div className="editor-tab active">
            <FileText className="w-4 h-4 mr-2" />
            {selectedItem.title || 'Untitled Page'}
          </div>
          <div className="editor-tab">
            <Code className="w-4 h-4 mr-2" />
            Preview
          </div>
          <div className="editor-tab">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </div>
          <div className="ml-auto flex items-center">
            <button className="editor-tab" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <PanelLeft className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="editor-toolbar">
          <button className="toolbar-button" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button className="toolbar-button" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button className="toolbar-button" title="Underline">
            <Underline className="w-4 h-4" />
          </button>
          
          <div className="toolbar-divider"></div>
          
          <button className="toolbar-button" title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button className="toolbar-button" title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </button>
          
          <div className="toolbar-divider"></div>
          
          <button className="toolbar-button" title="Insert Link">
            <Link className="w-4 h-4" />
          </button>
          <button className="toolbar-button" title="Insert Image">
            <Image className="w-4 h-4" />
          </button>
          <button className="toolbar-button" title="Insert Table">
            <Table className="w-4 h-4" />
          </button>
          <button className="toolbar-button" title="Insert Code Block">
            <Code className="w-4 h-4" />
          </button>
          
          <div className="toolbar-divider"></div>
          
          <button className="toolbar-button" onClick={handleSave} title="Save">
            <Save className="w-4 h-4" />
          </button>
        </div>

        <div className="editor-content">
          {showPreview ? (
            <div className="flex h-full">
              <div className="w-1/2 pr-2 border-r border-gold/20">
                <div 
                  ref={editorRef}
                  className="text-editor"
                  contentEditable={true}
                  onInput={handleContentChange}
                  suppressContentEditableWarning={true}
                  spellCheck={false}
                >
                  {renderContent()}
                </div>
              </div>
              <div className="w-1/2 pl-2 prose prose-invert prose-gold">
                <div className="whitespace-pre-wrap">{renderContent()}</div>
              </div>
            </div>
          ) : (
            <div 
              ref={editorRef}
              className="text-editor"
              contentEditable={true}
              onInput={handleContentChange}
              suppressContentEditableWarning={true}
              spellCheck={false}
            >
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="detail-view fade-in bg-matrix-black bg-opacity-70 h-full overflow-auto">
      <div className="detail-header bg-matrix-black bg-opacity-60 p-4 border-b border-matrix-gold border-opacity-30">
        <div className="detail-title-container">
          <h2 className="detail-title text-matrix-gold text-2xl">{selectedItem.name || selectedItem.title}</h2>
          <span className="detail-type-badge px-2 py-0.5 bg-matrix-gold bg-opacity-20 text-matrix-gold rounded-full text-xs uppercase">{selectedType}</span>
        </div>
        <div className="detail-actions flex space-x-2">
          <button 
            className="detail-action-button px-3 py-1.5 bg-matrix-amber bg-opacity-20 hover:bg-opacity-30 text-matrix-amber rounded flex items-center"
            onClick={() => handleAction('refresh')}
            title="Refresh content"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
          <button 
            className="detail-action-button px-3 py-1.5 bg-matrix-amber bg-opacity-20 hover:bg-opacity-30 text-matrix-amber rounded flex items-center"
            onClick={() => handleAction('favorite')}
          >
            <Star className="w-4 h-4 mr-1" />
            Favorite
          </button>
          <button 
            className="detail-action-button primary px-3 py-1.5 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded flex items-center"
            onClick={() => handleAction('add')}
          >
            <Plus className="w-4 h-4 mr-1" />
            New {selectedType === 'organization' ? 'Project' : 
               selectedType === 'project' ? 'Book' : 
               selectedType === 'book' ? 'Chapter' : 
               selectedType === 'chapter' ? 'Page' : 'Note'}
          </button>
        </div>
      </div>

      {selectedItem.description && (
        <p className="detail-description p-4 text-matrix-amber bg-matrix-black bg-opacity-40">{selectedItem.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="info-panel col-span-1 bg-matrix-black bg-opacity-60 border border-matrix-gold border-opacity-20 rounded-lg p-4">
          <h3 className="info-panel-title flex items-center mb-4 text-matrix-gold font-semibold">
            <FileText className="w-4 h-4 mr-2" />
            Details
          </h3>
          <div className="space-y-2">
            <div className="info-item flex justify-between">
              <span className="info-label text-matrix-amber">Type:</span>
              <span className="info-value text-white">{selectedType}</span>
            </div>
            <div className="info-item flex justify-between">
              <span className="info-label text-matrix-amber">ID:</span>
              <span className="info-value text-white text-sm font-mono">{selectedItem.id}</span>
            </div>
            {selectedItem.created_at && (
              <div className="info-item flex justify-between">
                <span className="info-label text-matrix-amber">Created:</span>
                <span className="info-value text-white">
                  {new Date(selectedItem.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
            {selectedItem.updated_at && (
              <div className="info-item flex justify-between">
                <span className="info-label text-matrix-amber">Updated:</span>
                <span className="info-value text-white">
                  {new Date(selectedItem.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="info-panel col-span-2 bg-matrix-black bg-opacity-60 border border-matrix-gold border-opacity-20 rounded-lg p-4">
          <h3 className="info-panel-title flex items-center mb-4 text-matrix-gold font-semibold">
            <Hash className="w-4 h-4 mr-2" />
            Actions
          </h3>
          <div className="action-buttons flex flex-wrap gap-2">
            <button 
              className="action-btn px-3 py-2 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded flex items-center"
              onClick={() => handleAction('add')}
            >
              <Folder className="w-4 h-4 mr-2" />
              Add {selectedType === 'organization' ? 'Project' : 
                   selectedType === 'project' ? 'Book' : 
                   selectedType === 'book' ? 'Chapter' : 
                   selectedType === 'chapter' ? 'Page' : 'Note'}
            </button>
            <button 
              className="action-btn px-3 py-2 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded flex items-center"
              onClick={() => handleAction('edit')}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Details
            </button>
            <button 
              className="action-btn px-3 py-2 bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold rounded flex items-center"
              onClick={() => handleAction('export')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button 
              className="action-btn danger px-3 py-2 bg-matrix-error bg-opacity-20 hover:bg-opacity-30 text-matrix-error rounded flex items-center"
              onClick={() => handleAction('delete')}
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4 py-2 bg-matrix-black bg-opacity-40 border-b border-matrix-gold border-opacity-20">
        <div className="flex items-center space-x-4 text-xs text-matrix-amber">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>{currentTime || new Date().toLocaleTimeString()}</span>
          </div>
          {selectedType === 'page' && (
            <>
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                <span>{charCount} chars</span>
              </div>
              {saveStatus === 'saved' && (
                <div className="flex items-center text-matrix-success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>Saved</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefreshContent}
            className="flex items-center px-2 py-1 text-xs text-matrix-gold hover:bg-matrix-gold hover:bg-opacity-20 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </button>
          {selectedType === 'page' && saveStatus !== 'saved' && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-2 py-1 text-xs text-matrix-gold hover:bg-matrix-gold hover:bg-opacity-20 rounded transition-colors disabled:opacity-50"
            >
              <Save className="w-3 h-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      <div className="info-panel mt-4 mx-4 mb-4 bg-matrix-black bg-opacity-60 border border-matrix-gold border-opacity-20 rounded-lg p-4">
        <h3 className="info-panel-title flex items-center mb-4 text-matrix-gold font-semibold">
          <Book className="w-4 h-4 mr-2" />
          {selectedType === 'page' ? 'Content' : 'Content Preview'}
        </h3>
        
        <div className="content-preview">
          {selectedType === 'page' && selectedItem && (
            <div className="page-editor-container bg-matrix-black bg-opacity-50 border border-matrix-gold border-opacity-10 rounded">
              <PageEditor 
                pageId={selectedItem.id}
                initialContent={typeof content === 'string' ? content : ''}
                onSave={handleSave}
                onStatsChange={onEditorStatsChange}
                isSaving={isSaving}
                saveStatus={saveStatus}
                saveMessage={saveMessage}
                wordCount={wordCount}
                charCount={charCount}
              />
            </div>
          )}
          
          {selectedType === 'organization' && isContentData(content) && content.projects && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.projects.map((project: any) => (
                <div 
                  key={project.id}
                  className="project-card bg-matrix-black bg-opacity-70 border border-matrix-gold border-opacity-20 hover:border-opacity-40 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-1"
                  onClick={() => {
                    window.electronAPI!.getBooks(project.id).then((result) => {
                      if (result.success) {
                        console.log(`Retrieved ${result.books?.length || 0} books for project ${project.id}`);
                      }
                    });
                  }}
                >
                  <h3 className="text-matrix-gold text-lg mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-matrix-amber text-sm mb-3">{project.description}</p>
                  )}
                  <div className="flex justify-between text-xs text-matrix-amber opacity-70">
                    <span>Project</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedType === 'project' && isContentData(content) && content.books && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.books.map((book: any) => (
                <div 
                  key={book.id}
                  className="book-card bg-matrix-black bg-opacity-70 border border-matrix-gold border-opacity-20 hover:border-opacity-40 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-1"
                >
                  <h3 className="text-matrix-gold text-lg mb-2">{book.name}</h3>
                  {book.description && (
                    <p className="text-matrix-amber text-sm mb-3">{book.description}</p>
                  )}
                  <div className="flex justify-between text-xs text-matrix-amber opacity-70">
                    <span>Book</span>
                    <span>{new Date(book.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedType === 'book' && isContentData(content) && content.chapters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.chapters.map((chapter: any) => (
                <div 
                  key={chapter.id}
                  className="chapter-card bg-matrix-black bg-opacity-70 border border-matrix-gold border-opacity-20 hover:border-opacity-40 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-1"
                >
                  <h3 className="text-matrix-gold text-lg mb-2">{chapter.name}</h3>
                  <div className="flex justify-between text-xs text-matrix-amber opacity-70">
                    <span>Chapter</span>
                    <span>{new Date(chapter.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedType === 'chapter' && isContentData(content) && content.pages && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.pages.map((page: any) => (
                <div 
                  key={page.id}
                  className="page-card bg-matrix-black bg-opacity-70 border border-matrix-gold border-opacity-20 hover:border-opacity-40 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-1"
                >
                  <h3 className="text-matrix-gold text-lg mb-2">{page.title}</h3>
                  <div className="flex justify-between text-xs text-matrix-amber opacity-70">
                    <span>Type: {page.page_type || 'note'}</span>
                    <span>{new Date(page.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {(!content || 
            (selectedType === 'organization' && (!isContentData(content) || !content.projects || content.projects.length === 0)) ||
            (selectedType === 'project' && (!isContentData(content) || !content.books || content.books.length === 0)) ||
            (selectedType === 'book' && (!isContentData(content) || !content.chapters || content.chapters.length === 0)) ||
            (selectedType === 'chapter' && (!isContentData(content) || !content.pages || content.pages.length === 0)) ||
            (selectedType === 'page' && !content)
          ) && (
            <div className="content-preview-placeholder flex flex-col items-center justify-center py-12">
              <Book className="w-16 h-16 mx-auto mb-4 text-matrix-gold opacity-50" />
              <p className="preview-text text-white mb-2">No content available</p>
              <p className="preview-subtext text-matrix-amber opacity-70">Create new content using the buttons above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainContent; 


