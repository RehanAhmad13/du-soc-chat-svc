import React from 'react';
import ThreadCard from './ThreadCard';
import ThreadListRow from './ThreadListRow';
import ThreadKanban from './ThreadKanban';

const VIEW_MODES = {
  CARDS: 'cards',
  LIST: 'list',
  KANBAN: 'kanban'
};

export default function ThreadView({
  threads,
  viewMode,
  selectedThreads,
  onSelectionChange,
  onThreadClick,
  loading
}) {
  const handleThreadSelect = (threadId, isSelected) => {
    if (isSelected) {
      onSelectionChange([...selectedThreads, threadId]);
    } else {
      onSelectionChange(selectedThreads.filter(id => id !== threadId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      onSelectionChange(threads.map(t => t.id));
    } else {
      onSelectionChange([]);
    }
  };

  if (loading) {
    return (
      <div className="thread-view loading">
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="thread-skeleton">
              <div className="skeleton-header"></div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
              <div className="skeleton-footer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="thread-view empty">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
            </svg>
          </div>
          <h3 className="empty-title">No threads found</h3>
          <p className="empty-description">
            {threads.length === 0 
              ? "Create your first incident thread to get started."
              : "Try adjusting your filters to see more results."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`thread-view view-${viewMode}`}>
      {/* Cards View */}
      {viewMode === VIEW_MODES.CARDS && (
        <div className="threads-cards">
          <div className="cards-grid">
            {threads.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                isSelected={selectedThreads.includes(thread.id)}
                onSelect={(isSelected) => handleThreadSelect(thread.id, isSelected)}
                onClick={() => onThreadClick(thread)}
              />
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === VIEW_MODES.LIST && (
        <div className="threads-list">
          <div className="list-header">
            <div className="list-header-row">
              <div className="header-cell checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectedThreads.length === threads.length && threads.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="select-all-checkbox"
                />
              </div>
              <div className="header-cell">Incident</div>
              <div className="header-cell">Priority</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">SLA</div>
              <div className="header-cell">Template</div>
              <div className="header-cell">Messages</div>
              <div className="header-cell">Last Activity</div>
              <div className="header-cell actions-cell">Actions</div>
            </div>
          </div>
          <div className="list-body">
            {threads.map(thread => (
              <ThreadListRow
                key={thread.id}
                thread={thread}
                isSelected={selectedThreads.includes(thread.id)}
                onSelect={(isSelected) => handleThreadSelect(thread.id, isSelected)}
                onClick={() => onThreadClick(thread)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === VIEW_MODES.KANBAN && (
        <ThreadKanban
          threads={threads}
          selectedThreads={selectedThreads}
          onSelectionChange={onSelectionChange}
          onThreadClick={onThreadClick}
        />
      )}

      {/* Selection summary */}
      {selectedThreads.length > 0 && (
        <div className="selection-summary">
          <span className="selection-count">
            {selectedThreads.length} of {threads.length} thread{threads.length !== 1 ? 's' : ''} selected
          </span>
          <button 
            className="clear-selection"
            onClick={() => onSelectionChange([])}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}