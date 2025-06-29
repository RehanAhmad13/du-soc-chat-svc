import React, { useState } from 'react';
import { FiSearch, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import './SearchHeader.css';

export default function SearchHeader({
  onSearch,
  onAdvancedSearch,
  viewMode,
  onViewModeChange,
  loading,
  stats,
  searchPerformed,
  currentSearch
}) {
  const [searchInput, setSearchInput] = useState(currentSearch || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };

  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(searchInput.trim());
    }
  };

  return (
    <div className="search-header">
      <div className="search-title-section">
        <div className="page-title">
          <FiSearch size={24} />
          <h1>Search Threads</h1>
        </div>
        
        {searchPerformed && (
          <div className="search-stats">
            <span className="results-count">
              {stats.total.toLocaleString()} {stats.resultText}
            </span>
            {stats.pages > 1 && (
              <span className="pages-info">
                • Page {stats.currentPage} of {stats.pages}
              </span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search threads, incidents, messages, tags..."
              value={searchInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            {searchInput && (
              <button
                type="button"
                className="clear-search"
                onClick={() => {
                  setSearchInput('');
                  onSearch('');
                }}
              >
                ×
              </button>
            )}
          </div>
          
          <button
            type="submit"
            className="search-btn"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          
          <button
            type="button"
            className="advanced-search-btn"
            onClick={onAdvancedSearch}
            title="Advanced Search"
          >
            <FiFilter size={16} />
            Advanced
          </button>
        </div>
      </form>

      {searchPerformed && (
        <div className="search-controls">
          <div className="view-mode-selector">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => onViewModeChange('list')}
              title="List View"
            >
              <FiList size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => onViewModeChange('cards')}
              title="Card View"
            >
              <FiGrid size={16} />
            </button>
          </div>

          {currentSearch && (
            <div className="current-search">
              <span className="search-label">Searching for:</span>
              <span className="search-term">"{currentSearch}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}