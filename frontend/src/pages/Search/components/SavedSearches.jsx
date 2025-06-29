import React, { useState } from 'react';
import { FiBookmark, FiTrash2, FiSave, FiSearch } from 'react-icons/fi';
import './SavedSearches.css';

export default function SavedSearches({
  savedSearches,
  onLoad,
  onDelete,
  onSave,
  canSave
}) {
  const [showAll, setShowAll] = useState(false);

  const displayedSearches = showAll ? savedSearches : savedSearches.slice(0, 5);

  const formatSearchPreview = (search) => {
    const parts = [];
    
    if (search.filters.search) {
      parts.push(`"${search.filters.search}"`);
    }
    
    if (search.filters.status !== 'all') {
      parts.push(`Status: ${search.filters.status}`);
    }
    
    if (search.filters.priority !== 'all') {
      parts.push(`Priority: ${search.filters.priority}`);
    }
    
    if (search.filters.template !== 'all') {
      parts.push('Template filter');
    }
    
    if (search.filters.my_threads) {
      parts.push('My threads');
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'All threads';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.round(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.round(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="saved-searches">
      <div className="saved-searches-header">
        <div className="header-title">
          <FiBookmark size={16} />
          <h3>Saved Searches</h3>
        </div>
        
        {canSave && (
          <button
            className="save-current-btn"
            onClick={onSave}
            title="Save current search"
          >
            <FiSave size={14} />
          </button>
        )}
      </div>

      {savedSearches.length === 0 ? (
        <div className="no-saved-searches">
          <div className="no-saved-icon">🔖</div>
          <p>No saved searches yet.</p>
          {canSave && (
            <button className="btn btn-sm btn-primary" onClick={onSave}>
              Save Current Search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="saved-searches-list">
            {displayedSearches.map(search => (
              <div key={search.id} className="saved-search-item">
                <div className="search-info">
                  <button
                    className="search-name"
                    onClick={() => onLoad(search)}
                    title="Load this search"
                  >
                    <FiSearch size={12} />
                    {search.name}
                  </button>
                  
                  <div className="search-preview">
                    {formatSearchPreview(search)}
                  </div>
                  
                  <div className="search-meta">
                    <span className="search-date">
                      {formatDate(search.createdAt)}
                    </span>
                  </div>
                </div>
                
                <button
                  className="delete-search"
                  onClick={() => onDelete(search.id)}
                  title="Delete this search"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {savedSearches.length > 5 && (
            <button
              className="show-more-btn"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All (${savedSearches.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}