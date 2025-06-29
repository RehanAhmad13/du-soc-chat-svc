export default function UserDetailsModal({ user, onClose }) {
  if (!user) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="user-detail-header">
            <div className="user-avatar-xl">
              {user.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="user-detail-info">
              <h3>{user.username}</h3>
              <p className="user-detail-email">{user.email}</p>
              <span className={`status-badge large ${user.is_active ? 'active' : 'inactive'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="user-detail-sections">
            <div className="detail-section">
              <h4>Account Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">User ID:</span>
                  <span className="detail-value">{user.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Username:</span>
                  <span className="detail-value">{user.username}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{user.email || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tenant:</span>
                  <span className="detail-value">{user.tenant || 'Unassigned'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Registration Date:</span>
                  <span className="detail-value">
                    {user.date_joined 
                      ? new Date(user.date_joined).toLocaleDateString()
                      : 'Unknown'
                    }
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Login:</span>
                  <span className="detail-value">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleString()
                      : 'Never logged in'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Permissions & Roles</h4>
              <div className="permission-list">
                <div className="permission-item">
                  <span className="permission-name">Staff Access</span>
                  <span className={`permission-status ${user.is_staff ? 'granted' : 'denied'}`}>
                    {user.is_staff ? '✅ Granted' : '❌ Denied'}
                  </span>
                </div>
                <div className="permission-item">
                  <span className="permission-name">Superuser</span>
                  <span className={`permission-status ${user.is_superuser ? 'granted' : 'denied'}`}>
                    {user.is_superuser ? '✅ Granted' : '❌ Denied'}
                  </span>
                </div>
                <div className="permission-item">
                  <span className="permission-name">Chat Access</span>
                  <span className="permission-status granted">✅ Granted</span>
                </div>
                <div className="permission-item">
                  <span className="permission-name">Template Creation</span>
                  <span className="permission-status granted">✅ Granted</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Activity Summary</h4>
              <div className="activity-stats">
                <div className="activity-stat">
                  <span className="stat-number">23</span>
                  <span className="stat-label">Threads Created</span>
                </div>
                <div className="activity-stat">
                  <span className="stat-number">156</span>
                  <span className="stat-label">Messages Sent</span>
                </div>
                <div className="activity-stat">
                  <span className="stat-number">4.2h</span>
                  <span className="stat-label">Avg Response Time</span>
                </div>
                <div className="activity-stat">
                  <span className="stat-number">92%</span>
                  <span className="stat-label">SLA Compliance</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Recent Activity</h4>
              <div className="recent-activity-list">
                <div className="activity-entry">
                  <span className="activity-icon">💬</span>
                  <div className="activity-details">
                    <span className="activity-text">Created thread INC-2024-001</span>
                    <span className="activity-time">2 hours ago</span>
                  </div>
                </div>
                <div className="activity-entry">
                  <span className="activity-icon">✅</span>
                  <div className="activity-details">
                    <span className="activity-text">Resolved thread INC-2024-002</span>
                    <span className="activity-time">1 day ago</span>
                  </div>
                </div>
                <div className="activity-entry">
                  <span className="activity-icon">🔑</span>
                  <div className="activity-details">
                    <span className="activity-text">Logged in to system</span>
                    <span className="activity-time">2 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary">
            Edit User
          </button>
          <button className={`btn ${user.is_active ? 'btn-warning' : 'btn-success'}`}>
            {user.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  )
}