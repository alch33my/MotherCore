import React, { useState, useEffect } from 'react';
import { FileText, Calendar, User, Hash, Book, Folder, Star, Tag, Clock, Plus, Download, Trash } from 'lucide-react';

interface MainContentProps {
  selectedItem: any;
  selectedType: string;
}

function MainContent({ selectedItem, selectedType }: MainContentProps) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem && selectedType) {
      loadContent();
    }
  }, [selectedItem, selectedType]);

  async function loadContent() {
    if (!selectedItem || !window.electronAPI) return;

    setLoading(true);
    setError(null);

    try {
      switch (selectedType) {
        case 'organization':
          // Load projects
          const projectsResult = await window.electronAPI.getProjects(selectedItem.id);
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
      <div className="detail-view fade-in">
        <div className="error-container p-4 border border-matrix-error bg-matrix-error bg-opacity-10 rounded">
          <h3 className="text-matrix-error text-lg mb-2">Error</h3>
          <p className="text-matrix-error">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-matrix-error bg-opacity-20 hover:bg-opacity-30 rounded"
            onClick={loadContent}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-view fade-in">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-title-container">
          <h2 className="detail-title">{selectedItem.name || selectedItem.title}</h2>
          <span className="detail-type-badge">{selectedType}</span>
        </div>
        <div className="detail-actions">
          <button className="detail-action-button">
            <Star className="w-4 h-4 mr-1" />
            Favorite
          </button>
          <button className="detail-action-button primary">
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
        <p className="detail-description">{selectedItem.description}</p>
      )}

      {/* Information Grid */}
      <div className="detail-info">
        {/* Details Panel */}
        <div className="info-panel">
          <h3 className="info-panel-title">
            <FileText className="w-4 h-4" />
            Details
          </h3>
          <div className="space-y-2">
            <div className="info-item">
              <span className="info-label">Type:</span>
              <span className="info-value">{selectedType}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ID:</span>
              <span className="info-value">{selectedItem.id}</span>
            </div>
            {selectedItem.created_at && (
              <div className="info-item">
                <span className="info-label">Created:</span>
                <span className="info-value">
                  {new Date(selectedItem.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
            {selectedItem.updated_at && (
              <div className="info-item">
                <span className="info-label">Updated:</span>
                <span className="info-value">
                  {new Date(selectedItem.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Panel */}
        <div className="info-panel">
          <h3 className="info-panel-title">
            <Hash className="w-4 h-4" />
            Actions
          </h3>
          <div className="action-buttons">
            <button className="action-btn">
              <Folder className="w-4 h-4 mr-2" />
              Add {selectedType === 'organization' ? 'Project' : 
                   selectedType === 'project' ? 'Book' : 
                   selectedType === 'book' ? 'Chapter' : 
                   selectedType === 'chapter' ? 'Page' : 'Note'}
            </button>
            <button className="action-btn">
              <FileText className="w-4 h-4 mr-2" />
              Edit Details
            </button>
            <button className="action-btn">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="action-btn danger">
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Content Preview Area */}
      <div className="info-panel mt-6">
        <h3 className="info-panel-title">
          <Book className="w-4 h-4" />
          {selectedType === 'page' ? 'Content' : 'Content Preview'}
        </h3>
        
        {/* Display appropriate content based on type */}
        <div className="content-preview">
          {/* Organization - show projects */}
          {selectedType === 'organization' && content?.projects && (
            <>
              {content.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {content.projects.map((project: any) => (
                    <div key={project.id} className="project-card">
                      <div className="project-card-header">
                        <Folder className="w-5 h-5" style={{color: project.color || '#ffb000'}} />
                        <h4 className="project-card-title">{project.name}</h4>
                      </div>
                      {project.description && (
                        <p className="project-card-description">{project.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="content-preview-placeholder">
                  <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="preview-text">No projects yet</p>
                  <p className="preview-subtext">Create your first project to get started</p>
                </div>
              )}
            </>
          )}
          
          {/* Project - show books */}
          {selectedType === 'project' && content?.books && (
            <>
              {content.books.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {content.books.map((book: any) => (
                    <div key={book.id} className="book-card">
                      <div className="book-spine" style={{backgroundColor: book.spine_color || '#ffd700'}}></div>
                      <div className="book-card-content">
                        <h4 className="book-card-title">{book.name}</h4>
                        {book.description && (
                          <p className="book-card-description">{book.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="content-preview-placeholder">
                  <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="preview-text">No books yet</p>
                  <p className="preview-subtext">Create your first book to get started</p>
                </div>
              )}
            </>
          )}
          
          {/* Book - show chapters */}
          {selectedType === 'book' && content?.chapters && (
            <>
              {content.chapters.length > 0 ? (
                <div className="chapter-list mt-4">
                  {content.chapters.map((chapter: any) => (
                    <div key={chapter.id} className="chapter-item">
                      <FileText className="w-5 h-5 text-matrix-gold" />
                      <h4 className="chapter-title">{chapter.name}</h4>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="content-preview-placeholder">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="preview-text">No chapters yet</p>
                  <p className="preview-subtext">Create your first chapter to get started</p>
                </div>
              )}
            </>
          )}
          
          {/* Chapter - show pages */}
          {selectedType === 'chapter' && content?.pages && (
            <>
              {content.pages.length > 0 ? (
                <div className="page-list mt-4">
                  {content.pages.map((page: any) => (
                    <div key={page.id} className="page-item">
                      <FileText className="w-5 h-5 text-white" />
                      <h4 className="page-title">{page.title}</h4>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="content-preview-placeholder">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="preview-text">No pages yet</p>
                  <p className="preview-subtext">Create your first page to get started</p>
                </div>
              )}
            </>
          )}
          
          {/* Page - show content */}
          {selectedType === 'page' && content?.content && (
            <div className="page-content">
              <div className="page-editor" dangerouslySetInnerHTML={{ __html: content.content }} />
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
            <div className="content-preview-placeholder">
              <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="preview-text">Content and sub-items will be displayed here</p>
              <p className="preview-subtext">Rich text editor and visualization coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainContent; 