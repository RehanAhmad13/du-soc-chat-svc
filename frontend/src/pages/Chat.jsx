import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMessages } from '../api'

export default function Chat() {
  const { id } = useParams()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [online, setOnline] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const wsRef = useRef(null)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    getMessages(id, token).then(setMessages)
    const ws = new WebSocket(`/ws/chat/${id}/?token=${token}`)
    ws.onmessage = evt => {
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
    wsRef.current = ws
    return () => ws.close()
  }, [id, token, navigate])

  function sendMessage(e) {
    e.preventDefault()
    if (!text) return
    wsRef.current?.send(JSON.stringify({ type: 'message', content: text }))
    setText('')
  }

  function handleChange(e) {
    setText(e.target.value)
    wsRef.current?.send(JSON.stringify({ type: 'typing' }))
  }

  return (
    <div>
      <h2>Thread {id}</h2>
      <div>
        Online: {online.join(', ')}
      </div>
      <ul>
        {messages.map(m => (
          <li key={m.id}>{m.sender}: {m.content}</li>
        ))}
      </ul>
      <div>
        {typingUsers.length > 0 && (
          <em>{typingUsers.join(', ')} typing...</em>
        )}
      </div>
      <form onSubmit={sendMessage}>
        <input value={text} onChange={handleChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
