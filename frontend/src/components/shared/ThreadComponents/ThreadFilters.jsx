import React, { useState } from 'react';
import './ThreadFilters.css';

export default function ThreadFilters({
  filters,
  onFiltersChange,
  templates = [],
  sortBy,
  sortDirection,
  onSortChange,
  context = 'general'
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleSortClick = (key) => {
    if (sortBy === key) {
      onSortChange(key, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(key, 'desc');
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      priority: 'all',
      sla_status: 'all',
      assignee: 'all',
      template: 'all',
      date_range: 'all',
      my_threads: false
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== 'all' && value !== '' && value !== false
  );

  // Context-specific filter configurations
  const getContextFilters = () => {
    switch (context) {
      case 'incidents':
        return {
          showSLA: true,
          showMyThreads: true,
          defaultSort: 'priority',
          searchPlaceholder: 'Search incidents...'
        };
      case 'search':
        return {
          showSLA: false,
          showMyThreads: false,
          defaultSort: 'created_at',
          searchPlaceholder: 'Search all threads...'
        };
      case 'organization':
        return {
          showSLA: false,
          showMyThreads: false,
          defaultSort: 'last_activity',
          searchPlaceholder: 'Search organization threads...'
        };
      default:
        return {
          showSLA: true,
          showMyThreads: true,
          defaultSort: 'created_at',
          searchPlaceholder: 'Search threads...'
        };
    }
  };

  const contextConfig = getContextFilters();

  return (
    <div className={`thread-filters ${context}`}>
      {/* Main filter bar */}
      <div className="filter-bar">
        {/* Search */}
        <div className="filter-group search-group">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder={contextConfig.searchPlaceholder}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            {filters.search && (
              <button
                className="search-clear"
                onClick={() => handleFilterChange('search', '')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Quick filters */}
        <div className="filter-group quick-filters">
          {contextConfig.showMyThreads && (
            <label className="toggle-filter">
              <input
                type="checkbox"
                checked={filters.my_threads}
                onChange={(e) => handleFilterChange('my_threads', e.target.checked)}
              />
              <span className="toggle-label">My Threads</span>
            </label>
          )}

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {contextConfig.showSLA && (
            <select
              value={filters.sla_status}
              onChange={(e) => handleFilterChange('sla_status', e.target.value)}
              className="filter-select"
            >
              <option value="all">All SLA</option>
              <option value="healthy">Healthy</option>
              <option value="warning">Warning</option>
              <option value="breached">Breached</option>
            </select>
          )}
        </div>

        {/* Advanced filters toggle */}
        <div className="filter-group actions-group">
          <button
            className={`btn btn-outline btn-sm ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
            </svg>
            Advanced
          </button>

          {hasActiveFilters && (
            <button
              className="btn btn-outline btn-sm"
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="advanced-filters">
          <div className="advanced-filter-row">
            <div className="filter-item">
              <label className="filter-label">Template</label>
              <select
                value={filters.template}
                onChange={(e) => handleFilterChange('template', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Templates</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Date Range</label>
              <select
                value={filters.date_range}
                onChange={(e) => handleFilterChange('date_range', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Assignee</label>
              <select
                value={filters.assignee}
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                <option value="me">Assigned to Me</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sort options */}
      <div className="sort-bar">
        <span className="sort-label">Sort by:</span>
        <div className="sort-options">
          <button
            className={`sort-btn ${sortBy === 'created_at' ? 'active' : ''}`}
            onClick={() => handleSortClick('created_at')}
          >
            Created
            {sortBy === 'created_at' && (
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className={`sort-arrow ${sortDirection === 'desc' ? 'desc' : 'asc'}`}
              >
                <path d="M7 14l5-5 5 5z"/>
              </svg>
            )}
          </button>

          <button
            className={`sort-btn ${sortBy === 'last_activity' ? 'active' : ''}`}
            onClick={() => handleSortClick('last_activity')}
          >
            Last Activity
            {sortBy === 'last_activity' && (
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className={`sort-arrow ${sortDirection === 'desc' ? 'desc' : 'asc'}`}
              >
                <path d="M7 14l5-5 5 5z"/>
              </svg>
            )}
          </button>

          <button
            className={`sort-btn ${sortBy === 'priority' ? 'active' : ''}`}
            onClick={() => handleSortClick('priority')}
          >
            Priority
            {sortBy === 'priority' && (
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className={`sort-arrow ${sortDirection === 'desc' ? 'desc' : 'asc'}`}
              >
                <path d="M7 14l5-5 5 5z"/>
              </svg>
            )}
          </button>

          <button
            className={`sort-btn ${sortBy === 'incident_id' ? 'active' : ''}`}
            onClick={() => handleSortClick('incident_id')}
          >
            Incident ID
            {sortBy === 'incident_id' && (
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className={`sort-arrow ${sortDirection === 'desc' ? 'desc' : 'asc'}`}
              >
                <path d="M7 14l5-5 5 5z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">Active filters:</span>
          <div className="active-filter-tags">
            {filters.search && (
              <span className="filter-tag">
                Search: "{filters.search}"
                <button onClick={() => handleFilterChange('search', '')}>×</button>
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="filter-tag">
                Status: {filters.status}
                <button onClick={() => handleFilterChange('status', 'all')}>×</button>
              </span>
            )}
            {filters.priority !== 'all' && (
              <span className="filter-tag">
                Priority: {filters.priority}
                <button onClick={() => handleFilterChange('priority', 'all')}>×</button>
              </span>
            )}
            {contextConfig.showSLA && filters.sla_status !== 'all' && (
              <span className="filter-tag">
                SLA: {filters.sla_status}
                <button onClick={() => handleFilterChange('sla_status', 'all')}>×</button>
              </span>
            )}
            {filters.my_threads && (
              <span className="filter-tag">
                My Threads
                <button onClick={() => handleFilterChange('my_threads', false)}>×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}