import React, { useState } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import './CreateIncidentModal.css';

export default function CreateIncidentModal({ templates, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    template_id: '',
    assignee: '',
    tags: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Get selected template for dynamic form fields
  const selectedTemplate = templates.find(t => t.id === parseInt(formData.template_id));

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    // Validate template fields if template is selected
    if (selectedTemplate && selectedTemplate.schema) {
      Object.entries(selectedTemplate.schema).forEach(([fieldKey, fieldConfig]) => {
        if (fieldConfig.required) {
          const value = formData[`template_${fieldKey}`];
          if (!value || !value.trim()) {
            newErrors[`template_${fieldKey}`] = `${fieldConfig.title || fieldKey} is required`;
          }
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Collect template field data
      const templateFields = {};
      if (selectedTemplate && selectedTemplate.schema) {
        Object.keys(selectedTemplate.schema).forEach(fieldKey => {
          const value = formData[`template_${fieldKey}`];
          if (value) {
            templateFields[fieldKey] = value;
          }
        });
      }

      const incidentData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        templateFields // Include template field data for metadata
      };
      
      await onCreate(incidentData);
    } catch (error) {
      console.error('Error creating incident:', error);
      setErrors({ submit: 'Failed to create incident. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#22c55e'
    };
    return colors[priority] || '#94a3b8';
  };

  return (
    <div className="modal-overlay">
      <div className="create-incident-modal">
        <div className="modal-header">
          <div className="modal-title">
            <FiAlertCircle size={20} />
            <h2>Create New Incident</h2>
          </div>
          <button
            className="close-btn"
            onClick={onClose}
            type="button"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Incident Title *
            </label>
            <input
              id="title"
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Brief description of the incident"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={200}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Detailed Description *
            </label>
            <textarea
              id="description"
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Provide detailed information about the incident..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              maxLength={1000}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                Priority *
              </label>
              <select
                id="priority"
                className={`form-select ${errors.priority ? 'error' : ''}`}
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
              {errors.priority && <span className="error-text">{errors.priority}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="template" className="form-label">
                Template
              </label>
              <select
                id="template"
                className="form-select"
                value={formData.template_id}
                onChange={(e) => handleChange('template_id', e.target.value)}
              >
                <option value="">No template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="template-info">
                  <small className="template-description">
                    {selectedTemplate.text}
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Template-specific fields */}
          {selectedTemplate && selectedTemplate.schema && (
            <div className="template-fields">
              <h4 className="template-fields-title">Template Fields</h4>
              {Object.entries(selectedTemplate.schema).map(([fieldKey, fieldConfig]) => (
                <div key={fieldKey} className="form-group">
                  <label htmlFor={`template_${fieldKey}`} className="form-label">
                    {fieldConfig.title || fieldKey}
                    {fieldConfig.required && ' *'}
                  </label>
                  {fieldConfig.type === 'dropdown' ? (
                    <select
                      id={`template_${fieldKey}`}
                      className={`form-select ${errors[`template_${fieldKey}`] ? 'error' : ''}`}
                      value={formData[`template_${fieldKey}`] || ''}
                      onChange={(e) => handleChange(`template_${fieldKey}`, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {(fieldConfig.enum || fieldConfig.options)?.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`template_${fieldKey}`}
                      type="text"
                      className={`form-input ${errors[`template_${fieldKey}`] ? 'error' : ''}`}
                      placeholder={fieldConfig.description || `Enter ${fieldConfig.title || fieldKey}`}
                      value={formData[`template_${fieldKey}`] || ''}
                      onChange={(e) => handleChange(`template_${fieldKey}`, e.target.value)}
                    />
                  )}
                  {errors[`template_${fieldKey}`] && (
                    <span className="error-text">{errors[`template_${fieldKey}`]}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="tags" className="form-label">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              className="form-input"
              placeholder="Enter tags separated by commas (e.g., security, network, malware)"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
            />
            <span className="form-hint">
              Separate multiple tags with commas
            </span>
          </div>

          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Incident'}
            </button>
          </div>
        </form>

        {/* Priority Preview */}
        <div className="priority-preview">
          <span className="preview-label">Priority:</span>
          <div 
            className="priority-indicator"
            style={{ color: getPriorityColor(formData.priority) }}
          >
            {formData.priority === 'critical' && '🔴'}
            {formData.priority === 'high' && '🟠'}
            {formData.priority === 'medium' && '🟡'}
            {formData.priority === 'low' && '🟢'}
            <span className="priority-text">{formData.priority}</span>
          </div>
        </div>
      </div>
    </div>
  );
}