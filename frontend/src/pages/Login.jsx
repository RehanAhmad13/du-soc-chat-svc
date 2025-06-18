import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login: setToken } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const token = await login(username, password)
      setToken(token)
      navigate('/threads')
    } catch (err) {
      console.error(err)
      setError('Invalid credentials')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="container mt-4" aria-label="Login form">
      <h2>Login</h2>
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
      <button type="submit" className="btn btn-primary">Login</button>
      <p className="mt-3">
        Don't have an account? <a href="/register">Register</a>
      </p>
    </form>
  )
}
