import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../AuthContext';
import { getTenantConfigurations, getTenantConfigurationOverview, suspendTenant, reactivateTenant } from '../../api';
import TenantConfigDialog from './TenantConfigDialog';
import './TenantManagement.css';

const TenantManagement = () => {
  const { token, isAdmin, userInfo } = useAuth();
  
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    billing_status: 'all',
    plan_type: 'all',
    search: ''
  });
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  const fetchTenants = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const data = await getTenantConfigurations(token, filters);
      const tenantData = data.results || data;
      
      // Ensure we always set an array
      setTenants(Array.isArray(tenantData) ? tenantData : []);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setError(`Failed to load tenants: ${error.message}`);
      setTenants([]); // Set empty array on error
    }
    setLoading(false);
  }, [token, filters]);

  const fetchOverview = useCallback(async () => {
    if (!token) return;
    
    try {
      const data = await getTenantConfigurationOverview(token);
      setOverview(data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
      setOverview(null); // Set null on error
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchTenants();
    fetchOverview();
  }, [filters, token, fetchTenants, fetchOverview]);

  const handleOpenDialog = (tenant = null) => {
    setSelectedTenant(tenant);
    setDialogOpen(true);
    setShowMenu(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTenant(null);
  };

  const handleSuspendTenant = async (tenant) => {
    if (!token) return;
    
    try {
      await suspendTenant(tenant.id, 'Admin action', token);
      fetchTenants();
      fetchOverview();
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
    }
    setShowMenu(null);
  };

  const handleReactivateTenant = async (tenant) => {
    if (!token) return;
    
    try {
      await reactivateTenant(tenant.id, token);
      fetchTenants();
      fetchOverview();
    } catch (error) {
      console.error('Failed to reactivate tenant:', error);
    }
    setShowMenu(null);
  };

  const getBillingStatusColor = (status) => {
    const colors = {
      active: '#4caf50',
      trial: '#ff9800',
      suspended: '#f44336',
      cancelled: '#9e9e9e'
    };
    return colors[status] || '#9e9e9e';
  };

  const getPlanTypeColor = (plan) => {
    const colors = {
      basic: '#2196f3',
      professional: '#9c27b0',
      enterprise: '#673ab7',
      custom: '#ff9800'
    };
    return colors[plan] || '#9e9e9e';
  };

  const OverviewCards = () => {
    if (!overview || !overview.summary) return null;

    const summary = overview.summary;
    
    return (
      <div className="overview-cards">
        <div className="overview-card">
          <h3>{summary.total_tenants || 0}</h3>
          <p>Total Tenants</p>
          <small>{summary.active_tenants || 0} active</small>
        </div>
        <div className="overview-card">
          <h3>{summary.total_users || 0}</h3>
          <p>Total Users</p>
        </div>
        <div className="overview-card">
          <h3>{summary.total_threads || 0}</h3>
          <p>Total Threads</p>
        </div>
        <div className="overview-card">
          <h3>${((summary.total_tenants || 0) * 99).toLocaleString()}</h3>
          <p>Revenue (Est.)</p>
        </div>
      </div>
    );
  };

  const FilterBar = () => (
    <div className="filter-section">
      <div className="filter-row">
        <div className="filter-item">
          <input
            type="text"
            placeholder="Search tenants..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="search-input"
          />
        </div>
        <div className="filter-item">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="filter-item">
          <select
            value={filters.billing_status}
            onChange={(e) => setFilters({ ...filters, billing_status: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Billing Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="filter-item">
          <select
            value={filters.plan_type}
            onChange={(e) => setFilters({ ...filters, plan_type: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Plans</option>
            <option value="basic">Basic</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="filter-item">
          <button
            className="btn btn-primary"
            onClick={() => handleOpenDialog()}
          >
            + Create Tenant
          </button>
        </div>
      </div>
    </div>
  );

  const TenantTable = () => (
    <div className="tenant-table">
      <table>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Status</th>
            <th>Plan</th>
            <th>Users</th>
            <th>Threads</th>
            <th>Billing</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                Loading...
              </td>
            </tr>
          ) : tenants.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                No tenants found
              </td>
            </tr>
          ) : (
            tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>
                  <div>
                    <strong>{tenant.name}</strong>
                    <br />
                    <small>{tenant.contact_email}</small>
                  </div>
                </td>
                <td>
                  <span 
                    className="status-chip"
                    style={{ 
                      backgroundColor: tenant.is_active ? '#4caf50' : '#9e9e9e',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {tenant.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {tenant.billing && (
                    <span 
                      className="status-chip"
                      style={{ 
                        backgroundColor: getPlanTypeColor(tenant.billing.plan_type),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem'
                      }}
                    >
                      {tenant.billing.plan_type}
                    </span>
                  )}
                </td>
                <td>
                  {tenant.current_user_count}/{tenant.max_users}
                </td>
                <td>
                  {tenant.current_thread_count}/{tenant.max_concurrent_threads}
                </td>
                <td>
                  {tenant.billing && (
                    <div className="billing-info">
                      <span 
                        className="status-chip"
                        style={{ 
                          backgroundColor: getBillingStatusColor(tenant.billing.status),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem'
                        }}
                      >
                        {tenant.billing.status}
                      </span>
                      <div className="billing-amount">
                        ${tenant.billing.calculated_monthly_cost}/mo
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div className="action-menu">
                    <button
                      className="btn btn-sm"
                      onClick={() => setShowMenu(showMenu === tenant.id ? null : tenant.id)}
                    >
                      ⋮
                    </button>
                    {showMenu === tenant.id && (
                      <div className="menu-dropdown">
                        <button onClick={() => handleOpenDialog(tenant)}>Configure</button>
                        {tenant.is_active ? (
                          <button onClick={() => handleSuspendTenant(tenant)}>Suspend</button>
                        ) : (
                          <button onClick={() => handleReactivateTenant(tenant)}>Reactivate</button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (!token) {
    return (
      <div className="tenant-management">
        <div className="error-message">
          <h3>Authentication Required</h3>
          <p>Please log in to access tenant management.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="tenant-management">
        <div className="error-message">
          <h3>Admin Access Required</h3>
          <p>You need admin privileges to access tenant management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-management">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Tenant Management</h1>
        <p>Manage tenant organizations, billing, and configurations</p>
      </div>

      {error && (
        <div className="error-message" style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}

      <OverviewCards />
      <FilterBar />
      <TenantTable />

      {dialogOpen && (
        <TenantConfigDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          tenant={selectedTenant}
          onSave={() => {
            fetchTenants();
            fetchOverview();
            handleCloseDialog();
          }}
        />
      )}
    </div>
  );
};

export default TenantManagement;