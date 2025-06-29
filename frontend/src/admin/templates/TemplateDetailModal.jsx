import React, { useState, useEffect } from 'react'
import { useAuth } from '../../AuthContext'

const TemplateDetailModal = ({ template, onClose, onUpdate }) => {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [editedTemplate, setEditedTemplate] = useState(template)
  const [usageData, setUsageData] = useState(null)
  const [tenantList, setTenantList] = useState([])
  const [loading, setLoading] = useState(false)

  // Icons
  const Icons = {
    close: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    edit: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    save: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17,21 17,13 7,13 7,21"/>
        <polyline points="7,3 7,8 15,8"/>
      </svg>
    ),
    cancel: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    activity: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    ),
    schema: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16,18 22,12 16,6"/>
        <polyline points="8,6 2,12 8,18"/>
      </svg>
    )
  }

  useEffect(() => {
    if (activeTab === 'usage') {
      fetchUsageData()
    } else if (activeTab === 'tenants') {
      fetchTenantData()
    }
  }, [activeTab, template.id])

  const fetchUsageData = async () => {
    // Mock usage data - in production this would call an API
    setUsageData({
      daily_usage: [
        { date: '2024-06-15', count: 12 },
        { date: '2024-06-16', count: 8 },
        { date: '2024-06-17', count: 15 },
        { date: '2024-06-18', count: 6 },
        { date: '2024-06-19', count: 11 },
        { date: '2024-06-20', count: 9 },
        { date: '2024-06-21', count: 4 }
      ],
      completion_rate: 87.5,
      avg_response_time: template.avg_completion_time,
      error_rate: 2.3
    })
  }

  const fetchTenantData = async () => {
    // Mock tenant data - in production this would call an API
    setTenantList([
      { id: 1, name: 'Acme Corp', usage_count: 34, last_used: '2024-06-20T10:30:00Z', completion_rate: 92 },
      { id: 2, name: 'TechStart Inc', usage_count: 28, last_used: '2024-06-19T15:22:00Z', completion_rate: 85 },
      { id: 3, name: 'Global Dynamics', usage_count: 22, last_used: '2024-06-18T09:45:00Z', completion_rate: 91 },
      { id: 4, name: 'Innovation Labs', usage_count: 18, last_used: '2024-06-17T14:12:00Z', completion_rate: 78 },
      { id: 5, name: 'SecureNet Solutions', usage_count: 15, last_used: '2024-06-16T11:33:00Z', completion_rate: 94 }
    ])
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // In production, this would call updateTemplate API
      console.log('Saving template:', editedTemplate)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditedTemplate(template)
    setIsEditing(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseSchema = (schemaString) => {
    try {
      return JSON.parse(schemaString || '{}')
    } catch {
      return {}
    }
  }

  const renderOverviewTab = () => (
    <div className="tab-content">
      <div className="template-overview">
        <div className="overview-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTemplate.name}
                  onChange={(e) => setEditedTemplate({...editedTemplate, name: e.target.value})}
                  className="edit-input"
                />
              ) : (
                <span>{template.name}</span>
              )}
            </div>
            <div className="info-item">
              <label>Category:</label>
              {isEditing ? (
                <select
                  value={editedTemplate.category}
                  onChange={(e) => setEditedTemplate({...editedTemplate, category: e.target.value})}
                  className="edit-select"
                >
                  <option value="Incident Response">Incident Response</option>
                  <option value="Vulnerability Management">Vulnerability Management</option>
                  <option value="Digital Forensics">Digital Forensics</option>
                  <option value="Post-Incident">Post-Incident</option>
                  <option value="Change Management">Change Management</option>
                  <option value="Identity & Access Management">Identity & Access Management</option>
                  <option value="Threat Intelligence">Threat Intelligence</option>
                  <option value="Service Management">Service Management</option>
                  <option value="Operations">Operations</option>
                  <option value="Compliance">Compliance</option>
                </select>
              ) : (
                <span>{template.category}</span>
              )}
            </div>
            <div className="info-item">
              <label>Version:</label>
              <span>{template.version}</span>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <span className={`status-badge ${template.is_active ? 'active' : 'inactive'}`}>
                {template.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="info-item">
              <label>Created By:</label>
              <span>{template.created_by}</span>
            </div>
            <div className="info-item">
              <label>Last Updated:</label>
              <span>{formatDate(template.updated_at)}</span>
            </div>
          </div>
        </div>

        <div className="overview-section">
          <h3>Description</h3>
          {isEditing ? (
            <textarea
              value={editedTemplate.description}
              onChange={(e) => setEditedTemplate({...editedTemplate, description: e.target.value})}
              className="edit-textarea"
              rows={4}
            />
          ) : (
            <p>{template.description}</p>
          )}
        </div>

        <div className="overview-section">
          <h3>Usage Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{template.usage_count}</div>
              <div className="stat-label">Total Usage</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{template.tenant_count}</div>
              <div className="stat-label">Active Tenants</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{template.schema_fields}</div>
              <div className="stat-label">Schema Fields</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{template.avg_completion_time}</div>
              <div className="stat-label">Avg. Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSchemaTab = () => {
    const schema = parseSchema(template.schema)
    return (
      <div className="tab-content">
        <div className="schema-section">
          <h3>Template Schema</h3>
          <div className="schema-preview">
            <pre>{JSON.stringify(schema, null, 2)}</pre>
          </div>
          
          {schema.properties && (
            <div className="schema-fields">
              <h4>Fields ({Object.keys(schema.properties).length})</h4>
              <div className="fields-list">
                {Object.entries(schema.properties).map(([fieldName, fieldConfig]) => (
                  <div key={fieldName} className="field-item">
                    <div className="field-header">
                      <span className="field-name">{fieldName}</span>
                      <span className="field-type">{fieldConfig.type}</span>
                      {schema.required?.includes(fieldName) && (
                        <span className="field-required">Required</span>
                      )}
                    </div>
                    {fieldConfig.description && (
                      <div className="field-description">{fieldConfig.description}</div>
                    )}
                    {fieldConfig.enum && (
                      <div className="field-options">
                        Options: {fieldConfig.enum.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderUsageTab = () => (
    <div className="tab-content">
      <div className="usage-section">
        <h3>Usage Analytics</h3>
        
        {usageData && (
          <>
            <div className="usage-metrics">
              <div className="metric-card">
                <div className="metric-value">{usageData.completion_rate}%</div>
                <div className="metric-label">Completion Rate</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{usageData.avg_response_time}</div>
                <div className="metric-label">Avg. Response Time</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{usageData.error_rate}%</div>
                <div className="metric-label">Error Rate</div>
              </div>
            </div>

            <div className="usage-chart">
              <h4>Daily Usage (Last 7 Days)</h4>
              <div className="chart-container">
                {usageData.daily_usage.map((day, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar" 
                      style={{ height: `${(day.count / 20) * 100}%` }}
                    ></div>
                    <div className="bar-label">{day.date.split('-')[2]}</div>
                    <div className="bar-value">{day.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  const renderTenantsTab = () => (
    <div className="tab-content">
      <div className="tenants-section">
        <h3>Tenant Usage</h3>
        <div className="tenants-list">
          {tenantList.map(tenant => (
            <div key={tenant.id} className="tenant-item">
              <div className="tenant-info">
                <div className="tenant-name">{tenant.name}</div>
                <div className="tenant-meta">
                  Last used: {formatDate(tenant.last_used)}
                </div>
              </div>
              <div className="tenant-stats">
                <div className="tenant-stat">
                  <span className="stat-value">{tenant.usage_count}</span>
                  <span className="stat-label">Uses</span>
                </div>
                <div className="tenant-stat">
                  <span className="stat-value">{tenant.completion_rate}%</span>
                  <span className="stat-label">Completion</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-overlay">
      <div className="template-detail-modal">
        <div className="modal-header">
          <div className="modal-title">
            <h2>{template.name}</h2>
            <span className="template-version">v{template.version}</span>
          </div>
          <div className="modal-actions">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="btn-secondary btn-with-icon"
              >
                {Icons.edit}
                Edit
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  onClick={handleCancel}
                  className="btn-secondary btn-with-icon"
                  disabled={loading}
                >
                  {Icons.cancel}
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="btn-primary btn-with-icon"
                  disabled={loading}
                >
                  {Icons.save}
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
            <button onClick={onClose} className="btn-icon">
              {Icons.close}
            </button>
          </div>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'schema' ? 'active' : ''}`}
            onClick={() => setActiveTab('schema')}
          >
            {Icons.schema}
            Schema
          </button>
          <button 
            className={`tab-button ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            {Icons.activity}
            Usage
          </button>
          <button 
            className={`tab-button ${activeTab === 'tenants' ? 'active' : ''}`}
            onClick={() => setActiveTab('tenants')}
          >
            {Icons.users}
            Tenants ({template.tenant_count})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'schema' && renderSchemaTab()}
          {activeTab === 'usage' && renderUsageTab()}
          {activeTab === 'tenants' && renderTenantsTab()}
        </div>
      </div>
    </div>
  )
}

export default TemplateDetailModal