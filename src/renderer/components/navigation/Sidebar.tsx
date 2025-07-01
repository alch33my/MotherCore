import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Users, Book, Search, Settings, Download } from 'lucide-react';

interface SidebarProps {
  onSelectItem: (item: any, type: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectItem }) => {
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
    loadOrganizations();
  }, []);

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

  return (
    <>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <h1 className="text-xl font-bold text-matrix-gold mb-2">MotherCore</h1>
        <p className="text-sm text-matrix-amber mb-4">Your Digital Library</p>
        
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

          {/* Organizations List */}
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
            <div className="space-y-1">
              {organizations.map((org) => (
                <div key={org.id} className="fade-in">
                  <div
                    className={`tree-item ${expandedItems.has(org.id) ? 'expanded' : ''}`}
                    onClick={() => onSelectItem(org, 'organization')}
                  >
                    <button
                      onClick={(e) => toggleExpand(org.id, e)}
                      className={`tree-item-chevron ${expandedItems.has(org.id) ? 'expanded' : ''}`}
                    >
                      {expandedItems.has(org.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Users className="tree-item-icon" />
                    <span className="tree-item-text">{org.name}</span>
                    <Plus className="tree-item-add" onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(org, 'organization');
                    }} />
                  </div>

                  {expandedItems.has(org.id) && (
                    <div className="tree-children fade-in">
                      <div className="text-matrix-amber/50 text-xs py-2 italic">
                        Projects will appear here...
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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