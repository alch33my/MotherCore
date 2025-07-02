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
  onCreateOrganization?: () => void;
  onCreateProject?: () => void;
  onCreateBook?: () => void;
  onCreateChapter?: () => void;
  onCreatePage?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onSelectItem, 
  onBackToLibrary,
  selectedOrganization,
  isLibraryView = false,
  onCreateOrganization,
  onCreateProject,
  onCreateBook,
  onCreateChapter,
  onCreatePage
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
        console.log(`Sidebar: Loaded ${result.organizations?.length || 0} organizations`);
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
  const handleSelectOrganization = (item: any) => {
    // We already have the full organization object
    onSelectItem(item, 'organization');
  };

  const handleSelectProject = (item: any) => {
    // We now have the full project object with organization_id
    onSelectItem(item, 'project');
  };

  const handleSelectBook = (item: any) => {
    // We now have the full book object with project_id
    onSelectItem(item, 'book');
  };

  const handleSelectChapter = (item: any) => {
    // We now have the full chapter object with book_id
    onSelectItem(item, 'chapter');
  };

  const handleSelectPage = (item: any) => {
    // We now have the full page object with chapter_id
    onSelectItem(item, 'page');
  };

  const handleAddOrganization = () => {
    if (onCreateOrganization) {
      onCreateOrganization();
    } else {
      setShowCreateForm(true); // Fallback to old form
    }
  };

  const handleAddProject = (orgId: string) => {
    if (onCreateProject) {
      // Pass the organization ID to the parent component
      onSelectItem({ id: orgId }, 'organization'); // First select the organization
      onCreateProject(); // Then open the project creation modal
    }
  };

  const handleAddBook = (projectId: string) => {
    if (onCreateBook) {
      // Pass the project ID to the parent component
      onSelectItem({ id: projectId }, 'project'); // First select the project
      onCreateBook(); // Then open the book creation modal
    }
  };

  const handleAddChapter = (bookId: string) => {
    if (onCreateChapter) {
      // Pass the book ID to the parent component
      onSelectItem({ id: bookId }, 'book'); // First select the book
      onCreateChapter(); // Then open the chapter creation modal
    }
  };

  const handleAddPage = (chapterId: string) => {
    if (onCreatePage) {
      // Pass the chapter ID to the parent component
      onSelectItem({ id: chapterId }, 'chapter'); // First select the chapter
      onCreatePage(); // Then open the page creation modal
    }
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
      {/* Sidebar Header - REMOVED DUPLICATE MOTHERCORE */}
      <div className="sidebar-header">
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