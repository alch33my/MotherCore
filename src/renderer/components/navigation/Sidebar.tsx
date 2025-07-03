import React from 'react'
import { useState, useEffect } from 'react';
import type { FC } from 'react';;
import { 
  ChevronRight, 
  Plus, 
  Users, 
  Search, 
  Settings, 
  Download,
  FileText,
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

const Sidebar: FC<SidebarProps> = ({ 
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
    onSelectItem(item, 'organization');
  };

  const handleSelectProject = (item: any) => {
    onSelectItem(item, 'project');
  };

  const handleSelectBook = (item: any) => {
    onSelectItem(item, 'book');
  };

  const handleSelectChapter = (item: any) => {
    onSelectItem(item, 'chapter');
  };

  const handleSelectPage = (item: any) => {
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
      onSelectItem({ id: projectId }, 'project'); 
      onCreateBook(); 
    }
  };

  const handleAddChapter = (bookId: string) => {
    if (onCreateChapter) {
      onSelectItem({ id: bookId }, 'book');
      onCreateChapter(); 
    }
  };

  const handleAddPage = (chapterId: string) => {
    if (onCreatePage) {
      onSelectItem({ id: chapterId }, 'chapter');
      onCreatePage(); 
    }
  };

  return (
    <div className="sidebar">
      {/* Sidebar Header - Conditional rendering based on view */}
      <div className="sidebar-header">
        {isLibraryView && selectedOrganization ? (
          <>
            <button onClick={onBackToLibrary} className="back-button flex items-center mb-3 text-matrix-gold hover:text-matrix-gold/80 transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              <span>Back to Library</span>
            </button>
            
            <div className="organization-info flex items-center">
              <div 
                className="org-color-indicator w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: '#ffd700' }}
              />
              <div className="org-details">
                <h3 className="org-name text-sm font-medium text-matrix-gold">{selectedOrganization.name}</h3>
                {selectedOrganization.description && (
                  <p className="org-description text-xs text-matrix-gold/70 truncate">{selectedOrganization.description}</p>
                )}
              </div>
            </div>
          </>
        ) : (
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
        )}
      </div>

      {/* Quick Search for Library View */}
      {isLibraryView && selectedOrganization && (
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-matrix-gold/50" />
            <input
              type="text"
              placeholder="Search in this organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 pr-4 py-2 w-full bg-matrix-black border border-matrix-gold/30 rounded text-white"
            />
          </div>
        </div>
      )}

      {/* Quick Actions for Library View */}
      {isLibraryView && selectedOrganization && (
        <div className="px-3 pb-3 flex flex-wrap gap-2">
          <button 
            className="sidebar-action-btn bg-matrix-gold/10 hover:bg-matrix-gold/20 text-matrix-gold text-xs py-1 px-3 rounded flex items-center"
            onClick={() => handleAddProject(selectedOrganization.id)}
          >
            <Plus className="w-3 h-3 mr-1" />
            <span>New Project</span>
          </button>
          <button 
            className="sidebar-action-btn bg-matrix-gold/10 hover:bg-matrix-gold/20 text-matrix-gold text-xs py-1 px-3 rounded flex items-center"
            onClick={() => {
              console.log('Quick note functionality would create a temporary note');
            }}
          >
            <FileText className="w-3 h-3 mr-1" />
            <span>Quick Note</span>
          </button>
        </div>
      )}

      {/* Sidebar Content - Combined for both views */}
      <div className="sidebar-content">
        {/* Default View - Organizations List */}
        {!isLibraryView && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-sm font-semibold text-matrix-gold uppercase tracking-wider">
                Organizations
              </h2>
              <button
                onClick={handleAddOrganization}
                className="p-1 hover:bg-matrix-gold/20 rounded transition-colors"
                title="Create Organization"
              >
                <Plus className="w-4 h-4 text-matrix-gold" />
              </button>
            </div>

            {/* Create Organization Form */}
            {showCreateForm && (
              <div className="form-container mb-3 mx-2">
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
              <div className="error mx-2">
                {error}
              </div>
            )}

            {/* Organizations List or Empty State */}
            {loading ? (
              <div className="loading">
                <div>Loading organizations...</div>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-6 px-2">
                <Users className="w-10 h-10 text-matrix-gold/50 mx-auto mb-3" />
                <div className="text-matrix-gold/50 text-sm mb-2">No organizations yet</div>
                <div className="text-matrix-gold/30 text-xs">Create your first organization to get started</div>
              </div>
            ) : null}
          </div>
        )}

        {/* Navigation Tree - Shared between both views */}
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

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="flex justify-between items-center">
          <button
            title="Export Data"
            className="p-2 hover:bg-matrix-gold/20 rounded transition-colors"
            onClick={() => {
              console.log('Export functionality would export all data');
            }}
          >
            <Download className="w-4 h-4 text-matrix-gold" />
          </button>
          <button
            title="Settings"
            className="p-2 hover:bg-matrix-gold/20 rounded transition-colors"
            onClick={() => {
              console.log('Settings functionality would open settings');
            }}
          >
            <Settings className="w-4 h-4 text-matrix-gold" />
          </button>
        </div>
        <div className="text-xs text-matrix-gold/50 text-center mt-2">
          v0.0.1 - Local First
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 

