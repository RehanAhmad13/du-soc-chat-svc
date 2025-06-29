import React from 'react';
import { FiAlertCircle, FiGrid, FiList, FiRefreshCw, FiPlus } from 'react-icons/fi';
import './IncidentsHeader.css';

export default function IncidentsHeader({
  stats,
  viewMode,
  onViewModeChange,
  selectedCount,
  onCreateIncident,
  onRefresh,
  loading
}) {
  return (
    <div className="incidents-header">
      <div className="header-left">
        <div className="page-title">
          <FiAlertCircle size={24} />
          <h1>Active Incidents</h1>
          <span className="incidents-count">({stats.total})</span>
        </div>
        
        <div className="incidents-stats">
          <div className="stat-item">
            <span className="stat-value critical">{stats.critical}</span>
            <span className="stat-label">Critical</span>
          </div>
          <div className="stat-item">
            <span className="stat-value breached">{stats.slaBreached}</span>
            <span className="stat-label">SLA Breached</span>
          </div>
          <div className="stat-item">
            <span className="stat-value unread">{stats.unread}</span>
            <span className="stat-label">Unread</span>
          </div>
          <div className="stat-item">
            <span className="stat-value my-threads">{stats.myThreads}</span>
            <span className="stat-label">Assigned to Me</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="view-controls">
          <div className="view-mode-selector">
            <button
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => onViewModeChange('cards')}
              title="Card View"
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

          <button
            className="btn btn-primary"
            onClick={onCreateIncident}
          >
            <FiPlus size={16} />
            New Incident
          </button>
        </div>

        {selectedCount > 0 && (
          <div className="selection-summary">
            <span className="selection-count">{selectedCount} selected</span>
          </div>
        )}
      </div>
    </div>
  );
}