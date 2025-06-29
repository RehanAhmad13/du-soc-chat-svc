// AdminUsers.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import './AppFeatures.css'
import NewTemplateModal from '../components/NewTemplateModal'

export default function AdminUsers() {
  const { token } = useAuth()

  const [tenants, setTenants] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [threads, setThreads] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedTenants, setSelectedTenants] = useState({})
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    async function fetchData() {
      setError('')
      setMessage('')

      try {
        const res = await fetch('/api/chat/admin/approve-user-action/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`)

        setTenants(data.tenants || [])
        setPendingUsers(data.pending_users || [])
        setThreads(data.threads || [])

        const enrichedTemplates = (data.templates || []).map(t => {
          return { ...t, expanded: false }
        })
        setTemplates(enrichedTemplates)

        const defaults = {}
        ;(data.pending_users || []).forEach(u => {
          if (u.tenant_id) defaults[u.id] = String(u.tenant_id)
        })
        setSelectedTenants(defaults)
      } catch (err) {
        console.error('Failed to load admin data:', err)
        setError('Failed to load admin data.')
      }
    }

    fetchData()
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
      const res = await fetch('/api/chat/admin/approve-user-action/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId, tenant_id: tenantId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Approval failed')

      setMessage(data.message)
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      console.error('Failed to approve user:', err)
      setError('Failed to approve user.')
    }
  }

  const threadsByTenant = tenants.map(t => ({
    tenant: t,
    threads: threads.filter(th => th.tenant_id === t.id)
  }))

  const globalTemplates = templates.filter(t => !t.tenant_id)

  function toggleTemplateExpand(index) {
    setTemplates(prev =>
      prev.map((t, i) =>
        i === index ? { ...t, expanded: !t.expanded } : t
      )
    )
  }

  return (
    <div className="admin-wrapper">
      <h2 className="admin-heading">Admin Dashboard</h2>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="section-card">
        <div className="card-header">Pending User Approvals</div>
        <div className="card-body">
          {pendingUsers.length === 0 ? (
            <p className="no-data">No pending users.</p>
          ) : (
            <div className="table-responsive">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Current Tenant</th>
                    <th>Assign To</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email || '—'}</td>
                      <td>{user.tenant || '—'}</td>
                      <td>
                        <select
                          className="form-select"
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
                        <button
                          className="btn approve-btn"
                          onClick={() => approveUser(user.id)}
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="tenant-grid">
        {threadsByTenant.map(({ tenant, threads }) => (
          <div key={tenant.id} className="tenant-card">
            <div className="tenant-header">{tenant.name}</div>
            <div className="tenant-body">
              <div className="subheading">Threads</div>
              {threads.length === 0 ? (
                <p className="no-data">No threads yet.</p>
              ) : (
                <ul className="list">
                  {threads.map(th => (
                    <li key={th.id} style={{ marginBottom: '0.8rem' }}>
                      <strong>INC:</strong> {th.incident_id}{' '}
                      <em>(#{th.id})</em>
                      <div style={{ marginTop: '0.3rem' }}>
                        <a
                          href={`/api/chat/export/thread/${th.id}/?format=json`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-secondary"
                          style={{ marginRight: '0.5rem' }}
                        >
                          Export JSON
                        </a>
                        <a
                          href={`/api/chat/export/thread/${th.id}/?format=csv`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-secondary"
                        >
                          Export CSV
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="subheading">Users</div>
              {tenant.users && tenant.users.length ? (
                <ul className="list">
                  {tenant.users.map(u => (
                    <li key={u.id}>
                      {u.username}{' '}
                      <span className="text-muted">({u.email || '—'})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No active users.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="section-card templates-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Global Templates</span>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => setShowNewTemplateModal(true)}
          >
            + New Template
          </button>
        </div>
        <div className="card-body">
          {globalTemplates.length === 0 ? (
            <p className="no-data">No global templates yet.</p>
          ) : (
            globalTemplates.map((tpl, i) => (
              <div
                key={i}
                className={`template-item ${tpl.expanded ? 'expanded' : ''}`}
                onClick={() => toggleTemplateExpand(i)}
              >
                <div className="template-name">
                  {tpl.name || 'Unnamed Template'}
                </div>
                {tpl.expanded && (
                  <>
                    <div className="template-text">{tpl.text}</div>
                    <div className="template-schema">
                      Fields:
                      <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem' }}>
                        {Object.entries(tpl.schema || {}).map(([field, info]) => (
                          <li key={field}>
                            <strong>{field}</strong> ({info.type}
                            {info.options ? `: ${info.options.join(', ')}` : ''})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showNewTemplateModal && (
        <NewTemplateModal
          show={showNewTemplateModal}
          onClose={() => setShowNewTemplateModal(false)}
          onCreate={(newTpl) => setTemplates(prev => [...prev, newTpl])}
          token={token}
        />
      )}
    </div>
  )
}
