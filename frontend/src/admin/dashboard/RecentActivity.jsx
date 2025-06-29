import { useState, useEffect } from 'react'

// Sophisticated Activity Icons
const ActivityIcons = {
  threadCreated: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  slaBreach: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  userApproved: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  ),
  templateCreated: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  threadResolved: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  ),
  userLogin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10,17 15,12 10,7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  )
}

const getActivityIcon = (type) => {
  switch (type) {
    case 'thread_created': return ActivityIcons.threadCreated
    case 'sla_breach': return ActivityIcons.slaBreach
    case 'user_approved': return ActivityIcons.userApproved
    case 'template_created': return ActivityIcons.templateCreated
    case 'thread_resolved': return ActivityIcons.threadResolved
    case 'user_login': return ActivityIcons.userLogin
    default: return ActivityIcons.threadCreated
  }
}

export default function RecentActivity() {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    // Mock activity data - would come from API in real implementation
    const mockActivities = [
      {
        id: 1,
        type: 'thread_created',
        user: 'amina',
        action: 'created new thread',
        target: 'INC-2024-001',
        timestamp: '2 minutes ago',
        color: 'blue'
      },
      {
        id: 2,
        type: 'sla_breach',
        user: 'system',
        action: 'SLA breached for thread',
        target: 'INC-2024-002',
        timestamp: '5 minutes ago',
        color: 'red'
      },
      {
        id: 3,
        type: 'user_approved',
        user: 'admin',
        action: 'approved user',
        target: 'khadija',
        timestamp: '12 minutes ago',
        color: 'green'
      },
      {
        id: 4,
        type: 'template_created',
        user: 'admin',
        action: 'created template',
        target: 'Network Security Alert',
        timestamp: '25 minutes ago',
        color: 'purple'
      },
      {
        id: 5,
        type: 'thread_resolved',
        user: 'amina',
        action: 'resolved thread',
        target: 'INC-2024-003',
        timestamp: '1 hour ago',
        color: 'green'
      },
      {
        id: 6,
        type: 'user_login',
        user: 'khadija',
        action: 'logged in',
        target: 'Alpha Corp',
        timestamp: '2 hours ago',
        color: 'blue'
      }
    ]

    setActivities(mockActivities)
  }, [])

  return (
    <div className="recent-activity">
      <div className="activity-header">
        <h2>Recent Activity</h2>
        <button className="btn-view-all">View All</button>
      </div>

      <div className="activity-list">
        {activities.map(activity => (
          <div key={activity.id} className="activity-item">
            <div className={`activity-icon activity-${activity.color}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <div className="activity-description">
                <span className="activity-user">{activity.user}</span>
                <span className="activity-action">{activity.action}</span>
                <span className="activity-target">{activity.target}</span>
              </div>
              <div className="activity-timestamp">{activity.timestamp}</div>
            </div>
            <div className="activity-actions">
              <button className="btn-activity-detail">View</button>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="activity-empty">
          <p>No recent activity</p>
        </div>
      )}
    </div>
  )
}