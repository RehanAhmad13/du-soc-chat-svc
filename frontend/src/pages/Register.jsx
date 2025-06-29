import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    console.log('[Register] Submit triggered')

    setError('')
    try {
      console.log('[Register] Sending payload:', { username, password })

      const res = await fetch('/api/chat/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      console.log('[Register] Response status:', res.status, '→', data)

      if (!res.ok) {
        if (data.username && data.username[0]) {
          setError(`Username error: ${data.username[0]}`)
        } else if (data.detail) {
          setError(data.detail)
        } else {
          setError('Registration failed.')
        }
        return
      }

      setMessage(data.message || 'Registration successful!')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      console.error('[Register] Exception:', err)
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="container mt-5" style={{ maxWidth: '480px' }}>
      <h2 className="mb-4 text-center">Create Your Account</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} aria-label="Registration form">
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            className="form-control"
            placeholder="e.g. johndoe"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Register
        </button>

        <p className="text-center mt-3 mb-0">
          Already have an account? <a href="/login">Login</a>
        </p>
      </form>
    </div>
  )
}
