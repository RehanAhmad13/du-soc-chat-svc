import React, { useMemo } from 'react';
import ThreadCard from './ThreadCard';

const KANBAN_COLUMNS = [
  { key: 'open', title: 'Open', color: '#3b82f6' },
  { key: 'in_progress', title: 'In Progress', color: '#f59e0b' },
  { key: 'pending', title: 'Pending', color: '#8b5cf6' },
  { key: 'resolved', title: 'Resolved', color: '#10b981' },
  { key: 'closed', title: 'Closed', color: '#6b7280' }
];

export default function ThreadKanban({ 
  threads, 
  selectedThreads, 
  onSelectionChange, 
  onThreadClick 
}) {
  // Group threads by status
  const groupedThreads = useMemo(() => {
    const groups = {};
    
    // Initialize all columns
    KANBAN_COLUMNS.forEach(column => {
      groups[column.key] = [];
    });

    // Group threads by status
    threads.forEach(thread => {
      const status = thread.status || 'open';
      if (groups[status]) {
        groups[status].push(thread);
      } else {
        groups['open'].push(thread); // Default to open if status not recognized
      }
    });

    return groups;
  }, [threads]);

  const handleThreadSelect = (threadId, isSelected) => {
    if (isSelected) {
      onSelectionChange([...selectedThreads, threadId]);
    } else {
      onSelectionChange(selectedThreads.filter(id => id !== threadId));
    }
  };

  const handleColumnSelectAll = (columnThreads, isSelected) => {
    const columnThreadIds = columnThreads.map(t => t.id);
    
    if (isSelected) {
      const newSelection = [...new Set([...selectedThreads, ...columnThreadIds])];
      onSelectionChange(newSelection);
    } else {
      const newSelection = selectedThreads.filter(id => !columnThreadIds.includes(id));
      onSelectionChange(newSelection);
    }
  };

  const isColumnFullySelected = (columnThreads) => {
    if (columnThreads.length === 0) return false;
    return columnThreads.every(thread => selectedThreads.includes(thread.id));
  };

  const getColumnStats = (columnThreads) => {
    const total = columnThreads.length;
    const critical = columnThreads.filter(t => t.priority === 'critical').length;
    const breached = columnThreads.filter(t => t.sla_status === 'breached').length;
    const unread = columnThreads.reduce((sum, t) => sum + (t.unread_count || 0), 0);
    
    return { total, critical, breached, unread };
  };

  return (
    <div className="thread-kanban">
      <div className="kanban-board">
        {KANBAN_COLUMNS.map(column => {
          const columnThreads = groupedThreads[column.key] || [];
          const stats = getColumnStats(columnThreads);
          const isFullySelected = isColumnFullySelected(columnThreads);
          
          return (
            <div key={column.key} className="kanban-column">
              {/* Column Header */}
              <div className="column-header" style={{ borderTopColor: column.color }}>
                <div className="column-title-section">
                  <div className="column-title-main">
                    <div className="column-checkbox">
                      <input
                        type="checkbox"
                        checked={isFullySelected}
                        onChange={(e) => handleColumnSelectAll(columnThreads, e.target.checked)}
                        disabled={columnThreads.length === 0}
                        className="column-select-all"
                      />
                    </div>
                    <h3 className="column-title">{column.title}</h3>
                    <span className="column-count" style={{ backgroundColor: column.color }}>
                      {stats.total}
                    </span>
                  </div>
                  
                  {/* Column Stats */}
                  <div className="column-stats">
                    {stats.critical > 0 && (
                      <span className="stat-badge critical">
                        🔴 {stats.critical}
                      </span>
                    )}
                    {stats.breached > 0 && (
                      <span className="stat-badge breached">
                        ⚠️ {stats.breached}
                      </span>
                    )}
                    {stats.unread > 0 && (
                      <span className="stat-badge unread">
                        💬 {stats.unread}
                      </span>
                    )}
                  </div>
                </div>

                {/* Column Actions */}
                <div className="column-actions">
                  <button 
                    className="column-action-btn"
                    title="Add filter for this column"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                    </svg>
                  </button>
                  <button 
                    className="column-action-btn"
                    title="Column settings"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Column Body */}
              <div className="column-body">
                {columnThreads.length === 0 ? (
                  <div className="column-empty">
                    <div className="empty-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                    </div>
                    <p className="empty-text">No {column.title.toLowerCase()} threads</p>
                  </div>
                ) : (
                  <div className="column-threads">
                    {columnThreads.map(thread => (
                      <div key={thread.id} className="kanban-card-wrapper">
                        <ThreadCard
                          thread={thread}
                          isSelected={selectedThreads.includes(thread.id)}
                          onSelect={(isSelected) => handleThreadSelect(thread.id, isSelected)}
                          onClick={() => onThreadClick(thread)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column Footer */}
              {stats.total > 0 && (
                <div className="column-footer">
                  <div className="column-summary">
                    <span className="summary-text">
                      {stats.total} thread{stats.total !== 1 ? 's' : ''}
                    </span>
                    {stats.critical > 0 && (
                      <span className="summary-critical">
                        • {stats.critical} critical
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Kanban Controls */}
      <div className="kanban-controls">
        <div className="view-options">
          <button className="control-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
            Compact View
          </button>
          
          <button className="control-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
            </svg>
            Filter Columns
          </button>
          
          <button className="control-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
            </svg>
            Customize
          </button>
        </div>

        <div className="board-stats">
          <span className="board-total">
            {threads.length} total threads
          </span>
          {selectedThreads.length > 0 && (
            <span className="board-selected">
              • {selectedThreads.length} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}