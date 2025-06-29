import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../AuthContext';
import { getUsers, getUserActivity } from '../../api';
import OrganizationHeader from './components/OrganizationHeader';
import UsersList from './components/UsersList';
import UserDetails from './components/UserDetails';
import OrganizationStats from './components/OrganizationStats';
import './Organization.css';

export default function Organization() {
  const { token, userInfo, isAdmin } = useAuth();
  
  // State management
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showUserDetails, setShowUserDetails] = useState(false);
  
  // Filter and search state
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    department: 'all'
  });
  
  const [sortBy, setSortBy] = useState('last_login');
  const [sortDirection, setSortDirection] = useState('desc');

  // Load organization data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usersData = await getUsers(token, {
        ...filters,
        sort_by: sortBy,
        sort_direction: sortDirection,
        tenant_only: true // Only users from same tenant
      });
      
      // Handle both paginated and direct array responses
      const users = Array.isArray(usersData) ? usersData : usersData.results || [];
      setUsers(users);
    } catch (err) {
      console.error('Error loading organization data:', err);
      setError('Failed to load organization data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, filters, sortBy, sortDirection]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  // Event handlers
  const handleUserSelect = useCallback(async (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    
    // Load user activity data
    try {
      const activityData = await getUserActivity(token, user.id);
      setSelectedUser(prev => ({
        ...prev,
        activity: Array.isArray(activityData) ? activityData : activityData.results || []
      }));
    } catch (err) {
      console.error('Error loading user activity:', err);
    }
  }, [token]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((field, direction) => {
    setSortBy(field);
    setSortDirection(direction);
  }, []);

  // Calculate organization statistics
  const orgStats = React.useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const admins = users.filter(u => u.is_staff || u.role === 'admin').length;
    const online = users.filter(u => u.last_seen && 
      new Date() - new Date(u.last_seen) < 15 * 60 * 1000 // 15 minutes
    ).length;
    
    const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
    const roles = [...new Set(users.map(u => u.role || 'user').filter(Boolean))];
    
    return {
      total,
      active,
      admins,
      online,
      departments: departments.length,
      roles: roles.length,
      departmentList: departments,
      roleList: roles
    };
  }, [users]);

  // Filter and sort users
  const filteredUsers = React.useMemo(() => {
    let filtered = users;
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.first_name?.toLowerCase().includes(searchTerm) ||
        user.last_name?.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => {
        if (filters.role === 'admin') return user.is_staff || user.role === 'admin';
        if (filters.role === 'user') return !user.is_staff && user.role !== 'admin';
        return user.role === filters.role;
      });
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filtered = filtered.filter(user => user.is_active);
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(user => !user.is_active);
      }
    }
    
    // Apply department filter
    if (filters.department !== 'all') {
      filtered = filtered.filter(user => user.department === filters.department);
    }
    
    return filtered;
  }, [users, filters]);

  if (!token) {
    return (
      <div className="organization-unauthorized">
        <h2>Access Denied</h2>
        <p>Please log in to view organization information.</p>
      </div>
    );
  }

  return (
    <div className="organization-page">
      <OrganizationHeader
        tenantName={userInfo?.tenant_name}
        stats={orgStats}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadData}
        loading={loading}
      />

      <div className="organization-content">
        <div className="organization-main">
          <OrganizationStats
            stats={orgStats}
            users={filteredUsers}
          />

          <UsersList
            users={filteredUsers}
            loading={loading}
            error={error}
            viewMode={viewMode}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onUserSelect={handleUserSelect}
            onRetry={loadData}
            orgStats={orgStats}
          />
        </div>
      </div>

      {showUserDetails && selectedUser && (
        <UserDetails
          user={selectedUser}
          currentUser={userInfo}
          isAdmin={isAdmin}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}