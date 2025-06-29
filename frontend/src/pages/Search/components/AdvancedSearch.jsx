import React, { useState } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import './AdvancedSearch.css';

export default function AdvancedSearch({
  filters,
  templates,
  onSearch,
  onClose
}) {
  const [advancedFilters, setAdvancedFilters] = useState({
    search: filters.search || '',
    incident_id: filters.incident_id || '',
    status: filters.status || 'all',
    priority: filters.priority || 'all',
    template: filters.template || 'all',
    tags: filters.tags || '',
    message_content: filters.message_content || '',
    created_by: filters.created_by || '',
    assignee: filters.assignee || 'all',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    attachments: filters.attachments || false,
    my_threads: filters.my_threads || false
  });

  const handleChange = (field, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(advancedFilters);
  };

  const handleReset = () => {
    setAdvancedFilters({
      search: '',
      incident_id: '',
      status: 'all',
      priority: 'all',
      template: 'all',
      tags: '',
      message_content: '',
      created_by: '',
      assignee: 'all',
      date_from: '',
      date_to: '',
      attachments: false,
      my_threads: false
    });
  };

  return (
    <div className="modal-overlay">
      <div className="advanced-search-modal">
        <div className="modal-header">
          <div className="modal-title">
            <FiSearch size={20} />
            <h2>Advanced Search</h2>
          </div>
          <button
            className="close-btn"
            onClick={onClose}
            type="button"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="advanced-search-form">
          <div className="form-section">
            <h3>Basic Search</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Keyword Search</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search in titles, descriptions, messages..."
                  value={advancedFilters.search}
                  onChange={(e) => handleChange('search', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Incident ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., INC-2024-001"
                  value={advancedFilters.incident_id}
                  onChange={(e) => handleChange('incident_id', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Filters</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={advancedFilters.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={advancedFilters.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Template</label>
                <select
                  className="form-select"
                  value={advancedFilters.template}
                  onChange={(e) => handleChange('template', e.target.value)}
                >
                  <option value="all">All Templates</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Content Search</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tags</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="security, network, malware (comma-separated)"
                  value={advancedFilters.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Message Content</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search within messages..."
                  value={advancedFilters.message_content}
                  onChange={(e) => handleChange('message_content', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>People & Assignment</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Created By</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Username who created the thread"
                  value={advancedFilters.created_by}
                  onChange={(e) => handleChange('created_by', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select
                  className="form-select"
                  value={advancedFilters.assignee}
                  onChange={(e) => handleChange('assignee', e.target.value)}
                >
                  <option value="all">All Assignees</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="me">Assigned to Me</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Date Range</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={advancedFilters.date_from}
                  onChange={(e) => handleChange('date_from', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={advancedFilters.date_to}
                  onChange={(e) => handleChange('date_to', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Options</h3>
            <div className="form-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={advancedFilters.attachments}
                  onChange={(e) => handleChange('attachments', e.target.checked)}
                />
                <span className="checkbox-text">Has attachments</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={advancedFilters.my_threads}
                  onChange={(e) => handleChange('my_threads', e.target.checked)}
                />
                <span className="checkbox-text">My threads only</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <FiSearch size={16} />
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}