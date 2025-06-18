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
    <div>
      <h2>Chat Threads</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {threads.map(t => (
          <li key={t.id}>
            <Link to={`/chat/${t.id}`}>{t.incident_id}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
