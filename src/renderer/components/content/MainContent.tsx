import React from 'react';
import { FileText, Calendar, User, Hash, Book } from 'lucide-react';

interface MainContentProps {
  selectedItem: any;
  selectedType: string;
}

function MainContent({ selectedItem, selectedType }: MainContentProps) {
  if (!selectedItem) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-icon">📚</div>
          <h2 className="welcome-title">Welcome to MotherCore</h2>
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
        </div>
      </div>
    );
  }

  return (
    <div className="detail-view fade-in">
      {/* Header */}
      <div className="detail-header">
        <h2 className="detail-title">{selectedItem.name}</h2>
        <span className="detail-type-badge">{selectedType}</span>
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
              Add {selectedType === 'organization' ? 'Project' : 'Item'}
            </button>
            <button className="action-btn">
              Edit Details
            </button>
            <button className="action-btn">
              Export
            </button>
            <button className="action-btn">
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Content Preview Area */}
      <div className="info-panel mt-6">
        <h3 className="info-panel-title">
          <Book className="w-4 h-4" />
          Content Preview
        </h3>
        <div className="text-center py-12 text-matrix-amber/50">
          <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Content and sub-items will be displayed here</p>
          <p className="text-sm mt-2">Rich text editor and visualization coming soon</p>
        </div>
      </div>
    </div>
  );
}

export default MainContent; 