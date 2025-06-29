// src/hooks/useChatSocket.js
import { useEffect, useRef, useState } from 'react'

export function useChatSocket(id, token, messages, setMessages, user) {
  const wsRef = useRef(null)
  const initialMessageIds = useRef(new Set(messages.map(m => m.id)))
  const messageEls = useRef({})
  const [online, setOnline] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [readReceipts, setReadReceipts] = useState({})
  const [wsError, setWsError] = useState('')

  useEffect(() => {
    if (!token) {
      return // Don't try to connect without a valid token
    }

    let socket, isMounted = true

    function connect(attempt = 0) {
      const scheme = location.protocol === 'https:' ? 'wss' : 'ws'
      // Use Django server port for WebSocket connections
      const wsBase = `${scheme}://localhost:8000/ws/chat`
      const wsUrl = `${wsBase}/${id}/?token=${token}`
      
      console.log(`Attempting WebSocket connection to: ${wsUrl}`)
      socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        console.log('WebSocket connected successfully')
        setWsError('')
      }

      socket.onmessage = evt => {
        const msg = JSON.parse(evt.data)
        switch (msg.type) {
          case 'message':
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(m => m.id === msg.id)) return prev
              
              // Add new message and sort by created_at timestamp to maintain chronological order
              const updatedMessages = [...prev, { ...msg }]
              return updatedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            })
            break
          case 'typing':
            setTypingUsers(list => {
              if (list.includes(msg.user)) return list
              const next = [...list, msg.user]
              setTimeout(() => setTypingUsers(cur => cur.filter(u => u !== msg.user)), 3000)
              return next
            })
            break
          case 'read':
            setReadReceipts(prev => {
              const seen = prev[msg.message_id] || []
              if (seen.includes(msg.user)) return prev
              return { ...prev, [msg.message_id]: [...seen, msg.user] }
            })
            
            // Update messages with enhanced read receipt data
            setMessages(prevMessages => 
              prevMessages.map(message => {
                if (message.id === msg.message_id) {
                  const updatedReceipts = [...(message.read_receipts || [])]
                  const existingReceiptIndex = updatedReceipts.findIndex(r => r.user === msg.user)
                  
                  if (existingReceiptIndex === -1) {
                    updatedReceipts.push({
                      user: msg.user,
                      timestamp: msg.timestamp || new Date().toISOString()
                    })
                  }
                  
                  return {
                    ...message,
                    read_receipts: updatedReceipts,
                    read_by: [...(message.read_by || []), msg.user].filter((u, i, arr) => arr.indexOf(u) === i),
                    read_count: updatedReceipts.length
                  }
                }
                return message
              })
            )
            break
          case 'presence':
            setOnline(list => {
              const next = new Set(list)
              msg.online ? next.add(msg.user) : next.delete(msg.user)
              return Array.from(next)
            })
            break
        }
      }

      socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        if (socket.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket error during connection attempt')
          // Don't immediately close, let onclose handle reconnection
        }
      }
      
      socket.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        if (attempt < 5 && isMounted) {
          const delay = Math.min(1000 * 2 ** attempt, 10000)
          console.log(`Reconnecting in ${delay}ms (attempt ${attempt + 1})`)
          setTimeout(() => connect(attempt + 1), delay)
        } else {
          setWsError('Connection lost. Please refresh.')
        }
      }
    }

    // Add small delay to ensure the thread is loaded before connecting
    setTimeout(() => connect(), 100)
    
    return () => {
      isMounted = false
      if (socket) {
        console.log('Closing WebSocket connection')
        socket.close()
      }
    }
  }, [id, token, setMessages])

  return {
    wsRef,
    initialMessageIds,
    messageEls,
    online,
    typingUsers,
    readReceipts,
    wsError,
  }
}