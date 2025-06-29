// src/pages/Chat/ReadReceiptIndicator.jsx
import { useState } from 'react'
import { formatReadTime } from './utils/chatUtils'

export default function ReadReceiptIndicator({ 
  readReceipts = [], 
  readBy = [], 
  readCount = 0, 
  showAvatars = false,
  status = 'read',
  className = '' 
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (readCount === 0 && status !== 'sent' && status !== 'delivered') {
    return null
  }

  const renderStatusIcon = () => {
    switch (status) {
      case 'sent':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        )
      case 'delivered':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '-4px' }}>
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
        )
      case 'read':
      default:
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#007bff" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#007bff" strokeWidth="2" style={{ marginLeft: '-4px' }}>
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
        )
    }
  }

  const renderAvatars = () => {
    if (!showAvatars || readBy.length === 0) return null

    const displayUsers = readBy.slice(0, 3) // Show max 3 avatars
    const extraCount = readBy.length - 3

    return (
      <div className="read-receipt-avatars">
        {displayUsers.map((username, index) => (
          <div
            key={username}
            className="user-avatar"
            style={{
              backgroundColor: `hsl(${username.charCodeAt(0) * 137.5 % 360}, 70%, 80%)`,
              marginLeft: index > 0 ? '-8px' : '0'
            }}
            title={username}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        ))}
        {extraCount > 0 && (
          <div className="user-avatar extra-count" title={`+${extraCount} more`}>
            +{extraCount}
          </div>
        )}
      </div>
    )
  }

  const renderTooltipContent = () => {
    if (readReceipts.length === 0) return null

    return (
      <div className="read-receipt-tooltip">
        <div className="tooltip-header">Read by {readCount} user{readCount !== 1 ? 's' : ''}</div>
        <div className="tooltip-body">
          {readReceipts.slice(0, 10).map((receipt, index) => (
            <div key={index} className="tooltip-item">
              <span className="username">{receipt.user}</span>
              <span className="timestamp">{formatReadTime(receipt.timestamp)}</span>
            </div>
          ))}
          {readReceipts.length > 10 && (
            <div className="tooltip-item more">
              +{readReceipts.length - 10} more
            </div>
          )}
        </div>
      </div>
    )
  }

  const getStatusText = () => {
    switch (status) {
      case 'sent':
        return 'Sent'
      case 'delivered':
        return 'Delivered'
      case 'read':
        if (readCount === 0) return 'Delivered'
        if (readCount === 1) return `Read by ${readBy[0]}`
        return `Read by ${readCount} users`
      default:
        return ''
    }
  }

  return (
    <div 
      className={`read-receipt-indicator ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="receipt-content">
        {renderStatusIcon()}
        
        {showAvatars ? (
          renderAvatars()
        ) : (
          <span className="status-text">{getStatusText()}</span>
        )}
      </div>

      {showTooltip && readReceipts.length > 0 && (
        <div className="tooltip-overlay">
          {renderTooltipContent()}
        </div>
      )}

      <style>{`
        .read-receipt-indicator {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 4px;
        }

        .receipt-content {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-text {
          font-size: 0.75rem;
          color: #64748b;
        }

        .read-receipt-avatars {
          display: flex;
          align-items: center;
        }

        .user-avatar {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 600;
          color: #333;
          border: 1px solid #fff;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .user-avatar.extra-count {
          background-color: #e2e8f0;
          color: #64748b;
          font-size: 7px;
        }

        .tooltip-overlay {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
          z-index: 1000;
        }

        .read-receipt-tooltip {
          background: #333;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-width: 180px;
          max-width: 250px;
        }

        .tooltip-header {
          font-weight: 600;
          margin-bottom: 6px;
          font-size: 0.75rem;
        }

        .tooltip-body {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .tooltip-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.7rem;
        }

        .tooltip-item.more {
          justify-content: center;
          color: #9ca3af;
          font-style: italic;
          margin-top: 3px;
        }

        .username {
          font-weight: 500;
        }

        .timestamp {
          color: #9ca3af;
          font-size: 0.65rem;
        }

        /* Tooltip arrow */
        .read-receipt-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 12px;
          border: 4px solid transparent;
          border-top-color: #333;
        }
      `}</style>
    </div>
  )
}