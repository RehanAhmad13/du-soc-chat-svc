import { useState } from 'react'

export default function ThreadActions({ selectedCount, onBulkAction }) {
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const handleBulkAssign = async (userId) => {
    await onBulkAction('assign', { user_id: userId })
    setShowAssignModal(false)
  }

  const handleBulkStatusChange = async (status) => {
    await onBulkAction('change_status', { status })
    setShowStatusModal(false)
  }

  const handleBulkExport = async (format) => {
    await onBulkAction('export', { format })
    setShowExportModal(false)
  }

  return (
    <div className="thread-actions">
      <div className="actions-header">
        <div className="selection-info">
          <span className="selection-count">{selectedCount} threads selected</span>
        </div>
        <div className="bulk-actions">
          {/* Assignment */}
          <div className="action-group">
            <button
              className="btn btn-outline"
              onClick={() => setShowAssignModal(true)}
            >
              <span className="btn-icon">👤</span>
              Assign
            </button>
            {showAssignModal && (
              <div className="action-dropdown active">
                <div className="dropdown-header">Assign to User</div>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkAssign(null)}
                >
                  🚫 Unassign All
                </button>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkAssign(1)}
                >
                  👤 Amina
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkAssign(2)}
                >
                  👤 Khadija
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkAssign(3)}
                >
                  👤 Sara
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkAssign(4)}
                >
                  👤 Omar
                </button>
                <div className="dropdown-footer">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Change */}
          <div className="action-group">
            <button
              className="btn btn-outline"
              onClick={() => setShowStatusModal(true)}
            >
              <span className="btn-icon">🏷️</span>
              Change Status
            </button>
            {showStatusModal && (
              <div className="action-dropdown active">
                <div className="dropdown-header">Change Status</div>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkStatusChange('open')}
                >
                  📂 Open
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkStatusChange('in_progress')}
                >
                  ▶ In Progress
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkStatusChange('waiting')}
                >
                  ⏸ Waiting
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkStatusChange('resolved')}
                >
                  ✓ Resolved
                </button>
                <div className="dropdown-footer">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowStatusModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="action-group">
            <button
              className="btn btn-outline"
              onClick={() => setShowExportModal(true)}
            >
              <span className="btn-icon">📤</span>
              Export
            </button>
            {showExportModal && (
              <div className="action-dropdown active">
                <div className="dropdown-header">Export Format</div>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkExport('csv')}
                >
                  ⬇ CSV File
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkExport('json')}
                >
                  📄 JSON File
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkExport('pdf')}
                >
                  📕 PDF Report
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleBulkExport('excel')}
                >
                  📗 Excel File
                </button>
                <div className="dropdown-divider"></div>
                <div className="export-options">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    Include messages
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    Include metadata
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    Include attachments
                  </label>
                </div>
                <div className="dropdown-footer">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowExportModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="action-group">
            <button className="btn btn-outline">
              <span className="btn-icon">🔥</span>
              Priority
            </button>
          </div>

          {/* More Actions */}
          <div className="action-group">
            <button className="btn btn-outline">
              <span className="btn-icon">⚠</span>
              Escalate
            </button>
          </div>

          {/* Dangerous Actions */}
          <div className="action-group danger-group">
            <button 
              className="btn btn-warning"
              onClick={() => {
                if (confirm(`Archive ${selectedCount} threads? This action can be undone.`)) {
                  onBulkAction('archive')
                }
              }}
            >
              <span className="btn-icon">📦</span>
              Archive
            </button>
            
            <button 
              className="btn btn-danger"
              onClick={() => {
                if (confirm(`Delete ${selectedCount} threads? This action cannot be undone!`)) {
                  onBulkAction('delete')
                }
              }}
            >
              <span className="btn-icon">🗑️</span>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar for Bulk Operations */}
      <div className="bulk-progress" style={{ display: 'none' }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '60%' }}></div>
        </div>
        <div className="progress-text">
          Processing 15 of 25 threads...
        </div>
        <button className="btn btn-sm btn-secondary">Cancel</button>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="quick-action-item">
          <span className="quick-label">Quick Actions:</span>
        </div>
        <button 
          className="quick-action-btn"
          onClick={() => onBulkAction('mark_urgent')}
        >
          ⚠ Mark Urgent
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => onBulkAction('add_to_watchlist')}
        >
          👁️ Add to Watchlist
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => onBulkAction('send_notification')}
        >
          📧 Send Notification
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => onBulkAction('create_report')}
        >
          📋 Create Report
        </button>
      </div>

      {/* Selection Statistics */}
      <div className="selection-stats">
        <div className="stat-item">
          <span className="stat-label">Selected Threads:</span>
          <span className="stat-value">{selectedCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">High Priority:</span>
          <span className="stat-value stat-danger">5</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">SLA Breached:</span>
          <span className="stat-value stat-warning">2</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Unassigned:</span>
          <span className="stat-value stat-info">8</span>
        </div>
      </div>

      {/* Overlay to close dropdowns */}
      {(showAssignModal || showStatusModal || showExportModal) && (
        <div 
          className="dropdown-overlay"
          onClick={() => {
            setShowAssignModal(false)
            setShowStatusModal(false)
            setShowExportModal(false)
          }}
        />
      )}
    </div>
  )
}