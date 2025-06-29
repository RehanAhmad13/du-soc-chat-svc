import React from 'react';
import { FiUsers, FiGrid, FiList, FiRefreshCw, FiHome } from 'react-icons/fi';
import './OrganizationHeader.css';

export default function OrganizationHeader({
  tenantName,
  stats,
  viewMode,
  onViewModeChange,
  onRefresh,
  loading
}) {
  return (
    <div className="organization-header">
      <div className="header-left">
        <div className="page-title">
          <FiHome size={24} />
          <h1>{tenantName || 'Organization'}</h1>
          <span className="users-count">({stats.total} members)</span>
        </div>
        
        <div className="organization-stats">
          <div className="stat-item">
            <span className="stat-value online">{stats.online}</span>
            <span className="stat-label">Online</span>
          </div>
          <div className="stat-item">
            <span className="stat-value active">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-value admins">{stats.admins}</span>
            <span className="stat-label">Admins</span>
          </div>
          <div className="stat-item">
            <span className="stat-value departments">{stats.departments}</span>
            <span className="stat-label">Departments</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="view-controls">
          <div className="view-mode-selector">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
            >
              <FiGrid size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => onViewModeChange('list')}
              title="List View"
            >
              <FiList size={16} />
            </button>
          </div>

          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
          >
            <FiRefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}