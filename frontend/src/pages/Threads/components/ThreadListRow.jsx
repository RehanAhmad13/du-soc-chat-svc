import React, { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function ThreadListRow({ thread, isSelected, onSelect, onClick }) {
  const [showActions, setShowActions] = useState(false);

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308', 
      low: '#22c55e'
    };
    return colors[priority] || '#94a3b8';
  };

  const getSLAStatusColor = (slaStatus) => {
    const colors = {
      healthy: '#10b981',
      warning: '#f59e0b',
      breached: '#ef4444'
    };
    return colors[slaStatus] || '#94a3b8';
  };

  const getSLATimeRemaining = () => {
    const created = dayjs(thread.created_at);
    const now = dayjs();
    const slaHours = 24; // Default SLA
    const elapsed = now.diff(created, 'hour');
    const remaining = Math.max(slaHours - elapsed, 0);
    
    if (remaining <= 0) return 'Overdue';
    if (remaining < 1) return `${Math.round(remaining * 60)}m`;
    return `${remaining.toFixed(1)}h`;
  };

  const handleRowClick = (e) => {
    if (e.target.closest('.checkbox-cell') || e.target.closest('.actions-cell')) {
      return;
    }
    onClick();
  };

  const handleQuickAction = (action, e) => {
    e.stopPropagation();
    console.log(`Quick action: ${action} on thread ${thread.id}`);
  };

  return (
    <div 
      className={`list-row ${isSelected ? 'selected' : ''} ${thread.priority}`}
      onClick={handleRowClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Checkbox */}
      <div className="list-cell checkbox-cell">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="row-checkbox"
        />
      </div>

      {/* Incident Info */}
      <div className="list-cell incident-cell">
        <div className="incident-main">
          <span className="incident-id">#{thread.incident_id}</span>
          {thread.unread_count > 0 && (
            <span className="unread-indicator">{thread.unread_count}</span>
          )}
        </div>
        {thread.template && (
          <div className="incident-template">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            <span className="template-name">{thread.template.name}</span>
          </div>
        )}
      </div>

      {/* Priority */}
      <div className="list-cell priority-cell">
        <div className="priority-indicator">
          <div 
            className="priority-dot"
            style={{ backgroundColor: getPriorityColor(thread.priority) }}
          ></div>
          <span className="priority-text">{thread.priority}</span>
        </div>
      </div>

      {/* Status */}
      <div className="list-cell status-cell">
        <span className={`status-badge status-${thread.status || 'open'}`}>
          {thread.status || 'Open'}
        </span>
      </div>

      {/* SLA */}
      <div className="list-cell sla-cell">
        <div className="sla-info">
          <span 
            className={`sla-status sla-${thread.sla_status}`}
            style={{ color: getSLAStatusColor(thread.sla_status) }}
          >
            {getSLATimeRemaining()}
          </span>
          <div className="sla-progress-mini">
            <div 
              className={`sla-bar-mini sla-${thread.sla_status}`}
              style={{ 
                width: `${Math.min(((dayjs().diff(dayjs(thread.created_at), 'hour') / 24) * 100), 100)}%`,
                backgroundColor: getSLAStatusColor(thread.sla_status)
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Template */}
      <div className="list-cell template-cell">
        {thread.template ? (
          <span className="template-badge">
            {thread.template.name}
          </span>
        ) : (
          <span className="no-template">No template</span>
        )}
      </div>

      {/* Messages */}
      <div className="list-cell messages-cell">
        <div className="message-info">
          <span className="message-count">{thread.messages?.length || 0}</span>
          {thread.messages && thread.messages.length > 0 && (
            <div className="last-message-preview">
              <span className="last-sender">
                {thread.messages[thread.messages.length - 1].sender?.username || 'System'}
              </span>
              <span className="last-content">
                {thread.messages[thread.messages.length - 1].content.substring(0, 50)}
                {thread.messages[thread.messages.length - 1].content.length > 50 ? '...' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Last Activity */}
      <div className="list-cell activity-cell">
        <div className="activity-info">
          <span className="activity-time">
            {thread.last_activity ? dayjs(thread.last_activity).fromNow() : dayjs(thread.created_at).fromNow()}
          </span>
          <span className="activity-date">
            {thread.last_activity ? dayjs(thread.last_activity).format('MMM D, HH:mm') : dayjs(thread.created_at).format('MMM D, HH:mm')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="list-cell actions-cell">
        {showActions && (
          <div className="row-actions">
            <button 
              className="action-btn"
              onClick={(e) => handleQuickAction('assign', e)}
              title="Assign"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
            <button 
              className="action-btn"
              onClick={(e) => handleQuickAction('priority', e)}
              title="Set Priority"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
            <button 
              className="action-btn"
              onClick={(e) => handleQuickAction('more', e)}
              title="More"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}