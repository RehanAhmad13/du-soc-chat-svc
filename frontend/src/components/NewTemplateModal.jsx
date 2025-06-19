import { useState } from 'react'

export default function NewTemplateModal({ show, onClose, onCreate, token }) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [schema, setSchema] = useState('{}')
  const [error, setError] = useState(null)

  if (!show) return null

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/chat/templates/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          text,
          schema: JSON.parse(schema),
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(JSON.stringify(err))
      }

      const data = await response.json()
      onCreate(data)
      onClose()
    } catch (err) {
      console.error('[NewTemplateModal] Creation failed:', err)
      setError('Invalid input or schema. Please fix and try again.')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Create New Template</h3>

        {error && <div className="alert error">{error}</div>}

        <label>Template Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Escalation Request" />

        <label>Template Text (use {`{placeholders}`} )</label>
        <textarea rows={3} value={text} onChange={e => setText(e.target.value)} />

        <label>Schema (JSON)</label>
        <textarea
          rows={5}
          value={schema}
          onChange={e => setSchema(e.target.value)}
          placeholder={`{ "device_id": { "type": "text" }, "severity": { "type": "dropdown", "options": ["Low", "High"] } }`}
        />

        <div className="d-flex justify-content-end mt-3">
          <button onClick={onClose} className="btn btn-secondary me-2">Cancel</button>
          <button onClick={handleCreate} className="btn btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}
