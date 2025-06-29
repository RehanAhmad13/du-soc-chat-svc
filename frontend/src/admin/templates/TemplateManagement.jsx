import { useState, useEffect } from 'react'
import { useAuth } from '../../AuthContext'
import { getAdminTemplates } from '../../api'
import TemplateCard from './TemplateCard'
import TemplateDetailModal from './TemplateDetailModal'
import TemplateFilters from './TemplateFilters'
import './TemplateManagement.css'

// Sophisticated Icons for Template Management
const Icons = {
  templates: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  filter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  download: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17,8 12,3 7,8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  grid: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  list: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}

export default function TemplateManagement() {
  const { token } = useAuth()
  const [templates, setTemplates] = useState([])
  const [filteredTemplates, setFilteredTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name') // 'name', 'category', 'usage', 'updated'

  // Template categories for filtering
  const categories = [
    'All',
    'Incident Response',
    'Vulnerability Management', 
    'Digital Forensics',
    'Post-Incident',
    'Change Management',
    'Identity & Access Management',
    'Threat Intelligence',
    'Service Management',
    'Operations',
    'Compliance'
  ]

  useEffect(() => {
    fetchTemplates()
  }, [token])

  useEffect(() => {
    filterAndSortTemplates()
  }, [templates, searchTerm, selectedCategory, selectedStatus, sortBy])

  const fetchTemplates = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      setError('')
      
      // For now, use mock data. In production, this would call getAdminTemplates(token)
      const mockTemplates = generateMockTemplates()
      setTemplates(mockTemplates)
      
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortTemplates = () => {
    let filtered = [...templates]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    // Status filter
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(template => 
        selectedStatus === 'Active' ? template.is_active : !template.is_active
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'category':
          return a.category.localeCompare(b.category)
        case 'usage':
          return b.usage_count - a.usage_count
        case 'updated':
          return new Date(b.updated_at) - new Date(a.updated_at)
        default:
          return 0
      }
    })

    setFilteredTemplates(filtered)
  }

  const generateMockTemplates = () => {
    // This would be replaced with real API data
    return [
      {
        id: 1,
        name: 'Incident Triage',
        category: 'Incident Response',
        description: 'Kick off a new chat with structured details about the alert. SOC admins use this to ensure tenants immediately confirm the incident scope before remediation begins.',
        version: '1.0',
        is_active: true,
        usage_count: 145,
        tenant_count: 12,
        last_used: '2024-06-20T10:30:00Z',
        updated_at: '2024-06-15T14:22:00Z',
        created_by: 'admin',
        schema_fields: 3,
        avg_completion_time: '5.2 minutes'
      },
      {
        id: 2,
        name: 'Vulnerability Clarification',
        category: 'Vulnerability Management',
        description: 'Request tenant to verify affected assets and CVSS before issuing patch guidance or IOC updates.',
        version: '1.0',
        is_active: true,
        usage_count: 89,
        tenant_count: 8,
        last_used: '2024-06-20T09:15:00Z',
        updated_at: '2024-06-10T11:45:00Z',
        created_by: 'admin',
        schema_fields: 3,
        avg_completion_time: '3.8 minutes'
      },
      {
        id: 3,
        name: 'Evidence Request',
        category: 'Digital Forensics',
        description: 'Standardize ask for logs or other forensic artefacts, with built-in file‐upload placeholders.',
        version: '1.0',
        is_active: true,
        usage_count: 67,
        tenant_count: 7,
        last_used: '2024-06-19T16:42:00Z',
        updated_at: '2024-06-12T09:33:00Z',
        created_by: 'admin',
        schema_fields: 4,
        avg_completion_time: '7.1 minutes'
      },
      {
        id: 4,
        name: 'Root Cause Analysis',
        category: 'Post-Incident',
        description: 'Post‐mortem template to capture what went wrong, when, and why—feeding into audit and continuous improvement.',
        version: '1.0',
        is_active: true,
        usage_count: 34,
        tenant_count: 5,
        last_used: '2024-06-18T13:27:00Z',
        updated_at: '2024-06-08T15:18:00Z',
        created_by: 'admin',
        schema_fields: 3,
        avg_completion_time: '12.5 minutes'
      },
      {
        id: 5,
        name: 'Compliance Audit Questionnaire',
        category: 'Compliance',
        description: 'Structured Q&A for compliance teams, with attachments for proof (policies, logs, screenshots).',
        version: '1.0',
        is_active: true,
        usage_count: 23,
        tenant_count: 4,
        last_used: '2024-06-17T11:18:00Z',
        updated_at: '2024-06-05T10:42:00Z',
        created_by: 'admin',
        schema_fields: 2,
        avg_completion_time: '18.3 minutes'
      }
    ]
  }

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template)
    setShowDetailModal(true)
  }

  const handleCreateTemplate = () => {
    // TODO: Implement template creation
    console.log('Create new template')
  }

  const handleExportTemplates = () => {
    // TODO: Implement template export
    console.log('Export templates')
  }

  const handleImportTemplates = () => {
    // TODO: Implement template import
    console.log('Import templates')
  }

  if (loading) {
    return (
      <div className="template-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading templates...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="template-management-error">
        <h3>Error Loading Templates</h3>
        <p>{error}</p>
        <button onClick={fetchTemplates} className="btn-retry">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="template-management">
      {/* Header */}
      <div className="template-header">
        <div className="template-header-main">
          <div className="template-header-icon">
            {Icons.templates}
          </div>
          <div className="template-header-content">
            <h1>Template Management</h1>
            <p>Manage SOC incident response templates and track usage analytics</p>
          </div>
        </div>
        
        <div className="template-header-actions">
          <button 
            onClick={handleImportTemplates}
            className="btn-secondary btn-with-icon"
          >
            {Icons.upload}
            Import
          </button>
          <button 
            onClick={handleExportTemplates}
            className="btn-secondary btn-with-icon"
          >
            {Icons.download}
            Export
          </button>
          <button 
            onClick={handleCreateTemplate}
            className="btn-primary btn-with-icon"
          >
            {Icons.plus}
            New Template
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="template-stats-overview">
        <div className="stat-item">
          <div className="stat-value">{templates.length}</div>
          <div className="stat-label">Total Templates</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{templates.filter(t => t.is_active).length}</div>
          <div className="stat-label">Active Templates</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{templates.reduce((sum, t) => sum + t.usage_count, 0)}</div>
          <div className="stat-label">Total Usage</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{new Set(templates.flatMap(t => Array(t.tenant_count).fill().map((_, i) => i))).size}</div>
          <div className="stat-label">Active Tenants</div>
        </div>
      </div>

      {/* Filters and Search */}
      <TemplateFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        categories={categories}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        icons={Icons}
      />

      {/* Results Summary */}
      <div className="template-results-summary">
        <p>
          Showing <strong>{filteredTemplates.length}</strong> of <strong>{templates.length}</strong> templates
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* Template Grid/List */}
      <div className={`template-container template-${viewMode}`}>
        {filteredTemplates.length === 0 ? (
          <div className="template-empty-state">
            <div className="empty-state-icon">{Icons.templates}</div>
            <h3>No templates found</h3>
            <p>Try adjusting your search criteria or create a new template.</p>
            <button onClick={handleCreateTemplate} className="btn-primary">
              Create First Template
            </button>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode={viewMode}
              onClick={() => handleTemplateClick(template)}
            />
          ))
        )}
      </div>

      {/* Template Detail Modal */}
      {showDetailModal && selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setShowDetailModal(false)}
          onUpdate={fetchTemplates}
        />
      )}
    </div>
  )
}