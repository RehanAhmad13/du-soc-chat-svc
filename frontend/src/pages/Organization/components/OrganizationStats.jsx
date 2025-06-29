import React from 'react';

export default function OrganizationStats({ stats, users }) {
  return (
    <div className="organization-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <h3>Total Members</h3>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-description">
            {stats.active} active, {stats.total - stats.active} inactive
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Currently Online</h3>
          </div>
          <div className="stat-value online">{stats.online}</div>
          <div className="stat-description">
            Active in last 15 minutes
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Administrators</h3>
          </div>
          <div className="stat-value admins">{stats.admins}</div>
          <div className="stat-description">
            {((stats.admins / stats.total) * 100).toFixed(1)}% of members
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Departments</h3>
          </div>
          <div className="stat-value departments">{stats.departments}</div>
          <div className="stat-description">
            Across organization
          </div>
        </div>
      </div>
    </div>
  );
}