import React from 'react'

export default function TenantCard({ tenant, threads }) {
  return (
    <div className="tenant-card">
      <div className="tenant-header">{tenant.name}</div>
      <div className="tenant-body">
        <div className="subheading">Threads (open: {threads.length})</div>
        {threads.length === 0 ? (
          <p className="no-data">No threads yet.</p>
        ) : (
          <ul className="list">
            {threads.map(th => (
              <li key={th.id} style={{ marginBottom: '0.8rem' }}>
                <strong>INC:</strong> {th.incident_id}{' '}
                <em>(#{th.id})</em>
                <div style={{ marginTop: '0.3rem' }}>
                  <a
                    href={`/api/chat/export/thread/${th.id}/?format=json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-secondary"
                    style={{ marginRight: '0.5rem' }}
                  >
                    Export JSON
                  </a>
                  <a
                    href={`/api/chat/export/thread/${th.id}/?format=csv`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-secondary"
                  >
                    Export CSV
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="subheading">Users</div>
        {tenant.users && tenant.users.length ? (
          <ul className="list">
            {tenant.users.map(u => (
              <li key={u.id}>
                {u.username}{' '}
                <span className="text-muted">({u.email || '—'})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-data">No active users.</p>
        )}
      </div>
    </div>
  )
}
