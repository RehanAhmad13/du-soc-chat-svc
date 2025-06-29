import React from 'react';
import { FiUser, FiMail, FiClock, FiShield } from 'react-icons/fi';
import UserFilters from './UserFilters';
import './UsersList.css';

export default function UsersList({
  users,
  loading,
  error,
  viewMode,
  filters,
  onFiltersChange,
  sortBy,
  sortDirection,
  onSortChange,
  onUserSelect,
  onRetry,
  orgStats
}) {

  const getStatusColor = (user) => {
    if (!user.is_active) return '#ef4444';
    
    const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
    if (!lastSeen) return '#6b7280';
    
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffMinutes < 15) return '#10b981'; // Online
    if (diffMinutes < 60) return '#f59e0b'; // Recently active
    return '#6b7280'; // Offline
  };

  const getStatusText = (user) => {
    if (!user.is_active) return 'Inactive';
    
    const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
    if (!lastSeen) return 'Never logged in';
    
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffMinutes < 15) return 'Online';
    if (diffMinutes < 60) return `${Math.round(diffMinutes)}m ago`;
    if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)}h ago`;
    return `${Math.round(diffMinutes / 1440)}d ago`;
  };

  const renderUserCard = (user) => (
    <div
      key={user.id}
      className="user-card"
      onClick={() => onUserSelect(user)}
    >
      <div className="user-avatar">
        <div className="avatar-circle">
          {user.first_name?.[0] || user.username?.[0] || 'U'}
        </div>
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor(user) }}
        ></div>
      </div>
      
      <div className="user-info">
        <div className="user-name">
          {user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.username
          }
        </div>
        <div className="user-email">{user.email}</div>
        {user.department && (
          <div className="user-department">{user.department}</div>
        )}
      </div>
      
      <div className="user-meta">
        <div className="user-role">
          {user.is_staff || user.role === 'admin' ? (
            <span className="role-badge admin">
              <FiShield size={12} />
              Admin
            </span>
          ) : (
            <span className="role-badge user">User</span>
          )}
        </div>
        <div className="user-status" style={{ color: getStatusColor(user) }}>
          {getStatusText(user)}
        </div>
      </div>
    </div>
  );

  const renderUserRow = (user) => (
    <div
      key={user.id}
      className="user-row"
      onClick={() => onUserSelect(user)}
    >
      <div className="row-cell avatar-cell">
        <div className="user-avatar-small">
          <div className="avatar-circle-small">
            {user.first_name?.[0] || user.username?.[0] || 'U'}
          </div>
          <div 
            className="status-indicator-small"
            style={{ backgroundColor: getStatusColor(user) }}
          ></div>
        </div>
      </div>
      
      <div className="row-cell name-cell">
        <div className="user-name">
          {user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.username
          }
        </div>
        <div className="user-username">@{user.username}</div>
      </div>
      
      <div className="row-cell email-cell">
        {user.email}
      </div>
      
      <div className="row-cell department-cell">
        {user.department || 'N/A'}
      </div>
      
      <div className="row-cell role-cell">
        {user.is_staff || user.role === 'admin' ? (
          <span className="role-badge admin">
            <FiShield size={12} />
            Admin
          </span>
        ) : (
          <span className="role-badge user">User</span>
        )}
      </div>
      
      <div className="row-cell status-cell">
        <span style={{ color: getStatusColor(user) }}>
          {getStatusText(user)}
        </span>
      </div>
      
      <div className="row-cell last-login-cell">
        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="users-loading">
          <div className="loading-spinner"></div>
          <span>Loading organization members...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="users-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="btn btn-primary" onClick={onRetry}>
            Try Again
          </button>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="no-users">
          <div className="no-users-icon">👥</div>
          <h3>No Members Found</h3>
          <p>No organization members match your current filters.</p>
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="users-grid">
          {users.map(renderUserCard)}
        </div>
      );
    }

    return (
      <div className="users-list">
        <div className="list-header">
          <div className="row-cell avatar-cell"></div>
          <div className="row-cell name-cell">Name</div>
          <div className="row-cell email-cell">Email</div>
          <div className="row-cell department-cell">Department</div>
          <div className="row-cell role-cell">Role</div>
          <div className="row-cell status-cell">Status</div>
          <div className="row-cell last-login-cell">Last Login</div>
        </div>
        
        <div className="list-body">
          {users.map(renderUserRow)}
        </div>
      </div>
    );
  };

  return (
    <div className="users-section">
      <UserFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        orgStats={orgStats}
      />
      
      <div className="users-content">
        {renderContent()}
      </div>
    </div>
  );
}