import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMessages } from '../api'

export default function Chat() {
  const { id } = useParams()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
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

  return (
    <div>
      <h2>Thread {id}</h2>
      <ul>
        {messages.map(m => (
          <li key={m.id}>{m.sender}: {m.content}</li>
        ))}
      </ul>
      <form onSubmit={sendMessage}>
        <input value={text} onChange={e => setText(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
