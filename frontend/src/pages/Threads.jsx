import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getThreads } from '../api'
import { useAuth } from '../AuthContext'

export default function Threads() {
  const [threads, setThreads] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { token } = useAuth()

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    getThreads(token)
      .then(setThreads)
      .catch(() => setError('Failed to load threads'))
  }, [token, navigate])

  return (
    <div className="container mt-4">
      <h2>Chat Threads</h2>
      {error && <p className="text-danger">{error}</p>}
      <ul className="list-group" aria-live="polite">
        {threads.map(t => (
          <li key={t.id} className="list-group-item">
            <Link className="text-decoration-none" to={`/chat/${t.id}`}>{t.incident_id}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
