import { useState, useEffect } from 'react'
import { useAuth } from '../../AuthContext'
import ThreadFilters from './ThreadFilters'
import ThreadTable from './ThreadTable'
import ThreadActions from './ThreadActions'
import ThreadDetailsModal from './ThreadDetailsModal'
import './ThreadManagement.css'

export default function ThreadManagement() {
  const { token } = useAuth()
  const [threads, setThreads] = useState([])
  const [filteredThreads, setFilteredThreads] = useState([])
  const [selectedThreads, setSelectedThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    tenant: '',
    sla_status: '',
    priority: '',
    status: '',
    date_range: 'all',
    assigned_to: '',
    template: ''
  })
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [selectedThread, setSelectedThread] = useState(null)
  const [showThreadModal, setShowThreadModal] = useState(false)
  const [tenants, setTenants] = useState([])
  const [templates, setTemplates] = useState([])
  const [users, setUsers] = useState([])

  // Fetch threads and related data
  useEffect(() => {
    if (!token) return

    async function fetchThreadData() {
      try {
        setLoading(true)
        setError('')

        // Fetch threads, tenants, templates, and users in parallel
        const [threadsRes, tenantsRes, templatesRes, usersRes] = await Promise.all([
          fetch('/api/admin/threads/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/tenants/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/templates/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/users/', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        if (!threadsRes.ok) {
          throw new Error(`Failed to fetch threads: ${threadsRes.status}`)
        }

        // Parse all responses
        const threadsData = await threadsRes.json()
        const tenantsData = tenantsRes.ok ? await tenantsRes.json() : []
        const templatesData = templatesRes.ok ? await templatesRes.json() : []
        const usersData = usersRes.ok ? await usersRes.json() : []

        // Set the data
        setThreads(threadsData.results || threadsData || [])
        setTenants(tenantsData || [])
        setTemplates(templatesData || [])
        setUsers(usersData.results || usersData.users || [])
      } catch (err) {
        console.error('Failed to fetch thread data:', err)
        setError('Failed to load thread data')
      } finally {
        setLoading(false)
      }
    }

    fetchThreadData()
  }, [token])

  // Filter and sort threads
  useEffect(() => {
    let filtered = [...threads]

    // Apply filters
    if (filters.search) {
      filtered = filtered.filter(thread =>
        thread.incident_id.toLowerCase().includes(filters.search.toLowerCase()) ||
        thread.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        thread.tenant_name?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.tenant) {
      filtered = filtered.filter(thread => thread.tenant === parseInt(filters.tenant))
    }

    if (filters.sla_status) {
      filtered = filtered.filter(thread => thread.sla_status === filters.sla_status)
    }

    if (filters.priority) {
      filtered = filtered.filter(thread => thread.priority === filters.priority)
    }

    if (filters.status) {
      filtered = filtered.filter(thread => thread.status === filters.status)
    }

    if (filters.template) {
      filtered = filtered.filter(thread => thread.template === parseInt(filters.template))
    }

    if (filters.assigned_to) {
      filtered = filtered.filter(thread => thread.assigned_to_id === parseInt(filters.assigned_to))
    }

    // Apply date range filter
    if (filters.date_range !== 'all') {
      const now = new Date()
      const days = {
        'today': 1,
        'week': 7,
        'month': 30,
        'quarter': 90
      }[filters.date_range]

      if (days) {
        const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
        filtered = filtered.filter(thread => new Date(thread.created_at) >= cutoff)
      }
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        // Handle dates
        if (sortConfig.key.includes('_at')) {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        }

        // Handle strings
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredThreads(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [threads, filters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredThreads.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedThreads = filteredThreads.slice(startIndex, startIndex + itemsPerPage)

  // Event handlers
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectThread = (threadId, selected) => {
    if (selected) {
      setSelectedThreads(prev => [...prev, threadId])
    } else {
      setSelectedThreads(prev => prev.filter(id => id !== threadId))
    }
  }

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedThreads(paginatedThreads.map(t => t.id))
    } else {
      setSelectedThreads([])
    }
  }

  const handleBulkAction = async (action, options = {}) => {
    if (selectedThreads.length === 0) return

    try {
      const res = await fetch('/api/admin/threads/bulk_action/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          thread_ids: selectedThreads,
          ...options
        })
      })

      if (res.ok) {
        // Refresh threads after bulk action
        setSelectedThreads([])
        // In real implementation, refresh data or update state accordingly
        console.log(`Bulk ${action} completed for ${selectedThreads.length} threads`)
      }
    } catch (err) {
      console.error(`Bulk ${action} failed:`, err)
    }
  }

  const handleViewThread = (thread) => {
    setSelectedThread(thread)
    setShowThreadModal(true)
  }

  const handleCloseModal = () => {
    setSelectedThread(null)
    setShowThreadModal(false)
  }

  if (loading) {
    return (
      <div className="thread-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading threads...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="thread-management-error">
        <h3>Error Loading Threads</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="thread-management">
      <div className="thread-management-header">
        <div className="header-info">
          <h1>Thread Management</h1>
          <p>Monitor and manage all incident threads across all tenants</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{threads.length}</span>
            <span className="stat-label">Total Threads</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredThreads.length}</span>
            <span className="stat-label">Filtered</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{selectedThreads.length}</span>
            <span className="stat-label">Selected</span>
          </div>
        </div>
      </div>

      <ThreadFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        tenants={tenants}
        templates={templates}
        users={users}
      />

      {selectedThreads.length > 0 && (
        <ThreadActions
          selectedCount={selectedThreads.length}
          onBulkAction={handleBulkAction}
        />
      )}

      <ThreadTable
        threads={paginatedThreads}
        selectedThreads={selectedThreads}
        sortConfig={sortConfig}
        onSort={handleSort}
        onSelectThread={handleSelectThread}
        onSelectAll={handleSelectAll}
        onViewThread={handleViewThread}
        allSelected={paginatedThreads.length > 0 && selectedThreads.length === paginatedThreads.length}
        tenants={tenants}
        templates={templates}
        users={users}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="thread-pagination">
          <div className="pagination-info">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredThreads.length)} of {filteredThreads.length} threads
          </div>
          <div className="pagination-controls">
            <button
              className="btn btn-outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              First
            </button>
            <button
              className="btn btn-outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            <span className="pagination-current">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
            <button
              className="btn btn-outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </button>
          </div>
          <div className="pagination-size">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="page-size-select"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      )}

      {showThreadModal && selectedThread && (
        <ThreadDetailsModal
          thread={selectedThread}
          onClose={handleCloseModal}
          tenants={tenants}
          templates={templates}
          users={users}
        />
      )}
    </div>
  )
}

// Generate mock thread data for demonstration
function generateMockThreads() {
  const priorities = ['high', 'medium', 'low']
  const statuses = ['open', 'in_progress', 'waiting', 'resolved']
  const slaStatuses = ['active', 'at_risk', 'breached']
  const tenantIds = [1, 2, 3, 4]
  const templateIds = [1, 2, 3, 4]
  const userIds = [1, 2, 3, 4]

  const threads = []
  for (let i = 1; i <= 50; i++) {
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    
    threads.push({
      id: i,
      incident_id: `INC-2024-${String(i).padStart(3, '0')}`,
      title: `Security incident ${i}`,
      tenant_id: tenantIds[Math.floor(Math.random() * tenantIds.length)],
      tenant_name: ['Alpha Corp', 'Beta LLC', 'Gamma Inc', 'Delta Co'][tenantIds[Math.floor(Math.random() * tenantIds.length)] - 1],
      template_id: templateIds[Math.floor(Math.random() * templateIds.length)],
      template_name: ['Security Incident', 'Network Issue', 'System Alert', 'User Access Request'][templateIds[Math.floor(Math.random() * templateIds.length)] - 1],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      sla_status: slaStatuses[Math.floor(Math.random() * slaStatuses.length)],
      assigned_to_id: Math.random() > 0.3 ? userIds[Math.floor(Math.random() * userIds.length)] : null,
      assigned_to_name: Math.random() > 0.3 ? ['amina', 'khadija', 'sara', 'omar'][Math.floor(Math.random() * 4)] : null,
      created_at: createdAt.toISOString(),
      updated_at: new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      message_count: Math.floor(Math.random() * 20) + 1,
      participant_count: Math.floor(Math.random() * 5) + 1,
      last_activity: new Date(createdAt.getTime() + Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      escalated: Math.random() > 0.8
    })
  }
  
  return threads
}