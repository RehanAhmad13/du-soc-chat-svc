import { useState } from 'react'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')

  function sendMessage(e) {
    e.preventDefault()
    if (!text) return
    setMessages([...messages, { id: Date.now(), text }])
    setText('')
  }

  return (
    <div>
      <h2>Chat Room</h2>
      <ul>
        {messages.map(m => <li key={m.id}>{m.text}</li>)}
      </ul>
      <form onSubmit={sendMessage}>
        <input value={text} onChange={e => setText(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
