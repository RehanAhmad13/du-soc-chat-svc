// src/components/ChatHeader.jsx
import React from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const SLA_HOURS = 24

function getTimeRemaining(createdAt) {
  const deadline = dayjs(createdAt).add(SLA_HOURS, 'hour')
  const now = dayjs()
  const diff = deadline.diff(now)

  if (diff <= 0) return { text: 'SLA Breached', status: 'breached' }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff / (1000 * 60)) % 60)

  return {
    text: `${hours}h ${minutes}m left`,
    status: hours < 2 ? 'critical' : hours < 6 ? 'warning' : 'good',
  }
}

function getPriorityInfo(priority) {
  const priorities = {
    high: { label: 'High', color: '#dc3545' },
    medium: { label: 'Medium', color: '#fd7e14' },
    low: { label: 'Low', color: '#28a745' },
  }
  return priorities[priority] || priorities.medium
}

function getStatusInfo(status) {
  const statuses = {
    active: { label: 'Active', color: '#007bff' },
    waiting: { label: 'Waiting', color: '#ffc107' },
    resolved: { label: 'Resolved', color: '#28a745' },
  }
  return statuses[status] || statuses.active
}

export default function ChatHeader({ threadDetails, loadError, online, unreadCount, onMarkAllRead, onBack, isAdmin }) {
  return (
    <div className="chat-header">
      {threadDetails ? (
        <>
          <div className="header-content">
            <div className="header-navigation">
              <button className="back-button" onClick={onBack} title={isAdmin ? "Back to Admin Dashboard" : "Back to Threads"}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span className="back-text">{isAdmin ? "Admin Dashboard" : "Threads"}</span>
              </button>
            </div>
            <div className="incident-header">
              <span className="incident-id">#{threadDetails.incident_id}</span>
              <span className="incident-title">
                {threadDetails.title || `Incident ${threadDetails.incident_id}`}
              </span>
            </div>
            <div className="header-subtitle">
              <div className="template-indicator">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Template: {threadDetails.template?.name || threadDetails.template_name || 'No Template'}
              </div>
            </div>
          </div>
          
          <div className="header-badges">
            {unreadCount > 0 && (
              <div className="unread-badge">
                <span className="unread-count">{unreadCount}</span>
                <span className="unread-text">unread</span>
                <button 
                  className="mark-read-btn"
                  onClick={onMarkAllRead}
                  title="Mark all as read"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                    <polyline points="16,10 14,12 11,9"/>
                  </svg>
                </button>
              </div>
            )}
            
            <div className={`pill-badge priority-${threadDetails.priority || 'medium'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {getPriorityInfo(threadDetails.priority || 'medium').label}
            </div>
            
            <div className={`pill-badge status-${threadDetails.status || 'active'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              {getStatusInfo(threadDetails.status || 'active').label}
            </div>
            
            {(() => {
              const sla = getTimeRemaining(threadDetails.created_at)
              return (
                <div className={`sla-badge sla-${sla.status}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  {sla.text}
                </div>
              )
            })()}
          </div>
        </>
      ) : (
        <div className="header-content">
          {loadError ? (
            <p className="error-msg">{loadError}</p>
          ) : (
            <div className="incident-id">Loading...</div>
          )}
        </div>
      )}
    </div>
  )
}