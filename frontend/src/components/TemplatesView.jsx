import React from 'react'

export default function TemplatesView({ templates, toggleTemplateExpand, onNew }) {
  const globalTemplates = templates.filter(t => !t.tenant_id)
  return (
    <div className="section-card templates-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>Global Templates</span>
        <button className="btn btn-outline-primary btn-sm" onClick={onNew}>
          + New Template
        </button>
      </div>
      <div className="card-body">
        {globalTemplates.length === 0 ? (
          <p className="no-data">No global templates yet.</p>
        ) : (
          globalTemplates.map((tpl, i) => (
            <div
              key={i}
              className={`template-item ${tpl.expanded ? 'expanded' : ''}`}
              onClick={() => toggleTemplateExpand(i)}
            >
              <div className="template-name">
                {tpl.name || 'Unnamed Template'}
              </div>
              {tpl.expanded && (
                <>
                  <div className="template-text">{tpl.text}</div>
                  <div className="template-schema">
                    Fields:
                    <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem' }}>
                      {Object.entries(tpl.schema || {}).map(([field, info]) => (
                        <li key={field}>
                          <strong>{field}</strong> ({info.type}
                          {info.options ? `: ${info.options.join(', ')}` : ''})
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
