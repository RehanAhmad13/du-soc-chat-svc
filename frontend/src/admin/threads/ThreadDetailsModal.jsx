import { useState, useEffect } from 'react'
import { useAuth } from '../../AuthContext'

export default function ThreadDetailsModal({ thread, onClose, tenants, templates, users }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [wsConnection, setWsConnection] = useState(null)
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  // Load messages when thread or messages tab becomes active
  useEffect(() => {
    if (thread && activeTab === 'messages') {
      loadMessages()
      setupWebSocket()
    }
    
    return () => {
      if (wsConnection) {
        wsConnection.close()
        setWsConnection(null)
      }
    }
  }, [thread, activeTab])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/threads/${thread.id}/messages/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const messageData = await response.json()
        setMessages(messageData)
      } else {
        console.error('Failed to load messages:', response.status)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupWebSocket = () => {
    if (wsConnection) {
      wsConnection.close()
    }

    // Create WebSocket connection using the auth token
    const wsUrl = `ws://localhost:8000/ws/chat/${thread.id}/?token=${token}`
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected to thread', thread.id)
      setWsConnection(ws)
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'message') {
        // Add new message to the list
        setMessages(prev => [...prev, {
          id: data.id,
          content: data.content,
          sender: data.sender,
          is_admin: data.is_admin,
          created_at: data.created_at
        }])
      } else if (data.type === 'presence') {
        console.log(`User ${data.user} is ${data.online ? 'online' : 'offline'}`)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setWsConnection(null)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/threads/${thread.id}/send_message/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage })
      })
      
      if (response.ok) {
        setNewMessage('')
      } else {
        console.error('Failed to send message:', response.status)
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    } finally {
      setLoading(false)
    }
  }

  if (!thread) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return `${Math.floor(diffDays / 7)} weeks ago`
  }

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#dc3545',
      medium: '#fd7e14',
      low: '#28a745'
    }
    return colors[priority] || '#6c757d'
  }

  const getStatusColor = (status) => {
    const colors = {
      open: '#007bff',
      in_progress: '#17a2b8',
      waiting: '#ffc107',
      resolved: '#28a745'
    }
    return colors[status] || '#6c757d'
  }

  const getSLAColor = (slaStatus) => {
    const colors = {
      active: '#28a745',
      at_risk: '#ffc107',
      breached: '#dc3545'
    }
    return colors[slaStatus] || '#6c757d'
  }

  // Connection status indicator
  const getConnectionStatus = () => {
    if (!wsConnection) return '🔴 Disconnected'
    if (wsConnection.readyState === WebSocket.CONNECTING) return '🟡 Connecting...'
    if (wsConnection.readyState === WebSocket.OPEN) return '🟢 Connected'
    return '🔴 Disconnected'
  }

  const mockActivity = [
    { id: 1, type: 'status_change', user: 'amina', action: 'changed status from Open to In Progress', timestamp: '2024-01-15T12:00:00Z' },
    { id: 2, type: 'assignment', user: 'admin', action: 'assigned thread to khadija', timestamp: '2024-01-15T11:45:00Z' },
    { id: 3, type: 'priority_change', user: 'khadija', action: 'changed priority from Medium to High', timestamp: '2024-01-15T11:15:00Z' },
    { id: 4, type: 'escalation', user: 'system', action: 'escalated due to SLA risk', timestamp: '2024-01-15T10:45:00Z' }
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content thread-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="thread-modal-title">
            <h2>{thread.incident_id}</h2>
            <span className="thread-modal-subtitle">{thread.title}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="thread-modal-nav">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            ℹ Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            💬 Messages ({thread.message_count})
          </button>
          <button 
            className={`nav-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            ⌨ Activity
          </button>
          <button 
            className={`nav-tab ${activeTab === 'participants' ? 'active' : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            ♥ Participants ({thread.participant_count})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Status Cards */}
              <div className="status-cards">
                <div className="status-card">
                  <div className="status-card-header">
                    <span className="status-icon">🏷️</span>
                    <span className="status-label">Status</span>
                  </div>
                  <div 
                    className="status-value"
                    style={{ color: getStatusColor(thread.status) }}
                  >
                    {thread.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="status-card">
                  <div className="status-card-header">
                    <span className="status-icon">🔥</span>
                    <span className="status-label">Priority</span>
                  </div>
                  <div 
                    className="status-value"
                    style={{ color: getPriorityColor(thread.priority) }}
                  >
                    {thread.priority}
                  </div>
                </div>

                <div className="status-card">
                  <div className="status-card-header">
                    <span className="status-icon">⏱️</span>
                    <span className="status-label">SLA Status</span>
                  </div>
                  <div 
                    className="status-value"
                    style={{ color: getSLAColor(thread.sla_status) }}
                  >
                    {thread.sla_status.replace('_', ' ')}
                  </div>
                </div>

                <div className="status-card">
                  <div className="status-card-header">
                    <span className="status-icon">👤</span>
                    <span className="status-label">Assigned To</span>
                  </div>
                  <div className="status-value">
                    {thread.assigned_to_name || 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* Thread Information */}
              <div className="thread-info-sections">
                <div className="info-section">
                  <h4>Thread Details</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Incident ID:</span>
                      <span className="info-value">{thread.incident_id}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Tenant:</span>
                      <span className="info-value">{thread.tenant_name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Template:</span>
                      <span className="info-value">{thread.template_name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Created:</span>
                      <span className="info-value">{formatDate(thread.created_at)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Updated:</span>
                      <span className="info-value">{formatDate(thread.updated_at)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Activity:</span>
                      <span className="info-value">{getTimeAgo(thread.last_activity)}</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h4>Activity Summary</h4>
                  <div className="activity-stats">
                    <div className="activity-stat">
                      <span className="stat-number">{thread.message_count}</span>
                      <span className="stat-label">Messages</span>
                    </div>
                    <div className="activity-stat">
                      <span className="stat-number">{thread.participant_count}</span>
                      <span className="stat-label">Participants</span>
                    </div>
                    <div className="activity-stat">
                      <span className="stat-number">4.2h</span>
                      <span className="stat-label">Avg Response</span>
                    </div>
                    <div className="activity-stat">
                      <span className="stat-number">
                        {thread.escalated ? '1' : '0'}
                      </span>
                      <span className="stat-label">Escalations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="messages-tab">
              <div className="messages-header">
                <div className="connection-status">
                  <span className="status-indicator">{getConnectionStatus()}</span>
                  <span className="message-count">{messages.length} messages</span>
                </div>
              </div>
              
              <div className="admin-chat-interface">
                <div className="messages-container">
                  {loading && messages.length === 0 ? (
                    <div className="loading-messages">Loading messages...</div>
                  ) : (
                    messages.map(message => (
                      <div key={message.id} className={`message-item ${message.is_admin ? 'admin-message' : 'user-message'}`}>
                        <div className="message-header">
                          <span className="message-sender">
                            {message.is_admin && '👑 '}
                            {message.sender}
                            {message.is_admin && ' (Admin)'}
                          </span>
                          <span className="message-time">{formatDate(message.created_at)}</span>
                        </div>
                        <div className="message-content">{message.content}</div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="message-input-section">
                  <div className="message-input">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message as admin..."
                      onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                      disabled={loading}
                      className="admin-message-input"
                    />
                    <button 
                      onClick={sendMessage} 
                      className="btn btn-primary send-button"
                      disabled={loading || !newMessage.trim()}
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  <div className="admin-message-note">
                    💡 Messages sent here will be visible to all thread participants as admin messages
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab">
              <div className="activity-timeline">
                {mockActivity.map(activity => (
                  <div key={activity.id} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-user">{activity.user}</span>
                        <span className="timeline-time">{formatDate(activity.timestamp)}</span>
                      </div>
                      <div className="timeline-action">{activity.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="participants-tab">
              <div className="participants-list">
                <div className="participant-item">
                  <div className="participant-avatar">A</div>
                  <div className="participant-info">
                    <div className="participant-name">amina</div>
                    <div className="participant-role">Thread Creator</div>
                  </div>
                  <div className="participant-stats">
                    <span className="stat">5 messages</span>
                    <span className="stat">Last active 2h ago</span>
                  </div>
                </div>
                <div className="participant-item">
                  <div className="participant-avatar">K</div>
                  <div className="participant-info">
                    <div className="participant-name">khadija</div>
                    <div className="participant-role">Assigned Analyst</div>
                  </div>
                  <div className="participant-stats">
                    <span className="stat">12 messages</span>
                    <span className="stat">Online now</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="footer-actions">
            <button className="btn btn-outline" onClick={onClose}>
              Close
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => window.open(`/chat/${thread.id}`, '_blank')}
            >
              💬 Open Chat
            </button>
            <button className="btn btn-secondary">
              📤 Export
            </button>
            <button className="btn btn-warning">
              ⚠ Escalate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}