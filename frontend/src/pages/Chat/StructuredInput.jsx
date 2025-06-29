// src/components/StructuredInput.jsx
import React from 'react'

function formatFieldLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function StructuredInput({ fields, setFields, onCancel }) {
  return (
    <>
      <div className="structured-form-header">
        <div className="structured-form-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="m19 9-5 5-4-4-3 3"/>
          </svg>
          Structured Data Form
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="close-btn"
          title="Close form"
        >
          ✕
        </button>
      </div>
      
      <div className="form-fields">
        {Object.keys(fields).map(key => (
          <div key={key} className="form-field">
            <label htmlFor={`field-${key}`}>
              {formatFieldLabel(key)}
            </label>
            <input
              id={`field-${key}`}
              type="text"
              placeholder={`Enter ${formatFieldLabel(key).toLowerCase()}...`}
              value={fields[key]}
              onChange={e => setFields({ ...fields, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="form-btn cancel"
        >
          Cancel
        </button>
        <button type="submit" className="form-btn submit">
          ➤ Send Form Data
        </button>
      </div>
    </>
  )
}