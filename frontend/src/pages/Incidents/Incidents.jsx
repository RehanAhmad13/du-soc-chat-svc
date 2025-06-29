import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getThreads, getTemplates, createIncident } from '../../api';
import { ThreadCard, ThreadListRow, ThreadFilters } from '../../components/shared/ThreadComponents';
import IncidentsHeader from './components/IncidentsHeader';
import CreateIncidentModal from './components/CreateIncidentModal';
import IncidentActions from './components/IncidentActions';
import './Incidents.css';

export default function Incidents() {
  const navigate = useNavigate();
  const { token, userInfo, isAdmin } = useAuth();
  
  // State management
  const [threads, setThreads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedThreads, setSelectedThreads] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  
  // Filter and sort state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    sla_status: 'all',
    assignee: 'all',
    template: 'all',
    date_range: 'all',
    my_threads: false
  });
  
  const [sortBy, setSortBy] = useState('priority');
  const [sortDirection, setSortDirection] = useState('desc');

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [threadsData, templatesData] = await Promise.all([
        getThreads(token, {
          ...filters,
          sort_by: sortBy,
          sort_direction: sortDirection,
          page_size: 100,
          context: 'incidents' // Filter for active incidents
        }),
        getTemplates(token)
      ]);
      
      // Filter for active incidents (non-closed threads)
      const allThreads = Array.isArray(threadsData) ? threadsData : [];
      const activeThreads = allThreads.filter(
        thread => ['open', 'in_progress', 'pending'].includes(thread.status || 'open')
      );
      
      setThreads(activeThreads);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (err) {
      console.error('Error loading incidents:', err);
      setError('Failed to load incidents. Please try again.');
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
  const handleThreadClick = useCallback((thread) => {
    navigate(`/chat/${thread.id}`);
  }, [navigate]);

  const handleThreadSelect = useCallback((threadId, isSelected) => {
    setSelectedThreads(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(threadId);
      } else {
        newSet.delete(threadId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedThreads.size === threads.length) {
      setSelectedThreads(new Set());
    } else {
      setSelectedThreads(new Set(threads.map(t => t.id)));
    }
  }, [threads, selectedThreads]);

  const handleBulkAction = useCallback(async (action) => {
    if (selectedThreads.size === 0) return;
    
    console.log(`Performing bulk action: ${action} on threads:`, Array.from(selectedThreads));
    // TODO: Implement bulk actions
    
    // Refresh data after action
    await loadData();
    setSelectedThreads(new Set());
  }, [selectedThreads, loadData]);

  const handleCreateIncident = useCallback(async (incidentData) => {
    try {
      await createIncident(incidentData, token);
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      console.error('Error creating incident:', err);
      throw err;
    }
  }, [loadData, token]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((field, direction) => {
    setSortBy(field);
    setSortDirection(direction);
  }, []);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = threads.length;
    const critical = threads.filter(t => t.priority === 'critical').length;
    const slaBreached = threads.filter(t => t.sla_status === 'breached').length;
    const unread = threads.filter(t => t.unread_count > 0).length;
    const myThreads = threads.filter(t => 
      t.assignee?.id === userInfo?.id || 
      t.messages?.some(m => m.sender?.id === userInfo?.id)
    ).length;
    
    return { total, critical, slaBreached, unread, myThreads };
  }, [threads, userInfo]);

  // Render content
  const renderThreads = () => {
    if (loading) {
      return (
        <div className="incidents-loading">
          <div className="loading-spinner"></div>
          <span>Loading incidents...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="incidents-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="btn btn-primary" onClick={loadData}>
            Try Again
          </button>
        </div>
      );
    }

    if (threads.length === 0) {
      return (
        <div className="no-incidents">
          <div className="no-incidents-icon">🎯</div>
          <h3>No Active Incidents</h3>
          <p>All incidents are resolved or no incidents match your filters.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create New Incident
          </button>
        </div>
      );
    }

    if (viewMode === 'cards') {
      return (
        <div className="incidents-grid">
          {threads.map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isSelected={selectedThreads.has(thread.id)}
              onSelect={(selected) => handleThreadSelect(thread.id, selected)}
              onClick={() => handleThreadClick(thread)}
              context="incidents"
            />
          ))}
        </div>
      );
    }

    return (
      <div className="incidents-list">
        <div className="list-header">
          <div className="list-cell checkbox-cell">
            <input
              type="checkbox"
              checked={selectedThreads.size === threads.length && threads.length > 0}
              onChange={handleSelectAll}
              className="select-all-checkbox"
            />
          </div>
          <div className="list-cell">Incident</div>
          <div className="list-cell">Priority</div>
          <div className="list-cell">Status</div>
          <div className="list-cell">SLA</div>
          <div className="list-cell">Template</div>
          <div className="list-cell">Messages</div>
          <div className="list-cell">Last Activity</div>
          <div className="list-cell">Actions</div>
        </div>
        
        <div className="list-body">
          {threads.map(thread => (
            <ThreadListRow
              key={thread.id}
              thread={thread}
              isSelected={selectedThreads.has(thread.id)}
              onSelect={(selected) => handleThreadSelect(thread.id, selected)}
              onClick={() => handleThreadClick(thread)}
              context="incidents"
            />
          ))}
        </div>
      </div>
    );
  };

  if (!token) {
    return (
      <div className="incidents-unauthorized">
        <h2>Access Denied</h2>
        <p>Please log in to view incidents.</p>
      </div>
    );
  }

  return (
    <div className="incidents-page">
      <IncidentsHeader
        stats={stats}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedThreads.size}
        onCreateIncident={() => setShowCreateModal(true)}
        onRefresh={loadData}
        loading={loading}
      />

      <ThreadFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        templates={templates}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        context="incidents"
      />

      {selectedThreads.size > 0 && (
        <IncidentActions
          selectedCount={selectedThreads.size}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedThreads(new Set())}
        />
      )}

      <div className="incidents-content">
        {renderThreads()}
      </div>

      {showCreateModal && (
        <CreateIncidentModal
          templates={templates}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateIncident}
        />
      )}
    </div>
  );
}