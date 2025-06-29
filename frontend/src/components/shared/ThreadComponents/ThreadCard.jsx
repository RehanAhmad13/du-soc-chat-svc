import React, { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import './ThreadCard.css';

dayjs.extend(relativeTime);

export default function ThreadCard({ thread, isSelected, onSelect, onClick, context = 'general' }) {
  const [showActions, setShowActions] = useState(false);

  const getPriorityIcon = (priority) => {
    const icons = {
      critical: '🔴',
      high: '🟠', 
      medium: '🟡',
      low: '🟢'
    };
    return icons[priority] || '⚪';
  };

  const getSLAProgress = () => {
    const created = dayjs(thread.created_at);
    const now = dayjs();
    const slaHours = 24;
    const elapsed = now.diff(created, 'hour');
    const progress = Math.min((elapsed / slaHours) * 100, 100);
    
    return {
      progress,
      isBreached: progress >= 100,
      isWarning: progress >= 80,
      timeRemaining: Math.max(slaHours - elapsed, 0)
    };
  };

  const slaInfo = getSLAProgress();

  const handleCardClick = (e) => {
    if (e.target.closest('.card-actions') || e.target.closest('.checkbox-wrapper')) {
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
      className={`thread-card ${isSelected ? 'selected' : ''} ${thread.priority} ${context}`}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Card header */}
      <div className="card-header">
        <div className="header-left">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="thread-checkbox"
            />
          </div>
          
          <div className="incident-info">
            <div className="incident-id">
              <span className="incident-number">#{thread.incident_id}</span>
              {thread.unread_count > 0 && (
                <span className="unread-badge">{thread.unread_count}</span>
              )}
            </div>
            <div className="thread-meta">
              <span className="priority-indicator">
                {getPriorityIcon(thread.priority)}
                <span className="priority-text">{thread.priority}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="header-right">
          {showActions && (
            <div className="card-actions">
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
                title="More actions"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SLA Progress - Only show in incidents context */}
      {context === 'incidents' && (
        <div className="sla-section">
          <div className="sla-header">
            <span className="sla-label">SLA Status</span>
            <span className={`sla-status ${thread.sla_status}`}>
              {thread.sla_status === 'breached' ? 'BREACHED' : 
               thread.sla_status === 'warning' ? 'AT RISK' : 'ON TRACK'}
            </span>
          </div>
          <div className="sla-progress">
            <div 
              className={`sla-bar ${slaInfo.isBreached ? 'breached' : slaInfo.isWarning ? 'warning' : 'healthy'}`}
              style={{ width: `${slaInfo.progress}%` }}
            ></div>
          </div>
          <div className="sla-time">
            {slaInfo.isBreached ? (
              <span className="time-breached">Overdue</span>
            ) : (
              <span className="time-remaining">{slaInfo.timeRemaining.toFixed(1)}h remaining</span>
            )}
          </div>
        </div>
      )}

      {/* Template info */}
      {thread.template && (
        <div className="template-section">
          <div className="template-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            <span className="template-name">{thread.template.name}</span>
          </div>
        </div>
      )}

      {/* Last message preview */}
      <div className="message-preview">
        {thread.messages && thread.messages.length > 0 ? (
          <div className="last-message">
            <div className="message-content">
              {thread.messages[thread.messages.length - 1].content}
            </div>
            <div className="message-meta">
              <span className="message-author">
                {thread.messages[thread.messages.length - 1].sender?.username || 'System'}
              </span>
              <span className="message-time">
                {dayjs(thread.messages[thread.messages.length - 1].created_at).fromNow()}
              </span>
            </div>
          </div>
        ) : (
          <div className="no-messages">
            <span className="no-messages-text">No messages yet</span>
          </div>
        )}
      </div>

      {/* Activity indicators */}
      <div className="activity-section">
        <div className="activity-stats">
          <div className="activity-stat">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>
            </svg>
            <span className="stat-value">{thread.messages?.length || 0}</span>
            <span className="stat-label">messages</span>
          </div>
          
          {thread.attachments_count > 0 && (
            <div className="activity-stat">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
              </svg>
              <span className="stat-value">{thread.attachments_count}</span>
              <span className="stat-label">files</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer with timestamps */}
      <div className="card-footer">
        <div className="timestamp-info">
          <div className="created-time">
            <span className="time-label">Created</span>
            <span className="time-value">{dayjs(thread.created_at).format('MMM D, HH:mm')}</span>
          </div>
          {thread.last_activity && (
            <div className="activity-time">
              <span className="time-label">Last activity</span>
              <span className="time-value">{dayjs(thread.last_activity).fromNow()}</span>
            </div>
          )}
        </div>

        {/* Thread tags */}
        {thread.tags && thread.tags.length > 0 && (
          <div className="thread-tags">
            {thread.tags.slice(0, 3).map(tag => (
              <span key={tag} className="thread-tag">
                {tag}
              </span>
            ))}
            {thread.tags.length > 3 && (
              <span className="thread-tag more">+{thread.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}