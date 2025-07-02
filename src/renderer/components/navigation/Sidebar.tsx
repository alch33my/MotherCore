import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Users, 
  Book, 
  Search, 
  Settings, 
  Download,
  FileText,
  Folder,
  Star,
  Clock,
  Tag
} from 'lucide-react';
import NavigationTree from './navigation-tree';

interface SidebarProps {
  onSelectItem: (item: any, type: string) => void;
  onBackToLibrary?: () => void;
  selectedOrganization?: any;
  isLibraryView?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onSelectItem, 
  onBackToLibrary,
  selectedOrganization,
  isLibraryView = false
}) => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    description: ''
  });

  // Load organizations on component mount
  useEffect(() => {
    if (!isLibraryView) {
      loadOrganizations();
    }
  }, [isLibraryView]);

  const loadOrganizations = async () => {
    if (!window.electronAPI) {
      setError('Electron API not available');
      return;
    }

    try {
      setLoading(true);
      const result = await window.electronAPI.getOrganizations();
      if (result.success) {
        setOrganizations(result.organizations || []);
      } else {
        setError(result.error || 'Failed to load organizations');
      }
    } catch (err) {
      setError('Error loading organizations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.electronAPI) {
      setError('Electron API not available');
      return;
    }

    if (!newOrgData.name.trim()) return;

    try {
      setLoading(true);
      const result = await window.electronAPI.createOrganization({
        name: newOrgData.name.trim(),
        description: newOrgData.description.trim()
      });
      
      if (result.success) {
        setNewOrgData({ name: '', description: '' });
        setShowCreateForm(false);
        loadOrganizations();
      } else {
        setError(result.error || 'Failed to create organization');
      }
    } catch (err) {
      setError('Error creating organization');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation tree handlers
  const handleSelectOrganization = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      onSelectItem(org, 'organization');
    }
  };

  const handleSelectProject = (projectId: string) => {
    // Fetch project details and pass to onSelectItem
    if (window.electronAPI) {
      window.electronAPI.getProjects().then(result => {
        if (result.success && result.projects) {
          const project = result.projects.find((p: any) => p.id === projectId);
          if (project) {
            onSelectItem(project, 'project');
          }
        }
      });
    }
  };

  const handleSelectBook = (bookId: string) => {
    if (window.electronAPI) {
      window.electronAPI.getBooks().then(result => {
        if (result.success && result.books) {
          const book = result.books.find((b: any) => b.id === bookId);
          if (book) {
            onSelectItem(book, 'book');
          }
        }
      });
    }
  };

  const handleSelectChapter = (chapterId: string) => {
    if (window.electronAPI) {
      window.electronAPI.getChapters().then(result => {
        if (result.success && result.chapters) {
          const chapter = result.chapters.find((c: any) => c.id === chapterId);
          if (chapter) {
            onSelectItem(chapter, 'chapter');
          }
        }
      });
    }
  };

  const handleSelectPage = (pageId: string) => {
    if (window.electronAPI) {
      window.electronAPI.getPages().then(result => {
        if (result.success && result.pages) {
          const page = result.pages.find((p: any) => p.id === pageId);
          if (page) {
            onSelectItem(page, 'page');
          }
        }
      });
    }
  };

  const handleAddOrganization = () => {
    setShowCreateForm(true);
  };

  const handleAddProject = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      onSelectItem(org, 'organization');
      // You can add logic to show project creation modal here
    }
  };

  const handleAddBook = (projectId: string) => {
    // Logic to show book creation modal
  };

  const handleAddChapter = (bookId: string) => {
    // Logic to show chapter creation modal
  };

  const handleAddPage = (chapterId: string) => {
    // Logic to show page creation modal
  };

  // Render the Library Sidebar when in library view
  if (isLibraryView && selectedOrganization) {
    return (
      <div className="library-sidebar-container">
        {/* Header */}
        <div className="library-sidebar-header">
          <button onClick={onBackToLibrary} className="back-button">
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Library</span>
          </button>
          
          <div className="organization-info">
            <div 
              className="org-color-indicator"
              style={{ backgroundColor: '#ffd700' }}
            />
            <div className="org-details">
              <h3 className="org-name">{selectedOrganization.name}</h3>
              <p className="org-description">{selectedOrganization.description}</p>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="sidebar-search">
          <Search className="search-icon w-4 h-4" />
          <input
            type="text"
            placeholder="Search in this collection..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="quick-action">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
          <button className="quick-action">
            <FileText className="w-4 h-4" />
            <span>Quick Note</span>
          </button>
        </div>

        {/* Navigation Tree */}
        <div className="sidebar-navigation">
          <NavigationTree
            onSelectOrganization={handleSelectOrganization}
            onSelectProject={handleSelectProject}
            onSelectBook={handleSelectBook}
            onSelectChapter={handleSelectChapter}
            onSelectPage={handleSelectPage}
            onAddOrganization={handleAddOrganization}
            onAddProject={handleAddProject}
            onAddBook={handleAddBook}
            onAddChapter={handleAddChapter}
            onAddPage={handleAddPage}
          />
        </div>
      </div>
    );
  }

  // Default Sidebar View (Home View)
  return (
    <>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <h1 className="text-xl font-bold text-matrix-gold mb-2">MOTHERCORE</h1>
        <p className="text-sm text-matrix-amber mb-4">Your Knowledge Repository</p>
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-matrix-gold/50" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 pr-4 py-2 w-full bg-matrix-black border border-matrix-gold/30 rounded text-white"
          />
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="sidebar-content">
        {/* Organizations Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-matrix-amber uppercase tracking-wider">
              Organizations
            </h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="p-1 hover:bg-matrix-gold/20 rounded transition-colors"
              title="Create Organization"
            >
              <Plus className="w-4 h-4 text-matrix-gold" />
            </button>
          </div>

          {/* Create Organization Form */}
          {showCreateForm && (
            <div className="form-container fade-in">
              <form onSubmit={handleCreateOrganization}>
                <input
                  type="text"
                  placeholder="Organization name"
                  value={newOrgData.name}
                  onChange={(e) => setNewOrgData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newOrgData.description}
                  onChange={(e) => setNewOrgData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input form-textarea"
                />
                <div className="form-buttons">
                  <button type="submit" className="btn btn-primary">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewOrgData({ name: '', description: '' });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {/* Organizations List or Full Tree */}
          {loading ? (
            <div className="loading">
              <div>Loading organizations...</div>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-matrix-gold/50 mx-auto mb-3" />
              <div className="text-matrix-amber/50 text-sm mb-2">No organizations yet</div>
              <div className="text-matrix-amber/30 text-xs">Create your first organization to get started</div>
            </div>
          ) : (
            <NavigationTree
              onSelectOrganization={handleSelectOrganization}
              onSelectProject={handleSelectProject}
              onSelectBook={handleSelectBook}
              onSelectChapter={handleSelectChapter}
              onSelectPage={handleSelectPage}
              onAddOrganization={handleAddOrganization}
              onAddProject={handleAddProject}
              onAddBook={handleAddBook}
              onAddChapter={handleAddChapter}
              onAddPage={handleAddPage}
            />
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="flex justify-between items-center">
          <button
            title="Export Data"
            className="p-2 hover:bg-matrix-gold/20 rounded transition-colors"
          >
            <Download className="w-4 h-4 text-matrix-gold" />
          </button>
          <button
            title="Settings"
            className="p-2 hover:bg-matrix-gold/20 rounded transition-colors"
          >
            <Settings className="w-4 h-4 text-matrix-gold" />
          </button>
        </div>
        <div className="text-xs text-matrix-amber/50 text-center mt-2">
          v0.0.1 - Local First
        </div>
      </div>
    </>
  );
};

export default Sidebar; 