// AdminUsers.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import './AppFeatures.css'
import NewTemplateModal from '../components/NewTemplateModal'
import UserApprovalTable from '../components/UserApprovalTable'
import TenantCard from '../components/TenantCard'
import TemplatesView from '../components/TemplatesView'
import ThreadsSummaryChart from '../components/ThreadsSummaryChart'

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

      <UserApprovalTable
        pendingUsers={pendingUsers}
        tenants={tenants}
        selectedTenants={selectedTenants}
        setSelectedTenants={setSelectedTenants}
        approveUser={approveUser}
      />

      <ThreadsSummaryChart tenants={tenants} threads={threads} />

      <div className="tenant-grid">
        {threadsByTenant.map(({ tenant, threads }) => (
          <TenantCard key={tenant.id} tenant={tenant} threads={threads} />
        ))}
      </div>

      <TemplatesView
        templates={templates}
        toggleTemplateExpand={toggleTemplateExpand}
        onNew={() => setShowNewTemplateModal(true)}
      />

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
