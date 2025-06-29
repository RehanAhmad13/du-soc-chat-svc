
export default function ThreadFilters({ filters, onFilterChange, tenants, templates }) {

  const handleInputChange = (key, value) => {
    onFilterChange({ [key]: value })
  }

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      tenant: '',
      template: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value && value !== 'all')

  return (
    <div className="thread-filters-compact">
      {/* Compact Search and Essential Filters */}
      <div className="filters-main-compact">
        <div className="search-section-compact">
          <div className="search-input-wrapper-compact">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search incident ID, title, or tenant"
              className="search-input-compact"
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
            {filters.search && (
              <button
                className="search-clear-compact"
                onClick={() => handleInputChange('search', '')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Essential Filters */}
        <div className="essential-filters">
          <select
            value={filters.tenant}
            onChange={(e) => handleInputChange('tenant', e.target.value)}
            className="filter-select-compact"
            style={{ color: filters.tenant ? '#374151' : '#6b7280' }}
          >
            <option value="" disabled hidden>Select Tenant</option>
            <option value="">All Tenants</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>

          <select
            value={filters.template}
            onChange={(e) => handleInputChange('template', e.target.value)}
            className="filter-select-compact"
            style={{ color: filters.template ? '#374151' : '#6b7280' }}
          >
            <option value="" disabled hidden>Select Template</option>
            <option value="">All Templates</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              className="btn btn-clear-compact"
              onClick={handleClearFilters}
              title="Clear all filters"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Simple Active Filter Tags */}
      {hasActiveFilters && (
        <div className="active-filters-compact">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === 'all') return null
            
            let displayValue = value
            if (key === 'tenant') {
              const tenant = tenants.find(t => t.id === parseInt(value))
              displayValue = tenant ? tenant.name : value
            } else if (key === 'template') {
              const template = templates.find(t => t.id === parseInt(value))
              displayValue = template ? template.name : value
            } else if (key === 'search') {
              displayValue = `"${value}"`
            }

            return (
              <div key={key} className="filter-tag-compact">
                <span className="filter-tag-text-compact">{displayValue}</span>
                <button
                  className="filter-tag-remove-compact"
                  onClick={() => handleInputChange(key, '')}
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}