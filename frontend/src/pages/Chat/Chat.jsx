// src/components/Chat.jsx
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'
import '../Chat.css'
import ChatHeader from './ChatHeader'
import ChatBubble from './ChatBubble'
import TypingIndicator from './TypingIndicator'
import StructuredInput from './StructuredInput'
import TextInput from './TextInput'
import { useChatThread } from './hooks/useChatThread'
import { useChatSocket } from './hooks/useChatSocket'
import { useReadReceipts } from './hooks/useReadReceipts'

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  // Determine if user is admin
  let isAdmin = false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    isAdmin = payload.is_staff || payload.is_superuser
  } catch {}

  // Handle back navigation
  const handleBack = () => {
    if (isAdmin) {
      navigate('/admin/threads')  // Go to admin thread management
    } else {
      navigate('/threads')  // Go to user threads page
    }
  }

  const [structuredMode, setStructuredMode] = useState(false)
  const [structuredFields, setStructuredFields] = useState({})
  const [text, setText] = useState('')
  const chatEndRef = useRef(null)

  const {
    threadDetails,
    messages,
    setMessages,
    user,
    loadError,
  } = useChatThread(id, token, navigate)

  const {
    online,
    typingUsers,
    readReceipts,
    wsError,
    wsRef,
    initialMessageIds,
    messageEls,
  } = useChatSocket(id, token, messages, setMessages, user)

  useReadReceipts(messages, readReceipts, user, wsRef, initialMessageIds, messageEls)

  // Auto-mark visible messages as read after a short delay
  useEffect(() => {
    if (messages.length === 0 || !user?.username) return
    
    const timer = setTimeout(() => {
      const unreadMessages = messages.filter(m => 
        m.sender !== user.username && 
        !(readReceipts[m.id] || []).includes(user.username)
      )
      
      // Mark up to 10 messages as read at a time to avoid spam
      unreadMessages.slice(0, 10).forEach(message => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ 
            type: 'read', 
            message_id: message.id 
          }))
        }
      })
    }, 2000) // 2 second delay after messages load
    
    return () => clearTimeout(timer)
  }, [messages.length, user?.username]) // Only run when message count or user changes

  // Calculate unread count - use WebSocket read receipts as primary source
  const unreadCount = messages.filter(m => {
    // Skip messages sent by current user
    if (m.sender === user?.username) return false
    
    // Check if current user has read this message via WebSocket
    const hasReadReceipt = (readReceipts[m.id] || []).includes(user?.username)
    
    // Check backend data if available
    const hasBackendReadReceipt = (m.read_by || []).includes(user?.username)
    
    // If we have backend data, use it; otherwise rely on WebSocket data
    if (m.read_by !== undefined) {
      return !hasBackendReadReceipt
    } else {
      // Fallback: if no read receipt data at all, consider it unread
      return !hasReadReceipt
    }
  }).length
  

  // Mark all messages as read
  const handleMarkAllRead = async () => {
    if (!threadDetails?.id) return
    
    try {
      // Determine if user is admin from JWT token
      let isAdmin = false
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        isAdmin = payload.is_staff || payload.is_superuser
      } catch {}
      
      // Use the correct API endpoint based on user type
      const apiBase = isAdmin ? '/api/admin' : '/api/tenant'
      const response = await fetch(`${apiBase}/threads/${threadDetails.id}/mark-all-read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // Update local state to mark all messages as read
        const unreadMessageIds = messages
          .filter(m => {
            if (m.sender === user?.username) return false
            const hasReadReceipt = (readReceipts[m.id] || []).includes(user?.username)
            const hasBackendReadReceipt = (m.read_by || []).includes(user?.username)
            return !hasReadReceipt && !hasBackendReadReceipt
          })
          .map(m => m.id)
        
        // Send read receipts for all unread messages
        unreadMessageIds.forEach(msgId => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ 
              type: 'read', 
              message_id: msgId 
            }))
          }
        })
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }


  useEffect(() => {
    // Auto-scroll and observe new messages
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    messages.forEach(m => {
      if (!initialMessageIds.current.has(m.id)) {
        const el = messageEls.current[m.id]
        if (el) {
          const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) observer.disconnect()
            })
          }, { threshold: 0.5 })
          observer.observe(el)
        }
      }
    })
  }, [messages])

  function sendMessage(e) {
    e.preventDefault()
    if (!wsRef.current) return

    if (structuredMode) {
      wsRef.current.send(JSON.stringify({ type: 'message', structured: structuredFields }))
      setStructuredFields({})
      setStructuredMode(false)
    } else if (text.trim()) {
      wsRef.current.send(JSON.stringify({ type: 'message', content: text }))
      setText('')
    }
  }

  function handleTextChange(e) {
    setText(e.target.value)
    wsRef.current?.send(JSON.stringify({ type: 'typing' }))
  }

  return (
    <div className="chat-wrapper">
      <ChatHeader
        threadDetails={threadDetails}
        loadError={loadError}
        online={online}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onBack={handleBack}
        isAdmin={isAdmin}
      />
      
      <div className="chat-main">
        {wsError && <p className="error-msg">{wsError}</p>}
        
        <div className="chat-messages">
          {messages.map(m => (
            <ChatBubble
              key={m.id}
              message={m}
              isOwn={m.sender === user?.username}
              seenBy={(readReceipts[m.id] || []).filter(u => u !== m.sender)}
              readReceipts={m.read_receipts || []}
              messageEls={messageEls}
            />
          ))}
          <div ref={chatEndRef} />
        </div>
        
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
      </div>
      
      <div className="participants-panel">
        <div className="participants-header">
          <span className="participants-title">Participants</span>
          <span className="participants-count">{online.filter(u => u !== user?.username).length + 1}</span>
        </div>
        <div className="participants-list">
          {user && (
            <div className="participant-item">
              <div className="participant-avatar">
                {user.username?.substring(0, 2).toUpperCase() || 'ME'}
              </div>
              <div className="participant-info">
                <div className="participant-name">{user.username} (You)</div>
                <div className="participant-status">
                  <div className="online-indicator"></div>
                  Online
                </div>
              </div>
            </div>
          )}
          {online.filter(username => username !== user?.username).map(username => (
            <div key={username} className="participant-item">
              <div className="participant-avatar">
                {username.substring(0, 2).toUpperCase()}
              </div>
              <div className="participant-info">
                <div className="participant-name">{username}</div>
                <div className="participant-status">
                  <div className="online-indicator"></div>
                  Online
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={sendMessage}>
          <div className="input-wrapper">
            <textarea
              value={text}
              onChange={handleTextChange}
              className="chat-input"
              placeholder="Type your message here..."
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <div className="input-actions">
              <button
                type="button"
                className="input-action-btn attach-btn"
                onClick={() => {
                  setStructuredFields({ device_id: '', start_time: '', end_time: '' })
                  setStructuredMode(true)
                }}
                title="Send structured data"
              >
                ⚙️
              </button>
              <button 
                type="submit" 
                className="input-action-btn send-btn"
                disabled={!text.trim()}
                title="Send message"
              >
                ➤
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {structuredMode && (
        <div className="structured-modal">
          <div className="structured-form">
            <form onSubmit={sendMessage}>
              <StructuredInput
                fields={structuredFields}
                setFields={setStructuredFields}
                onCancel={() => setStructuredMode(false)}
              />
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

