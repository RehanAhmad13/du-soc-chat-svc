import React, { useState, useEffect } from 'react';

const TenantConfigDialog = ({ open, onClose, tenant, onSave }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({});
  const [billing, setBilling] = useState({});
  const [theme, setTheme] = useState({});
  const [integrations, setIntegrations] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && tenant) {
      fetchTenantData();
    }
  }, [open, tenant]);

  const fetchTenantData = async () => {
    setLoading(true);
    try {
      // For now, show placeholder data
      setConfig({
        default_sla_hours: 24,
        enable_auto_escalation: true,
        enable_file_attachments: true,
        enable_push_notifications: true
      });
      setBilling({
        plan_type: 'basic',
        status: 'active',
        monthly_cost: 99.00
      });
      setTheme({
        primary_color: '#1976d2',
        company_name: tenant?.name || ''
      });
      setIntegrations([]);
    } catch (error) {
      console.error('Failed to fetch tenant data:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave();
    } catch (error) {
      console.error('Failed to save:', error);
    }
    setLoading(false);
  };

  const tabs = [
    { label: 'Configuration', id: 'config' },
    { label: 'Billing', id: 'billing' },
    { label: 'Theme', id: 'theme' },
    { label: 'Integrations', id: 'integrations' }
  ];

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tenant Configuration - {tenant?.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {errors.detail && (
            <div className="alert alert-error">
              {errors.detail}
            </div>
          )}

          {activeTab === 0 && ( // Configuration
            <div className="config-section">
              <h3>SLA Configuration</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Default SLA (hours)</label>
                  <input
                    type="number"
                    value={config.default_sla_hours || ''}
                    onChange={(e) => setConfig({ ...config, default_sla_hours: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.enable_auto_escalation || false}
                      onChange={(e) => setConfig({ ...config, enable_auto_escalation: e.target.checked })}
                    />
                    Enable Auto Escalation
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.enable_file_attachments || false}
                      onChange={(e) => setConfig({ ...config, enable_file_attachments: e.target.checked })}
                    />
                    Enable File Attachments
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.enable_push_notifications || false}
                      onChange={(e) => setConfig({ ...config, enable_push_notifications: e.target.checked })}
                    />
                    Enable Push Notifications
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && ( // Billing
            <div className="billing-section">
              <h3>Subscription Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Plan Type</label>
                  <select
                    value={billing.plan_type || ''}
                    onChange={(e) => setBilling({ ...billing, plan_type: e.target.value })}
                  >
                    <option value="basic">Basic Plan</option>
                    <option value="professional">Professional Plan</option>
                    <option value="enterprise">Enterprise Plan</option>
                    <option value="custom">Custom Plan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={billing.status || ''}
                    onChange={(e) => setBilling({ ...billing, status: e.target.value })}
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Monthly Cost ($)</label>
                  <input
                    type="number"
                    value={billing.monthly_cost || ''}
                    onChange={(e) => setBilling({ ...billing, monthly_cost: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && ( // Theme
            <div className="theme-section">
              <h3>Branding</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={theme.company_name || ''}
                    onChange={(e) => setTheme({ ...theme, company_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Primary Color</label>
                  <input
                    type="color"
                    value={theme.primary_color || '#1976d2'}
                    onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 3 && ( // Integrations
            <div className="integrations-section">
              <h3>Integrations</h3>
              <p>Integration management coming soon...</p>
              <div className="integration-placeholder">
                <div className="integration-item">
                  <span>ITSM Integration</span>
                  <span className="status">Disabled</span>
                </div>
                <div className="integration-item">
                  <span>Event Bus</span>
                  <span className="status">Enabled</span>
                </div>
                <div className="integration-item">
                  <span>Push Notifications</span>
                  <span className="status">Enabled</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-tabs {
          display: flex;
          border-bottom: 1px solid #eee;
        }

        .tab {
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab.active {
          border-bottom-color: #1976d2;
          color: #1976d2;
          font-weight: 500;
        }

        .modal-body {
          padding: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 4px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .alert-error {
          background-color: #ffebee;
          color: #c62828;
          border: 1px solid #ef5350;
        }

        .integration-placeholder {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .integration-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  );
};

export default TenantConfigDialog;