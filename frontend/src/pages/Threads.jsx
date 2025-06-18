import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getThreads } from '../api'

export default function Threads() {
  const [threads, setThreads] = useState([])
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    getThreads(token).then(setThreads).catch(() => setThreads([]))
  }, [token, navigate])

  return (
    <div>
      <h2>Chat Threads</h2>
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
