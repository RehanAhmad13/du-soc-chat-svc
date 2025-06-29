import { useState } from 'react'

export default function ThreadTable({
  threads,
  selectedThreads,
  sortConfig,
  onSort,
  onSelectThread,
  onSelectAll,
  onViewThread,
  allSelected,
  tenants,
  templates,
  users
}) {
  const [viewMode, setViewMode] = useState('comfortable') // compact, comfortable, spacious

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕'
    return sortConfig.direction === 'asc' ? '▲' : '▼'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
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

  const getSLAIcon = (slaStatus) => {
    const icons = {
      active: '✓',
      at_risk: '⚠',
      breached: '⚠'
    }
    return icons[slaStatus] || '⏱️'
  }

  const handleHeaderClick = (columnKey) => {
    onSort(columnKey)
  }

  if (threads.length === 0) {
    return (
      <div className="thread-table-empty">
        <div className="empty-icon">⚠</div>
        <h3>No threads found</h3>
        <p>Try adjusting your filters or create a new thread</p>
      </div>
    )
  }

  return (
    <div className="thread-table-container">
      {/* Table Header */}
      <div className="table-header">
        <div className="table-info">
          <span className="thread-count">{threads.length} threads</span>
          {selectedThreads.length > 0 && (
            <span className="selected-count">({selectedThreads.length} selected)</span>
          )}
        </div>
        <div className="table-controls">
          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
              onClick={() => setViewMode('compact')}
              title="Compact view"
            >
              ☰
            </button>
          </div>
          <button className="btn btn-outline btn-sm">
            <span className="btn-icon">📤</span>
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className={`thread-table view-${viewMode}`}>
          <thead>
            <tr>
              <th className="select-column">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="select-all-checkbox"
                />
              </th>
              <th 
                className="sortable-header"
                onClick={() => handleHeaderClick('incident_id')}
              >
                Incident ID {getSortIcon('incident_id')}
              </th>
              <th 
                className="sortable-header"
                onClick={() => handleHeaderClick('tenant_name')}
              >
                Tenant {getSortIcon('tenant_name')}
              </th>
              <th 
                className="sortable-header"
                onClick={() => handleHeaderClick('template_name')}
              >
                Template {getSortIcon('template_name')}
              </th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {threads.map(thread => (
              <tr 
                key={thread.id} 
                className={`thread-row ${selectedThreads.includes(thread.id) ? 'selected' : ''} ${thread.escalated ? 'escalated' : ''}`}
              >
                <td className="select-cell">
                  <input
                    type="checkbox"
                    checked={selectedThreads.includes(thread.id)}
                    onChange={(e) => onSelectThread(thread.id, e.target.checked)}
                    className="thread-checkbox"
                  />
                </td>

                <td className="incident-cell">
                  <div className="incident-info">
                    <span className="incident-id">{thread.incident_id}</span>
                    {thread.title && viewMode !== 'compact' && (
                      <span className="incident-title">{thread.title}</span>
                    )}
                    {thread.escalated && (
                      <span className="escalated-badge">⚠</span>
                    )}
                  </div>
                </td>

                <td className="tenant-cell">
                  <div className="tenant-info">
                    <span className="tenant-name">{thread.tenant_name}</span>
                  </div>
                </td>

                <td className="template-cell">
                  <span className="template-name">{thread.template_name || 'No Template'}</span>
                </td>

                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => window.open(`/chat/${thread.id}`, '_blank')}
                      title="Open chat"
                    >
                      💬 Open
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}