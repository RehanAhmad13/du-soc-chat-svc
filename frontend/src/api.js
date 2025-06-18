const API_BASE = '/api/chat'

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) throw new Error('Login failed')
  const data = await res.json()
  return data.token
}

export async function registerUser(username, password, inviteCode) {
  const res = await fetch(`${API_BASE}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, invite_code: inviteCode })
  })
  if (!res.ok) throw new Error('Registration failed')
  return res.json()
}

export async function getThreads(token) {
  const res = await fetch(`${API_BASE}/threads/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch threads')
  return res.json()
}

export async function getMessages(threadId, token) {
  const res = await fetch(`${API_BASE}/messages/?thread=${threadId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch messages')
  const data = await res.json()
  return Array.isArray(data) ? data.filter(m => m.thread === threadId) : data
}

export async function sendMessage(threadId, content, token) {
  const res = await fetch(`${API_BASE}/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ thread: threadId, content })
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}
