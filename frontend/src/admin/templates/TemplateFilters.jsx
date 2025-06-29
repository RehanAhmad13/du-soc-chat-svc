import React from 'react'

const TemplateFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  categories,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  icons
}) => {
  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'category', label: 'Category' },
    { value: 'usage', label: 'Most Used' },
    { value: 'updated', label: 'Recently Updated' }
  ]

  const statusOptions = [
    { value: 'All', label: 'All Status' },
    { value: 'Active', label: 'Active Only' },
    { value: 'Inactive', label: 'Inactive Only' }
  ]

  return (
    <div className="template-filters">
      <div className="filters-row">
        {/* Search */}
        <div className="filter-group search-group">
          <div className="search-input-container">
            <div className="search-icon">
              {icons.search}
            </div>
            <input
              type="text"
              placeholder="Search templates by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="search-clear"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="filter-group">
          <label className="filter-label">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="filter-group">
          <label className="filter-label">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="filter-group view-toggle-group">
          <label className="filter-label">View</label>
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              aria-label="Grid view"
            >
              {icons.grid}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              aria-label="List view"
            >
              {icons.list}
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(searchTerm || selectedCategory !== 'All' || selectedStatus !== 'All') && (
        <div className="active-filters">
          <span className="active-filters-label">Active filters:</span>
          <div className="active-filters-list">
            {searchTerm && (
              <div className="active-filter">
                <span className="filter-type">Search:</span>
                <span className="filter-value">"{searchTerm}"</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="filter-remove"
                  aria-label="Remove search filter"
                >
                  ×
                </button>
              </div>
            )}
            {selectedCategory !== 'All' && (
              <div className="active-filter">
                <span className="filter-type">Category:</span>
                <span className="filter-value">{selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="filter-remove"
                  aria-label="Remove category filter"
                >
                  ×
                </button>
              </div>
            )}
            {selectedStatus !== 'All' && (
              <div className="active-filter">
                <span className="filter-type">Status:</span>
                <span className="filter-value">{selectedStatus}</span>
                <button
                  onClick={() => setSelectedStatus('All')}
                  className="filter-remove"
                  aria-label="Remove status filter"
                >
                  ×
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
                setSelectedStatus('All')
              }}
              className="clear-all-filters"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="quick-filters">
        <span className="quick-filters-label">Quick filters:</span>
        <div className="quick-filters-list">
          <button
            onClick={() => {
              setSelectedCategory('Incident Response')
              setSelectedStatus('Active')
            }}
            className="quick-filter-btn"
          >
            Active Incident Templates
          </button>
          <button
            onClick={() => {
              setSortBy('usage')
              setSelectedStatus('Active')
            }}
            className="quick-filter-btn"
          >
            Most Popular
          </button>
          <button
            onClick={() => {
              setSortBy('updated')
              setSelectedStatus('All')
            }}
            className="quick-filter-btn"
          >
            Recently Modified
          </button>
          <button
            onClick={() => {
              setSelectedCategory('Compliance')
              setSelectedStatus('Active')
            }}
            className="quick-filter-btn"
          >
            Compliance Templates
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplateFilters