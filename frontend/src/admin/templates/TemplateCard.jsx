import React from 'react'

const TemplateCard = ({ template, viewMode, onClick }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Incident Response': '#FF6B6B',
      'Vulnerability Management': '#4ECDC4',
      'Digital Forensics': '#45B7D1',
      'Post-Incident': '#96CEB4',
      'Change Management': '#FFEAA7',
      'Identity & Access Management': '#DDA0DD',
      'Threat Intelligence': '#FF8C94',
      'Service Management': '#98D8C8',
      'Operations': '#F7DC6F',
      'Compliance': '#BB8FCE'
    }
    return colors[category] || '#BDC3C7'
  }

  const getUsageLevel = (count) => {
    if (count >= 100) return 'high'
    if (count >= 50) return 'medium'
    return 'low'
  }

  if (viewMode === 'list') {
    return (
      <div className="template-card template-card-list" onClick={onClick}>
        <div className="template-card-main">
          <div className="template-card-header">
            <div className="template-name-section">
              <h3 className="template-name">{template.name}</h3>
              <span 
                className="template-category"
                style={{ backgroundColor: getCategoryColor(template.category) }}
              >
                {template.category}
              </span>
            </div>
            <div className="template-status-section">
              <span className={`template-status ${template.is_active ? 'active' : 'inactive'}`}>
                {template.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="template-version">v{template.version}</span>
            </div>
          </div>
          
          <div className="template-description">
            {template.description}
          </div>
        </div>

        <div className="template-card-stats">
          <div className="stat-group">
            <div className="stat-item">
              <span className="stat-value">{template.usage_count}</span>
              <span className="stat-label">Uses</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{template.tenant_count}</span>
              <span className="stat-label">Tenants</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{template.schema_fields}</span>
              <span className="stat-label">Fields</span>
            </div>
          </div>
          
          <div className="template-meta">
            <div className="meta-item">
              <span className="meta-label">Last used:</span>
              <span className="meta-value">{formatDate(template.last_used)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Completion time:</span>
              <span className="meta-value">{template.avg_completion_time}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="template-card template-card-grid" onClick={onClick}>
      <div className="template-card-header">
        <div className="template-title-section">
          <h3 className="template-name">{template.name}</h3>
          <span className="template-version">v{template.version}</span>
        </div>
        <div className="template-status-section">
          <span className={`template-status ${template.is_active ? 'active' : 'inactive'}`}>
            {template.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="template-category-section">
        <span 
          className="template-category"
          style={{ backgroundColor: getCategoryColor(template.category) }}
        >
          {template.category}
        </span>
      </div>

      <div className="template-description">
        {template.description.length > 120 
          ? `${template.description.substring(0, 120)}...` 
          : template.description
        }
      </div>

      <div className="template-metrics">
        <div className="metric-row">
          <div className="metric-item">
            <span className="metric-label">Usage</span>
            <div className="metric-value-with-indicator">
              <span className="metric-value">{template.usage_count}</span>
              <div className={`usage-indicator ${getUsageLevel(template.usage_count)}`}></div>
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-label">Tenants</span>
            <span className="metric-value">{template.tenant_count}</span>
          </div>
        </div>
        
        <div className="metric-row">
          <div className="metric-item">
            <span className="metric-label">Fields</span>
            <span className="metric-value">{template.schema_fields}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Avg. Time</span>
            <span className="metric-value">{template.avg_completion_time}</span>
          </div>
        </div>
      </div>

      <div className="template-footer">
        <div className="template-meta">
          <span className="meta-label">Last used:</span>
          <span className="meta-value">{formatDate(template.last_used)} at {formatTime(template.last_used)}</span>
        </div>
        <div className="template-meta">
          <span className="meta-label">Updated:</span>
          <span className="meta-value">{formatDate(template.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

export default TemplateCard