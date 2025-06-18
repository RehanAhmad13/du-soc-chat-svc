import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMessages } from '../api'
import { useAuth } from '../AuthContext'

export default function Chat() {
  const { id } = useParams()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [online, setOnline] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [loadError, setLoadError] = useState('')
  const [wsError, setWsError] = useState('')
  const wsRef = useRef(null)
  const navigate = useNavigate()
  const { token } = useAuth()

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    getMessages(id, token)
      .then(setMessages)
      .catch(() => setLoadError('Failed to load messages'))

    function connect(attempt = 0) {
      const scheme = location.protocol === 'https:' ? 'wss' : 'ws'
      const wsBase = import.meta.env.VITE_WS_BASE || `${scheme}://${location.host}/ws/chat`
      const socket = new WebSocket(`${wsBase}/${id}/?token=${token}`)
      wsRef.current = socket

      socket.onmessage = evt => {
        const msg = JSON.parse(evt.data)
        if (msg.type === 'message') {
          setMessages(m => [...m, { id: msg.id, content: msg.content, sender: msg.sender }])
        } else if (msg.type === 'presence') {
          setOnline(list => {
            const next = new Set(list)
            if (msg.online) {
              next.add(msg.user)
            } else {
              next.delete(msg.user)
            }
            return Array.from(next)
          })
        } else if (msg.type === 'typing') {
          setTypingUsers(list => {
            if (list.includes(msg.user)) return list
            const next = [...list, msg.user]
            setTimeout(() => {
              setTypingUsers(cur => cur.filter(u => u !== msg.user))
            }, 3000)
            return next
          })
        }
      }

      socket.onopen = () => setWsError('')
      socket.onerror = () => socket.close()
      socket.onclose = () => {
        if (attempt < 5) {
          const delay = Math.min(1000 * 2 ** attempt, 10000)
          setTimeout(() => connect(attempt + 1), delay)
        } else {
          setWsError('Connection lost. Please refresh to retry.')
        }
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [id, token, navigate])

  function sendMessage(e) {
    e.preventDefault()
    if (!text) return
    try {
      wsRef.current?.send(JSON.stringify({ type: 'message', content: text }))
      setText('')
    } catch {
      setWsError('Unable to send message. Reconnecting...')
      wsRef.current?.close()
    }
  }

  function handleChange(e) {
    setText(e.target.value)
    try {
      wsRef.current?.send(JSON.stringify({ type: 'typing' }))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="container mt-4">
      <h2>Thread {id}</h2>
      {loadError && <p className="text-danger">{loadError}</p>}
      {wsError && <p className="text-danger">{wsError}</p>}
      <div className="mb-2">Online: {online.join(', ')}</div>
      <ul className="list-group mb-3" aria-live="polite">
        {messages.map(m => (
          <li key={m.id} className="list-group-item">
            {m.sender}: {m.content}
          </li>
        ))}
      </ul>
      <div className="mb-2">
        {typingUsers.length > 0 && (
          <em>{typingUsers.join(', ')} typing...</em>
        )}
      </div>
      <form onSubmit={sendMessage} className="d-flex" aria-label="Send message">
        <input
          value={text}
          onChange={handleChange}
          className="form-control me-2"
          aria-label="Message text"
        />
        <button type="submit" className="btn btn-primary">Send</button>
      </form>
    </div>
  )
}
