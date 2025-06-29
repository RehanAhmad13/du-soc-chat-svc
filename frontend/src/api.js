const API_BASE = import.meta.env.VITE_API_BASE || '/api/tenant'
const ADMIN_API_BASE = '/api/admin'

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 500) {
  try {
    const res = await fetch(url, options)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res
  } catch (err) {
    if (retries <= 0) throw err
    await new Promise(resolve => setTimeout(resolve, backoff))
    return fetchWithRetry(url, options, retries - 1, backoff * 2)
  }
}

// ===================== PUBLIC API FUNCTIONS =====================

export async function login(username, password) {
  const res = await fetchWithRetry('/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  return data.access
}

export async function registerUser(username, password) {
  const res = await fetchWithRetry(`${API_BASE}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  return res.json()
}

export async function getThreads(token, params = {}) {
  const queryParams = new URLSearchParams()
  
  // Add filtering parameters
  if (params.search) queryParams.append('search', params.search)
  if (params.status && params.status !== 'all') queryParams.append('status', params.status)
  if (params.priority && params.priority !== 'all') queryParams.append('priority', params.priority)
  if (params.sla_status && params.sla_status !== 'all') queryParams.append('sla_status', params.sla_status)
  if (params.assignee && params.assignee !== 'all') queryParams.append('assignee', params.assignee)
  if (params.template && params.template !== 'all') queryParams.append('template', params.template)
  if (params.date_range && params.date_range !== 'all') queryParams.append('date_range', params.date_range)
  if (params.my_threads) queryParams.append('my_threads', 'true')
  if (params.sort_by) queryParams.append('sort_by', params.sort_by)
  if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction)
  if (params.page_size) queryParams.append('page_size', params.page_size)
  if (params.page) queryParams.append('page', params.page)
  
  const queryString = queryParams.toString()
  const url = `${API_BASE}/threads/${queryString ? `?${queryString}` : ''}`
  
  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  // Handle paginated response - return the results array
  return data.results || data
}

export async function getMessages(threadId, token) {
  const res = await fetchWithRetry(`${API_BASE}/messages/?thread=${threadId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  // Handle paginated response - return the results array
  const messages = data.results || data
  return Array.isArray(messages) ? messages.filter(m => m.thread === threadId) : messages
}

export async function sendMessage(threadId, content, token) {
  const res = await fetchWithRetry(`${API_BASE}/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ thread: threadId, content })
  })
  return res.json()
}

export async function getTemplates(token) {
  const res = await fetchWithRetry(`${API_BASE}/templates/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  // Handle paginated response - return the results array
  return data.results || data
}

export async function getThread(threadId, token) {
  const res = await fetchWithRetry(`${API_BASE}/threads/${threadId}/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function createIncident(incidentData, token) {
  // Generate a unique incident ID if not provided
  const generateIncidentId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `INC-${timestamp}-${random.toUpperCase()}`
  }

  const incidentId = incidentData.incident_id || generateIncidentId()
  
  // If using template, use the from-incident endpoint
  if (incidentData.template_id) {
    const payload = {
      template: incidentData.template_id,
      metadata: {
        title: incidentData.title,
        description: incidentData.description,
        priority: incidentData.priority,
        tags: Array.isArray(incidentData.tags) ? incidentData.tags.join(', ') : '',
        assignee: incidentData.assignee || '',
        incident_id: incidentId,
        ...incidentData.templateFields // Include template-specific field data
      }
    }

    const res = await fetchWithRetry(`${API_BASE}/threads/from-incident/${incidentId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    return res.json()
  }

  // Otherwise use standard thread creation
  const payload = {
    incident_id: incidentId,
    template: null
  }

  const res = await fetchWithRetry(`${API_BASE}/threads/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  return res.json()
}

export async function getAdminThread(threadId, token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/threads/${threadId}/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

// ===================== ADMIN API FUNCTIONS =====================

// Dashboard & Analytics
export async function getAdminDashboardStats(token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/dashboard/stats/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function getSystemHealth(token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/system/health/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function getActivityFeed(token, limit = 50) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/activity/feed/?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

// Thread Management
export async function getAdminThreads(token, params = {}) {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value)
    }
  })
  
  const url = `${ADMIN_API_BASE}/threads/${searchParams.toString() ? '?' + searchParams.toString() : ''}`
  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function getAdminThreadDetail(threadId, token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/threads/${threadId}/detailed_view/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function bulkThreadAction(token, action, threadIds, params = {}) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/threads/bulk_action/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      action,
      thread_ids: threadIds,
      params
    })
  })
  return res.json()
}

// User Management
export async function getAdminUsers(token, params = {}) {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value)
    }
  })
  
  const url = `${ADMIN_API_BASE}/users/${searchParams.toString() ? '?' + searchParams.toString() : ''}`
  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function getAdminUserDetail(userId, token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/users/${userId}/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function getPendingApprovals(token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/users/pending_approvals/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function approveUser(userId, tenantId, token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/users/${userId}/approve/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ tenant_id: tenantId })
  })
  return res.json()
}

export async function rejectUser(userId, reason, token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/users/${userId}/reject/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  })
  return res.json()
}

// Tenant Management
export async function getAdminTenants(token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/tenants/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function createTenant(name, token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/tenants/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  })
  return res.json()
}

// Tenant Configuration Management
export async function getTenantConfigurations(token, params = {}) {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '' && value !== 'all') {
      searchParams.append(key, value)
    }
  })
  
  const url = `${ADMIN_API_BASE}/tenant-config/${searchParams.toString() ? '?' + searchParams.toString() : ''}`
  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function getTenantConfigurationOverview(token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/tenant-config/overview/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function suspendTenant(tenantId, reason, token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/tenant-config/${tenantId}/suspend/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  })
  return res.json()
}

export async function reactivateTenant(tenantId, token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/tenant-config/${tenantId}/reactivate/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
  return res.json()
}

// Template Management
export async function getAdminTemplates(token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/templates/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function createTemplate(templateData, token) {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/templates/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(templateData)
  })
  return res.json()
}

// Export & Reporting
export async function exportSystemData(token, format = 'json', dataType = 'all') {
  const res = await fetchWithRetry(`${ADMIN_API_BASE}/export/system/?format=${format}&type=${dataType}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (format === 'csv') {
    return res.blob()
  } else {
    return res.json()
  }
}

export async function exportThreads(threadIds, format, token) {
  return bulkThreadAction(token, 'export', threadIds, { format })
}

// Utility function for handling file downloads
export function downloadFile(data, filename, type = 'application/json') {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// ===================== ORGANIZATION API FUNCTIONS =====================

export async function getUsers(token, params = {}) {
  const queryParams = new URLSearchParams()
  
  if (params.search) queryParams.append('search', params.search)
  if (params.role && params.role !== 'all') queryParams.append('role', params.role)
  if (params.status && params.status !== 'all') queryParams.append('status', params.status)
  if (params.department && params.department !== 'all') queryParams.append('department', params.department)
  if (params.sort_by) queryParams.append('sort_by', params.sort_by)
  if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction)
  if (params.tenant_only) queryParams.append('tenant_only', 'true')
  
  const queryString = queryParams.toString()
  const url = `${API_BASE}/users/${queryString ? `?${queryString}` : ''}`
  
  const res = await fetchWithRetry(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return await res.json()
}

export async function getUserActivity(token, userId) {
  const res = await fetchWithRetry(`${API_BASE}/users/${userId}/activity/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return await res.json()
}
