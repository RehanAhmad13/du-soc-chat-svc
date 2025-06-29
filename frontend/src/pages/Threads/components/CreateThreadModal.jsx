import React, { useState } from 'react';

export default function CreateThreadModal({ templates, onClose, onCreate, token }) {
  const [formData, setFormData] = useState({
    incident_id: '',
    template_id: '',
    priority: 'medium',
    description: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'template_id') {
      const template = templates.find(t => t.id.toString() === value);
      setSelectedTemplate(template);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.incident_id.trim()) {
      setError('Incident ID is required');
      return;
    }

    if (!formData.template_id) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const metadata = {
        priority: formData.priority,
        description: formData.description
      };

      const response = await fetch(
        `/api/tenant/threads/from-incident/${encodeURIComponent(formData.incident_id)}/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            metadata,
            template: formData.template_id
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create thread');
      }

      const newThread = await response.json();
      onCreate(newThread);
    } catch (err) {
      console.error('Thread creation failed:', err);
      setError(err.message || 'Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#22c55e'
    };
    return colors[priority] || '#6b7280';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-thread-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Create New Thread</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-thread-form">
            {/* Incident ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="incident_id">
                Incident ID *
              </label>
              <input
                id="incident_id"
                type="text"
                value={formData.incident_id}
                onChange={(e) => handleInputChange('incident_id', e.target.value)}
                placeholder="e.g., INC-2024-001"
                className="form-input"
                required
              />
              <span className="form-hint">
                Enter a unique identifier for this incident
              </span>
            </div>

            {/* Template Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="template_id">
                Template *
              </label>
              <select
                id="template_id"
                value={formData.template_id}
                onChange={(e) => handleInputChange('template_id', e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                Choose a template that best fits this incident type
              </span>
            </div>

            {/* Template Preview */}
            {selectedTemplate && (
              <div className="template-preview">
                <h4 className="preview-title">Template Preview</h4>
                <div className="preview-content">
                  <div className="template-info">
                    <strong>{selectedTemplate.name}</strong>
                    <p className="template-text">{selectedTemplate.text}</p>
                  </div>
                  
                  {selectedTemplate.schema && Object.keys(selectedTemplate.schema).length > 0 && (
                    <div className="template-fields">
                      <span className="fields-label">Required fields:</span>
                      <div className="field-tags">
                        {Object.keys(selectedTemplate.schema).map(field => (
                          <span key={field} className="field-tag">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Priority */}
            <div className="form-group">
              <label className="form-label" htmlFor="priority">
                Priority
              </label>
              <div className="priority-selector">
                {['low', 'medium', 'high', 'critical'].map(priority => (
                  <label key={priority} className="priority-option">
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="priority-radio"
                    />
                    <span 
                      className="priority-label"
                      style={{ borderColor: getPriorityColor(priority) }}
                    >
                      <div 
                        className="priority-dot"
                        style={{ backgroundColor: getPriorityColor(priority) }}
                      ></div>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Initial Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide initial details about this incident..."
                className="form-textarea"
                rows="4"
              />
              <span className="form-hint">
                Optional: Add any initial context or details
              </span>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !formData.incident_id.trim() || !formData.template_id}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Creating...
              </>
            ) : (
              'Create Thread'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}