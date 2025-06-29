import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext'

export default function UserList({ onViewUser }) {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tenants, setTenants] = useState([])

  useEffect(() => {
    if (!token) return

    async function fetchUsers() {
      try {
        setLoading(true)
        
        // Fetch users first
        const usersRes = await fetch('/api/admin/users/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        // Fetch tenants separately
        const tenantsRes = await fetch('/api/admin/tenants/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!usersRes.ok) {
          throw new Error(`Failed to fetch users: ${usersRes.status}`)
        }
        
        const usersData = await usersRes.json()
        const users = usersData.results || usersData.users || []
        
        // Add thread and message counts to each user
        const enrichedUsers = await Promise.all(users.map(async (user) => {
          try {
            const userDetailRes = await fetch(`/api/admin/users/${user.id}/`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            
            if (userDetailRes.ok) {
              const userDetail = await userDetailRes.json()
              return {
                ...user,
                thread_count: userDetail.stats?.threads_participated || 0,
                message_count: userDetail.stats?.messages_sent || 0
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch details for user ${user.id}:`, err)
          }
          
          // Fallback to basic user data
          return {
            ...user,
            thread_count: 0,
            message_count: 0
          }
        }))
        
        setUsers(enrichedUsers)
        
        // Handle tenants response
        if (tenantsRes.ok) {
          const tenantsData = await tenantsRes.json()
          setTenants(tenantsData || [])
        } else {
          console.warn('Failed to fetch tenants, using empty list')
          setTenants([])
        }
        
      } catch (err) {
        console.error('Failed to load users:', err)
        // Set empty arrays on error rather than mock data
        setUsers([])
        setTenants([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [token])

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.tenant?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (tenantFilter) {
      filtered = filtered.filter(user => user.tenant_id === parseInt(tenantFilter))
    }

    if (statusFilter) {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.is_active : !user.is_active
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, tenantFilter, statusFilter])

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (res.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, is_active: !currentStatus } : user
        ))
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    )
  }

  return (
    <div className="user-list">
      <div className="user-list-header">
        <div className="header-info">
          <h3>All Users ({filteredUsers.length})</h3>
          <p>Manage user accounts, permissions, and access</p>
        </div>
        <button className="btn btn-primary">
          <span className="btn-icon">✚</span>
          Add User
        </button>
      </div>

      <div className="user-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search users..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="">All Tenants</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚠</div>
          <h3>No Users Found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar-large">
                  {user.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className={`user-status ${user.is_active ? 'active' : 'inactive'}`}>
                  <div className={`status-indicator ${user.is_active ? 'online' : 'offline'}`}></div>
                </div>
              </div>

              <div className="user-card-body">
                <h4 className="user-card-name">{user.username}</h4>
                <p className="user-card-email">{user.email}</p>
                <div className="user-card-tenant">
                  <span className="tenant-badge">{user.tenant}</span>
                </div>
                
                <div className="user-card-meta">
                  <div className="meta-item">
                    <span className="meta-label">Threads:</span>
                    <span className="meta-value">{user.thread_count || 0}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Messages:</span>
                    <span className="meta-value">{user.message_count || 0}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Last Login:</span>
                    <span className="meta-value">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Status:</span>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {user.is_staff && (
                    <div className="meta-item">
                      <span className="meta-label">Role:</span>
                      <span className="staff-badge">Staff</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="user-card-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => onViewUser(user)}
                >
                  View Details
                </button>
                <button
                  className={`btn ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => toggleUserStatus(user.id, user.is_active)}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}