import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMessages } from '../api'
import { useAuth } from '../AuthContext'
import './Chat.css'

export default function Chat() {
  const { id } = useParams()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [structuredMode, setStructuredMode] = useState(false)
  const [structuredFields, setStructuredFields] = useState({})
  const [online, setOnline] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [readReceipts, setReadReceipts] = useState({})
  const [loadError, setLoadError] = useState('')
  const [wsError, setWsError] = useState('')
  const [user, setUser] = useState(null)

  const wsRef = useRef(null)
  const observer = useRef(null)
  const messageEls = useRef({})             // Map: msgId → DOM node
  const initialMessageIds = useRef(new Set()) // Track IDs loaded on mount
  const autoScrolling = useRef(false)
  const navigate = useNavigate()
  const { token } = useAuth()
  const chatEndRef = useRef(null)

  // 1️⃣ Initial load & WebSocket setup
  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ username: payload.username || payload.user || 'You' })
    } catch {
      setUser({ username: 'You' })
    }

    // Fetch and record initial IDs
    getMessages(id, token)
      .then(msgs => {
        setMessages(msgs)
        initialMessageIds.current = new Set(msgs.map(m => m.id))
      })
      .catch(() => setLoadError('Failed to load messages'))

    let socket, isMounted = true
    function connect(attempt = 0) {
      const scheme = location.protocol === 'https:' ? 'wss' : 'ws'
      const wsBase = `${scheme}://${location.host}/ws/chat`
      socket = new WebSocket(`${wsBase}/${id}/?token=${token}`)
      wsRef.current = socket

      socket.onmessage = evt => {
        const msg = JSON.parse(evt.data)

        switch (msg.type) {
          case 'message':
            setMessages(prev =>
              prev.some(m => m.id === msg.id)
                ? prev
                : [...prev, {
                    id: msg.id,
                    content: msg.content,
                    sender: msg.sender,
                    structured: msg.structured || null
                  }]
            )
            break

          case 'presence':
            setOnline(list => {
              const next = new Set(list)
              msg.online ? next.add(msg.user) : next.delete(msg.user)
              return Array.from(next)
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
            break
        }
      }

      socket.onopen = () => setWsError('')
      socket.onerror = () => socket.close()
      socket.onclose = () => {
        if (attempt < 5 && isMounted) {
          const delay = Math.min(1000 * 2 ** attempt, 10000)
          setTimeout(() => connect(attempt + 1), delay)
        } else {
          setWsError('Connection lost. Please refresh to retry.')
        }
      }
    }

    connect()
    return () => {
      isMounted = false
      socket?.close()
    }
  }, [id, token, navigate])

  // 2️⃣ IntersectionObserver + visibility guard
  useEffect(() => {
    observer.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const msgId = entry.target.dataset.msgId
        if (
          entry.isIntersecting &&
          document.visibilityState === 'visible' &&
          !autoScrolling.current
        ) {
          const msg = messages.find(m => String(m.id) === msgId)
          // Only fire for messages that were NOT in the initial set
          if (
            msg &&
            !initialMessageIds.current.has(msg.id) &&
            msg.sender !== user?.username &&
            !readReceipts[msgId]?.includes(user.username)
          ) {
            wsRef.current.send(JSON.stringify({ type: 'read', message_id: msg.id }))
          }
          observer.current.unobserve(entry.target)
        }
      })
    }, { threshold: 0.5 })

    const onVisChange = () => {
      if (document.visibilityState === 'visible') {
        Object.values(messageEls.current).forEach(el => observer.current.observe(el))
      }
    }
    document.addEventListener('visibilitychange', onVisChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisChange)
      observer.current.disconnect()
    }
  }, [messages, readReceipts, user])

  // 3️⃣ Observe *new* bubbles & auto-scroll
  useEffect(() => {
    // auto-scroll
    autoScrolling.current = true
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => { autoScrolling.current = false }, 300)

    // Only observe those not in initialMessageIds
    messages.forEach(m => {
      if (!initialMessageIds.current.has(m.id)) {
        const el = messageEls.current[m.id]
        if (el) observer.current.observe(el)
      }
    })
  }, [messages])

  // 4️⃣ Handlers
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

  function handleChange(e) {
    setText(e.target.value)
    wsRef.current?.send(JSON.stringify({ type: 'typing' }))
  }

  // 5️⃣ Render
  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <h2>Thread {id}</h2>
        <p className="chat-online">Online: {online.join(', ')}</p>
      </div>

      {loadError && <p className="error-msg">{loadError}</p>}
      {wsError && <p className="error-msg">{wsError}</p>}

      <div className="chat-box">
        {messages.map(m => {
          const seenBy = (readReceipts[m.id] || []).filter(u => u !== m.sender)
          return (
            <div
              key={m.id}
              ref={el => { if (el) messageEls.current[m.id] = el }}
              data-msg-id={m.id}
              className={`chat-bubble ${m.sender === user?.username ? 'own' : 'other'}`}
            >
              <strong>{m.sender}</strong>
              {m.structured
                ? <div className="structured-bubble"><pre>{JSON.stringify(m.structured, null, 2)}</pre></div>
                : <p>{m.content}</p>
              }
              {seenBy.length > 0 && (
                <div className="seen-indicator">
                  <em>Seen by {seenBy.join(', ')}</em>
                </div>
              )}
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="typing-indicator"><em>{typingUsers.join(', ')} typing...</em></div>
      )}

      <form onSubmit={sendMessage} className="chat-form">
        {structuredMode
          ? <>
              {Object.keys(structuredFields).map(key => (
                <input
                  key={key}
                  type="text"
                  placeholder={key}
                  value={structuredFields[key]}
                  onChange={e => setStructuredFields({
                    ...structuredFields,
                    [key]: e.target.value
                  })}
                  className="chat-input"
                />
              ))}
              <button type="submit" className="chat-send-btn">Send Structured</button>
              <button type="button" onClick={() => setStructuredMode(false)} className="chat-cancel-btn">Cancel</button>
            </>
          : <>
              <input
                value={text}
                onChange={handleChange}
                className="chat-input"
                placeholder="Type a message..."
              />
              <button type="submit" className="chat-send-btn">Send</button>
              <button
                type="button"
                className="chat-toggle-btn"
                onClick={() => {
                  setStructuredFields({ device_id: "", start_time: "", end_time: "" })
                  setStructuredMode(true)
                }}
              >
                + Structured
              </button>
            </>
        }
      </form>
    </div>
  )
}
