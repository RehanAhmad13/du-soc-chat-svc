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
      console.error(err)
      setError('Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="container mt-4" aria-label="Registration form">
      <h2>Register</h2>
      {message && <p>{message}</p>}
      {error && <p className="text-danger">{error}</p>}
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Username"
          aria-label="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <input
          type="password"
          className="form-control"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Invite Code"
          aria-label="Invite Code"
          value={invite}
          onChange={e => setInvite(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">Register</button>
    </form>
  )
}

