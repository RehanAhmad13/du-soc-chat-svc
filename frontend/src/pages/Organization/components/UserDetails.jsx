import React from 'react';
import { FiX, FiUser, FiMail, FiCalendar, FiShield } from 'react-icons/fi';

export default function UserDetails({ user, currentUser, isAdmin, onClose, onUpdate }) {
  if (!user) return null;

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'Never';
  };

  const getStatusColor = (user) => {
    if (!user.is_active) return '#ef4444';
    
    const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
    if (!lastSeen) return '#6b7280';
    
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffMinutes < 15) return '#10b981';
    if (diffMinutes < 60) return '#f59e0b';
    return '#6b7280';
  };

  return (
    <div className="modal-overlay">
      <div className="user-details-modal">
        <div className="modal-header">
          <div className="modal-title">
            <FiUser size={20} />
            <h2>User Details</h2>
          </div>
          <button
            className="close-btn"
            onClick={onClose}
            type="button"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="user-profile">
            <div className="user-avatar-large">
              {user.first_name?.[0] || user.username?.[0] || 'U'}
            </div>
            
            <div className="user-info-main">
              <h3>{user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.username
              }</h3>
              <p className="user-email">
                <FiMail size={16} />
                {user.email}
              </p>
              
              <div className="user-status" style={{ color: getStatusColor(user) }}>
                {user.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          <div className="user-details-grid">
            <div className="detail-section">
              <h4>Account Information</h4>
              <div className="detail-item">
                <span className="detail-label">Username:</span>
                <span className="detail-value">@{user.username}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Role:</span>
                <span className="detail-value">
                  {user.is_staff || user.role === 'admin' ? (
                    <span className="role-badge admin">
                      <FiShield size={12} />
                      Administrator
                    </span>
                  ) : (
                    <span className="role-badge user">User</span>
                  )}
                </span>
              </div>
              {user.department && (
                <div className="detail-item">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{user.department}</span>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h4>Activity</h4>
              <div className="detail-item">
                <span className="detail-label">Last Login:</span>
                <span className="detail-value">
                  <FiCalendar size={14} />
                  {formatDate(user.last_login)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Seen:</span>
                <span className="detail-value">
                  <FiCalendar size={14} />
                  {formatDate(user.last_seen)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Joined:</span>
                <span className="detail-value">
                  <FiCalendar size={14} />
                  {formatDate(user.date_joined)}
                </span>
              </div>
            </div>
          </div>

          {user.activity && (
            <div className="detail-section">
              <h4>Recent Activity</h4>
              <div className="activity-list">
                {user.activity.length > 0 ? (
                  user.activity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="activity-item">
                      <span className="activity-description">{activity.description}</span>
                      <span className="activity-time">{formatDate(activity.timestamp)}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-activity">No recent activity</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          {isAdmin && user.id !== currentUser?.id && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // TODO: Implement user management actions
                console.log('Manage user:', user.id);
              }}
            >
              Manage User
            </button>
          )}
        </div>
      </div>
    </div>
  );
}