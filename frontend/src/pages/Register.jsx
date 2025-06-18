import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../api'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const data = await registerUser(username, password, invite)
      setMessage(data.message || 'Registration successful')
      setTimeout(() => navigate('/login'), 1000)
    } catch (err) {
      setError('Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      {message && <p>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <div>
        <input
          placeholder="Invite Code"
          value={invite}
          onChange={e => setInvite(e.target.value)}
        />
      </div>
      <button type="submit">Register</button>
    </form>
  )
}

