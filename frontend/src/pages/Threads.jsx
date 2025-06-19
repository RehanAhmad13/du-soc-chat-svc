import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getThreads, getTemplates } from '../api'
import { useAuth } from '../AuthContext'
import "./AppFeatures.css"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import TemplateModal from "../components/TemplateModal"
import NewTemplateModal from "../components/NewTemplateModal"

dayjs.extend(relativeTime)

const SLA_HOURS = 24

export default function Threads() {
  const [threads, setThreads] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [incidentId, setIncidentId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { token, isAdmin } = useAuth()

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    getThreads(token)
      .then(setThreads)
      .catch(() => setError('Failed to load threads'))

    getTemplates(token)
      .then(setTemplates)
      .catch((e) => console.warn('Template load error:', e))
  }, [token, navigate])

  function createThread() {
    if (!incidentId.trim()) {
      return alert('Please enter an Incident ID.')
    }

    const tmpl = templates.find(t => String(t.id) === selectedTemplateId)
    if (!tmpl) return alert('Please select a valid template.')

    if (!tmpl.schema || Object.keys(tmpl.schema).length === 0) {
      return alert('This template does not define any fields. Please edit the template first.')
    }

    setSelectedTemplate(tmpl)
    setShowModal(true)
  }

  async function handleSubmitMetadata(metadata) {
    try {
      const res = await fetch(
        `/api/chat/threads/from-incident/${encodeURIComponent(incidentId)}/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            metadata,
            template: selectedTemplateId
          })
        }
      )
      if (!res.ok) throw new Error()
      const thread = await res.json()
      setThreads(t => [...t, thread])
      setIncidentId('')
      setSelectedTemplateId('')
      setShowModal(false)
    } catch (e) {
      console.error('[ERROR] Thread creation failed:', e)
      alert('Failed to create thread.')
    }
  }

  function getTimeRemaining(createdAt) {
    const deadline = dayjs(createdAt).add(SLA_HOURS, 'hour')
    const now = dayjs()
    const diff = deadline.diff(now)

    if (diff <= 0) return '⏱ SLA Breached'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff / (1000 * 60)) % 60)

    return `${hours}h ${minutes}m left`
  }

  return (
    <div className="feature-wrapper">
      <h1 className="feature-heading">Chat Threads</h1>
      <p className="feature-subtitle">
        Start a new incident thread or pick an existing one below.
      </p>

      {!isAdmin && (
        <div className="feature-card mb-5 p-4">
          <h2 className="create-heading">Create a New Thread</h2>

          <div className="mb-3">
            <input
              className="form-control"
              placeholder="Incident ID"
              value={incidentId}
              onChange={e => setIncidentId(e.target.value)}
            />
          </div>

          <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 mb-3">
            <label className="text-white mb-0 me-md-2">Template:</label>
            <select
              className="form-select flex-fill"
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
            >
              <option value="">— Select a template —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center">
            <button onClick={createThread} className="btn btn-success px-4">
              Create
            </button>
          </div>
        </div>
      )}

      {showModal && selectedTemplate && (
        <TemplateModal
          show={showModal}
          template={selectedTemplate}
          onSubmit={handleSubmitMetadata}
          onClose={() => setShowModal(false)}
        />
      )}

      {showNewTemplateModal && (
        <NewTemplateModal
          show={showNewTemplateModal}
          onClose={() => setShowNewTemplateModal(false)}
          onCreate={(newTpl) => setTemplates(prev => [...prev, newTpl])}
          token={token}
        />
      )}

      {error && <p className="alert error mt-3">{error}</p>}

      <div className="section-card mt-4">
        <div className="card-header">Your Threads</div>
        <div className="feature-grid card-body">
          {threads.length > 0 ? (
            threads.map(t => {
              const created = dayjs(t.created_at)
              return (
                <Link
                  key={t.id}
                  to={`/chat/${t.id}`}
                  className="feature-card text-decoration-none"
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-primary">
                      {t.template?.name || 'Unnamed Template'}
                    </span>
                    <span className="badge incident-id-badge">
                      Incident #{t.incident_id}
                    </span>
                  </div>

                  <div className="sla-alert mb-2 text-center">
                    {t.sla_status === 'breached' ? (
                      <span className="badge bg-danger">
                        ⚠ SLA Breached – Response overdue
                      </span>
                    ) : (
                      <span className="badge bg-success">
                        Within SLA
                      </span>
                    )}
                    <div className="sla-timer mt-1 text-light small">
                      {getTimeRemaining(t.created_at)}
                    </div>
                  </div>

                  <div className="feature-description text-center fst-italic">
                    {t.messages.length
                      ? `Last: ${t.messages[t.messages.length - 1].content}`
                      : 'No messages yet.'}
                  </div>
                  <div className="thread-footer text-center text-white">
                    <div>Created: {created.format('DD/MM/YYYY')}</div>
                    <div className="timeago">
                      <i className="fas fa-clock me-1"></i>{created.fromNow()}
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="no-data" style={{ gridColumn: '1 / -1' }}>
              No threads yet. Pick an incident ID, choose a template, and hit Create Thread.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
