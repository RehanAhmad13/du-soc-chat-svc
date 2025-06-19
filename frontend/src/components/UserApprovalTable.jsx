import React from 'react'

export default function UserApprovalTable({ pendingUsers, tenants, selectedTenants, setSelectedTenants, approveUser }) {
  return (
    <div className="section-card">
      <div className="card-header">Pending User Approvals</div>
      <div className="card-body">
        {pendingUsers.length === 0 ? (
          <p className="no-data">No pending users.</p>
        ) : (
          <div className="table-responsive">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Current Tenant</th>
                  <th>Assign To</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email || '—'}</td>
                    <td>{user.tenant || '—'}</td>
                    <td>
                      <select
                        className="form-select"
                        value={selectedTenants[user.id] || ''}
                        onChange={e =>
                          setSelectedTenants(prev => ({
                            ...prev,
                            [user.id]: e.target.value
                          }))
                        }
                      >
                        <option value="">-- Select Tenant --</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="btn approve-btn" onClick={() => approveUser(user.id)}>
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
