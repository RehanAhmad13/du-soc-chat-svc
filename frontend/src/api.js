const API_BASE = '/api/chat'

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

export async function login(username, password) {
  const res = await fetchWithRetry(`${API_BASE}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  return data.token
}

export async function registerUser(username, password, inviteCode) {
  const res = await fetchWithRetry(`${API_BASE}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, invite_code: inviteCode })
  })
  return res.json()
}

export async function getThreads(token) {
  const res = await fetchWithRetry(`${API_BASE}/threads/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function getMessages(threadId, token) {
  const res = await fetchWithRetry(`${API_BASE}/messages/?thread=${threadId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  return Array.isArray(data) ? data.filter(m => m.thread === threadId) : data
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
