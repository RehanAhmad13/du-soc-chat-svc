import React from 'react';

const VIEW_MODES = {
  CARDS: 'cards',
  LIST: 'list',
  KANBAN: 'kanban'
};

export default function ThreadsHeader({
  stats,
  viewMode,
  onViewModeChange,
  onCreateClick,
  onRefresh,
  selectedThreads,
  onBulkAction
}) {
  const handleBulkAction = (action) => {
    if (selectedThreads.length === 0) return;
    onBulkAction(action, selectedThreads);
  };

  return (
    <div className="threads-header">
      {/* Title and quick stats */}
      <div className="header-main">
        <div className="header-title-section">
          <h1 className="page-title">
            Incident Threads
            <span className="title-badge">{stats.total}</span>
          </h1>
          <p className="page-subtitle">
            Manage and monitor incident response threads
          </p>
        </div>

        <div className="header-quick-stats">
          <div className="quick-stat">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="quick-stat urgent">
            <span className="stat-value">{stats.breached}</span>
            <span className="stat-label">SLA Breached</span>
          </div>
          <div className="quick-stat">
            <span className="stat-value">{stats.unread}</span>
            <span className="stat-label">Unread</span>
          </div>
          <div className="quick-stat">
            <span className="stat-value">{stats.myThreads}</span>
            <span className="stat-label">My Threads</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="header-actions">
        {/* Bulk actions (shown when threads are selected) */}
        {selectedThreads.length > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">
              {selectedThreads.length} selected
            </span>
            <div className="bulk-action-buttons">
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handleBulkAction('assign')}
              >
                Assign
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handleBulkAction('priority')}
              >
                Set Priority
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handleBulkAction('close')}
              >
                Close
              </button>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => handleBulkAction('export')}
              >
                Export
              </button>
            </div>
          </div>
        )}

        {/* Regular actions */}
        <div className="action-buttons">
          {/* View mode selector */}
          <div className="view-mode-selector">
            <button
              className={`view-mode-btn ${viewMode === VIEW_MODES.CARDS ? 'active' : ''}`}
              onClick={() => onViewModeChange(VIEW_MODES.CARDS)}
              title="Card View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h5v5H4V4zm6 0h5v5h-5V4zm6 0h5v5h-5V4zM4 10h5v5H4v-5zm6 0h5v5h-5v-5zm6 0h5v5h-5v-5zM4 16h5v5H4v-5zm6 0h5v5h-5v-5zm6 0h5v5h-5v-5z"/>
              </svg>
            </button>
            <button
              className={`view-mode-btn ${viewMode === VIEW_MODES.LIST ? 'active' : ''}`}
              onClick={() => onViewModeChange(VIEW_MODES.LIST)}
              title="List View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
              </svg>
            </button>
            <button
              className={`view-mode-btn ${viewMode === VIEW_MODES.KANBAN ? 'active' : ''}`}
              onClick={() => onViewModeChange(VIEW_MODES.KANBAN)}
              title="Kanban View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 2h4v20H4V2zm6 0h4v12h-4V2zm6 8h4v12h-4V10z"/>
              </svg>
            </button>
          </div>

          {/* Action buttons */}
          <button 
            className="btn btn-outline"
            onClick={onRefresh}
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4V2l3 3-3 3V6c-3.31 0-6 2.69-6 6 0 1.01.25 1.97.7 2.8L5.24 16.26C4.46 15.02 4 13.57 4 12c0-4.42 3.58-8 8-8zm5.76 1.74L19.22 7.2C19.54 8.48 20 9.94 20 12c0 4.42-3.58 8-8 8v2l-3-3 3-3v2c3.31 0 6-2.69 6-6 0-1.01-.25-1.97-.7-2.8l1.46-1.46z"/>
            </svg>
          </button>

          <button 
            className="btn btn-outline"
            onClick={() => {/* Settings logic */}}
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </button>

          <button 
            className="btn btn-primary"
            onClick={onCreateClick}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            New Thread
          </button>
        </div>
      </div>
    </div>
  );
}