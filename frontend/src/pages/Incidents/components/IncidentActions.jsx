import React, { useState } from 'react';
import { FiUser, FiFlag, FiCheck, FiX, FiMoreHorizontal } from 'react-icons/fi';
import './IncidentActions.css';

export default function IncidentActions({ selectedCount, onBulkAction, onClearSelection }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAction = (action) => {
    onBulkAction(action);
    setShowDropdown(false);
  };

  return (
    <div className="incident-actions">
      <div className="actions-bar">
        <div className="selection-info">
          <span className="selection-text">
            {selectedCount} incident{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <button
            className="clear-selection-btn"
            onClick={onClearSelection}
            title="Clear selection"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="bulk-actions">
          <button
            className="action-btn assign-btn"
            onClick={() => handleAction('assign')}
            title="Assign selected incidents"
          >
            <FiUser size={16} />
            Assign
          </button>

          <button
            className="action-btn priority-btn"
            onClick={() => handleAction('priority')}
            title="Change priority"
          >
            <FiFlag size={16} />
            Priority
          </button>

          <button
            className="action-btn resolve-btn"
            onClick={() => handleAction('resolve')}
            title="Mark as resolved"
          >
            <FiCheck size={16} />
            Resolve
          </button>

          <div className="dropdown-wrapper">
            <button
              className="action-btn more-btn"
              onClick={() => setShowDropdown(!showDropdown)}
              title="More actions"
            >
              <FiMoreHorizontal size={16} />
              More
            </button>

            {showDropdown && (
              <div className="actions-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => handleAction('escalate')}
                >
                  <FiFlag size={14} />
                  Escalate
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => handleAction('close')}
                >
                  <FiX size={14} />
                  Close
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => handleAction('archive')}
                >
                  📁 Archive
                </button>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item"
                  onClick={() => handleAction('export')}
                >
                  📤 Export
                </button>
                <button
                  className="dropdown-item danger"
                  onClick={() => handleAction('delete')}
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action confirmations could be added here */}
    </div>
  );
}