import React, { useState, useEffect } from 'react';
import { FileText, Calendar, User, Hash, Book, Folder, Star, Tag, Clock, Plus, Download, Trash, RefreshCw, Save, Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import PageEditor from './page-editor';

interface MainContentProps {
  selectedItem: any;
  selectedType: string;
  onAddProject?: (projectId: string) => void;
  onAddBook?: (bookId: string) => void;
  onAddChapter?: (chapterId: string) => void;
  onAddPage?: (pageId: string) => void;
}

function MainContent({ selectedItem, selectedType, onAddProject, onAddBook, onAddChapter, onAddPage }: MainContentProps) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (selectedItem && selectedType) {
      loadContent();
    }
  }, [selectedItem, selectedType]);

  async function loadContent() {
    if (!selectedItem || !window.electronAPI) return;

    setLoading(true);
    setError(null);
    console.log(`Loading content for ${selectedType} with ID ${selectedItem.id}`);

    try {
      switch (selectedType) {
        case 'organization':
          // Load projects
          const projectsResult = await window.electronAPI.getProjects(selectedItem.id);
          console.log(`Retrieved ${projectsResult.projects?.length || 0} projects for org ${selectedItem.id}`, projectsResult);
          if (projectsResult.success) {
            setContent({
              ...selectedItem,
              projects: projectsResult.projects || []
            });
          }
          break;
        case 'project':
          // Load books
          const booksResult = await window.electronAPI.getBooks(selectedItem.id);
          console.log(`Retrieved ${booksResult.books?.length || 0} books for project ${selectedItem.id}`, booksResult);
          if (booksResult.success) {
            setContent({
              ...selectedItem,
              books: booksResult.books || []
            });
          }
          break;
        case 'book':
          // Load chapters
          const chaptersResult = await window.electronAPI.getChapters(selectedItem.id);
          console.log(`Retrieved ${chaptersResult.chapters?.length || 0} chapters for book ${selectedItem.id}`, chaptersResult);
          if (chaptersResult.success) {
            setContent({
              ...selectedItem,
              chapters: chaptersResult.chapters || []
            });
          }
          break;
        case 'chapter':
          // Load pages
          const pagesResult = await window.electronAPI.getPages(selectedItem.id);
          console.log(`Retrieved ${pagesResult.pages?.length || 0} pages for chapter ${selectedItem.id}`, pagesResult);
          if (pagesResult.success) {
            setContent({
              ...selectedItem,
              pages: pagesResult.pages || []
            });
          }
          break;
        case 'page':
          // Load page content
          const pageResult = await window.electronAPI.getPageContent(selectedItem.id);
          console.log(`Retrieved content for page ${selectedItem.id}`, pageResult);
          if (pageResult.success) {
            setContent({
              ...selectedItem,
              content: pageResult.content
            });
          }
          break;
      }
    } catch (err) {
      console.error('Failed to load content:', err);
      setError(`Failed to load ${selectedType} content`);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (action: string) => {
    if (!selectedItem || !window.electronAPI) return;

    switch (action) {
      case 'refresh':
        loadContent();
        break;
      case 'favorite':
        // Implement favorite functionality
        console.log(`Favorite ${selectedType} with ID ${selectedItem.id}`);
        break;
      case 'edit':
        // Implement edit functionality
        console.log(`Edit ${selectedType} with ID ${selectedItem.id}`);
        break;
      case 'export':
        // Implement export functionality
        console.log(`Export ${selectedType} with ID ${selectedItem.id}`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete this ${selectedType}? This action cannot be undone.`)) {
          // Implement delete functionality
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

  if (!selectedItem) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-icon">⚡</div>
          <h2 className="welcome-title">Welcome to MOTHERCORE</h2>
          <p className="welcome-subtitle">
            Organize your knowledge with a hierarchical structure designed for deep learning and easy retrieval.
          </p>
          <div className="welcome-features">
            <p>• Create organizations to group related projects</p>
            <p>• Build books with chapters and sections</p>
            <p>• Rich text editing with multimedia support</p>
            <p>• Local-first with powerful search capabilities</p>
            <p>• Export your knowledge in multiple formats</p>
          </div>
          <div className="welcome-actions">
            <button className="welcome-button primary">
              Create Your First Collection
            </button>
            <button className="welcome-button secondary">
              Take a Tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="detail-view fade-in flex items-center justify-center min-h-[300px]">
        <div className="loading-spinner"></div>
        <p className="ml-3 text-matrix-amber">Loading {selectedType} data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="detail-view fade-in bg-matrix-black bg-opacity-70">
        <div className="error-container p-4 border border-matrix-error bg-matrix-error bg-opacity-10 rounded flex items-center">
          <AlertTriangle className="text-matrix-error w-6 h-6 mr-3" />
          <div>
            <h3 className="text-matrix-error text-lg mb-2">Error</h3>
            <p className="text-matrix-error">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-matrix-error bg-opacity-20 hover:bg-opacity-30 rounded flex items-center"
              onClick={loadContent}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-view fade-in bg-matrix-black bg-opacity-70 h-full overflow-auto">
      {/* Header */}
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

      {/* Description */}
      {selectedItem.description && (
        <p className="detail-description p-4 text-matrix-amber bg-matrix-black bg-opacity-40">{selectedItem.description}</p>
      )}

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Details Panel */}
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

        {/* Actions Panel */}
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

      {/* Content Preview Area */}
      <div className="info-panel mt-4 mx-4 mb-4 bg-matrix-black bg-opacity-60 border border-matrix-gold border-opacity-20 rounded-lg p-4">
        <h3 className="info-panel-title flex items-center mb-4 text-matrix-gold font-semibold">
          <Book className="w-4 h-4 mr-2" />
          {selectedType === 'page' ? 'Content' : 'Content Preview'}
        </h3>
        
        {/* Display appropriate content based on type */}
        <div className="content-preview">
          {/* Page Editor Integration */}
          {selectedType === 'page' && selectedItem && (
            <div className="page-editor-container bg-matrix-black bg-opacity-50 border border-matrix-gold border-opacity-10 rounded">
              <PageEditor 
                pageId={selectedItem.id}
                initialContent={content?.content || ''}
                onStatsChange={(stats) => {
                  console.log('Page stats:', stats);
                  // Forward stats to parent component if needed
                  // Note: updatePageStats may not be implemented yet in the API
                  if (typeof window !== 'undefined' && window.electronAPI) {
                    // Just log the stats for now since updatePageStats isn't implemented
                    console.log('Would update page stats:', selectedItem.id, stats.words, stats.characters);
                  }
                }}
              />
            </div>
          )}
          
          {/* Organization - show projects */}
          {selectedType === 'organization' && content?.projects && (
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
          
          {/* Project - show books */}
          {selectedType === 'project' && content?.books && (
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
          
          {/* Book - show chapters */}
          {selectedType === 'book' && content?.chapters && (
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
          
          {/* Chapter - show pages */}
          {selectedType === 'chapter' && content?.pages && (
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
          
          {/* Default empty state */}
          {!content || (
            selectedType === 'organization' && (!content.projects || content.projects.length === 0) ||
            selectedType === 'project' && (!content.books || content.books.length === 0) ||
            selectedType === 'book' && (!content.chapters || content.chapters.length === 0) ||
            selectedType === 'chapter' && (!content.pages || content.pages.length === 0) ||
            selectedType === 'page' && !content.content
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
}

export default MainContent; 