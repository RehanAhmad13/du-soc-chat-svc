import React, { useState } from 'react';

export default function UserFilters({
  filters,
  onFiltersChange,
  sortBy,
  sortDirection,
  onSortChange,
  orgStats
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
      role: 'all',
      status: 'all',
      department: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== 'all' && value !== '' && value !== false
  );

  return (
    <div className="user-filters">
      <div className="filter-bar">
        <div className="filter-group search-group">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search members..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-group quick-filters">
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Departments</option>
            {orgStats.departmentList?.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="filter-group actions-group">
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

      <div className="sort-bar">
        <span className="sort-label">Sort by:</span>
        <div className="sort-options">
          <button
            className={`sort-btn ${sortBy === 'username' ? 'active' : ''}`}
            onClick={() => handleSortClick('username')}
          >
            Name
          </button>
          <button
            className={`sort-btn ${sortBy === 'last_login' ? 'active' : ''}`}
            onClick={() => handleSortClick('last_login')}
          >
            Last Login
          </button>
          <button
            className={`sort-btn ${sortBy === 'role' ? 'active' : ''}`}
            onClick={() => handleSortClick('role')}
          >
            Role
          </button>
        </div>
      </div>
    </div>
  );
}