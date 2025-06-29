// src/hooks/useChatThread.js
import { useEffect, useState } from 'react'
import { getThread, getAdminThread } from '../../../api'

export function useChatThread(id, token, navigate) {
  const [threadDetails, setThreadDetails] = useState(null)
  const [messages, setMessages] = useState([])
  const [user, setUser] = useState({ username: 'You' })
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    // Clear any old cached data with user IDs instead of usernames
    localStorage.removeItem(`chat_${id}`)

    // Determine if user is admin from JWT token
    let isAdmin = false
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      isAdmin = payload.is_staff || payload.is_superuser
      setUser({ username: payload.username || payload.user || 'You' })
    } catch {}

    // Use admin endpoint if user is admin, regular endpoint otherwise
    const getThreadFunc = isAdmin ? getAdminThread : getThread
    
    getThreadFunc(id, token)
      .then(thread => {
        setThreadDetails(thread)
        // Ensure messages are sorted by created_at timestamp
        const sortedMessages = (thread.messages || []).sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        )
        setMessages(sortedMessages)
      })
      .catch(() => setLoadError('Failed to load thread data'))
  }, [id, token, navigate])

  useEffect(() => {
    localStorage.setItem(`chat_${id}`, JSON.stringify(messages))
  }, [messages, id])

  return { threadDetails, messages, setMessages, user, loadError }
}