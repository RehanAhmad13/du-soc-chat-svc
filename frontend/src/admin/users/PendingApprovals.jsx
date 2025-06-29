import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext'

export default function PendingApprovals({ onViewUser }) {
  const { token } = useAuth()
  const [pendingUsers, setPendingUsers] = useState([])
  const [tenants, setTenants] = useState([])
  const [selectedTenants, setSelectedTenants] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    async function fetchPendingUsers() {
      try {
        setLoading(true)
        
        // Fetch pending users and tenants in parallel
        const [usersRes, tenantsRes] = await Promise.all([
          fetch('/api/admin/users/pending_approvals/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/tenants/', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        
        if (!usersRes.ok) {
          throw new Error(`Failed to fetch pending users: ${usersRes.status}`)
        }
        
        const usersData = await usersRes.json()
        const pendingUsers = usersData.users || []
        
        setPendingUsers(pendingUsers)
        
        // Handle tenants response
        if (tenantsRes.ok) {
          const tenantsData = await tenantsRes.json()
          setTenants(tenantsData || [])
        } else {
          console.warn('Failed to fetch tenants, using empty list')
          setTenants([])
        }

        // Set default tenant selections
        const defaults = {}
        pendingUsers.forEach(u => {
          if (u.tenant_id) defaults[u.id] = String(u.tenant_id)
        })
        setSelectedTenants(defaults)
        
      } catch (err) {
        console.error('Failed to load pending users:', err)
        setError('Failed to load pending users.')
      } finally {
        setLoading(false)
      }
    }

    fetchPendingUsers()
  }, [token])

  async function approveUser(userId) {
    const tenantId = selectedTenants[userId]
    if (!tenantId) {
      setError('Please select a tenant before approval.')
      return
    }

    setError('')
    setMessage('')

    try {
      const res = await fetch(`/api/admin/users/${userId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tenant_id: tenantId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Approval failed')

      setMessage(data.message || 'User approved successfully')
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      console.error('Failed to approve user:', err)
      setError('Failed to approve user.')
    }
  }

  async function rejectUser(userId) {
    if (!confirm('Are you sure you want to reject this user?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}/reject/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Rejected by administrator' })
      })
      
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
        setMessage('User rejected successfully')
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Rejection failed')
      }
    } catch (err) {
      console.error('Failed to reject user:', err)
      setError('Failed to reject user.')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading pending approvals...</p>
      </div>
    )
  }

  return (
    <div className="pending-approvals">
      {message && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {message}
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <h3>No Pending Approvals</h3>
          <p>All users have been processed. New registration requests will appear here.</p>
        </div>
      ) : (
        <div className="approvals-table-container">
          <div className="table-header">
            <h3>Pending User Approvals ({pendingUsers.length})</h3>
            <p>Review and approve new user registration requests</p>
          </div>

          <div className="table-responsive">
            <table className="approvals-table">
              <thead>
                <tr>
                  <th>User Information</th>
                  <th>Registration Date</th>
                  <th>Current Tenant</th>
                  <th>Assign To Tenant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.id} className="approval-row">
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="user-details">
                          <div className="user-name">{user.username}</div>
                          <div className="user-email">{user.email || 'No email provided'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="registration-date">
                        {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>
                    <td>
                      <div className="current-tenant">
                        {user.tenant || '—'}
                      </div>
                    </td>
                    <td>
                      <select
                        className="tenant-select"
                        value={selectedTenants[user.id] || ''}
                        onChange={e =>
                          setSelectedTenants(prev => ({
                            ...prev,
                            [user.id]: e.target.value
                          }))
                        }
                      >
                        <option value="">-- Select Tenant --</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-view"
                          onClick={() => onViewUser(user)}
                          title="View Details"
                        >
                          ℹ
                        </button>
                        <button
                          className="btn btn-approve"
                          onClick={() => approveUser(user.id)}
                          disabled={!selectedTenants[user.id]}
                          title="Approve User"
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => rejectUser(user.id)}
                          title="Reject User"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}