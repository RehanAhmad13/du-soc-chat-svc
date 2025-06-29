import { useState, useEffect } from 'react'

export default function TemplateModal({ show, onClose, onSubmit, template }) {
  const [metadata, setMetadata] = useState({})

  useEffect(() => {
    if (template?.schema) {
      const initial = {}
      Object.keys(template.schema).forEach(k => {
        initial[k] = ''
      })
      setMetadata(initial)
    }
  }, [template])

  if (!show) return null

  const handleChange = (field, value) => {
    setMetadata(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit(metadata)
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Fill Template Fields</h3>
        {Object.entries(template.schema || {}).map(([field, config]) => (
          <div key={field} className="mb-2">
            <label>{field}</label>
            {config.type === 'dropdown' ? (
              <select
                value={metadata[field]}
                onChange={e => handleChange(field, e.target.value)}
              >
                <option value="">Select...</option>
                {config.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={metadata[field]}
                onChange={e => handleChange(field, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="d-flex justify-content-end mt-3">
          <button onClick={onClose} className="btn btn-secondary me-2">Cancel</button>
          <button onClick={handleSubmit} className="btn btn-primary">Submit</button>
        </div>
      </div>
    </div>
  )
}
