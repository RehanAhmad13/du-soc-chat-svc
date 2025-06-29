import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getThreads, getTemplates } from '../../api';
import ThreadsHeader from './components/ThreadsHeader';
import ThreadsFilters from './components/ThreadsFilters';
import ThreadsStats from './components/ThreadsStats';
import ThreadView from './components/ThreadView';
import CreateThreadModal from './components/CreateThreadModal';
import TemplateModal from '../../components/TemplateModal';
import './Threads.css';

const VIEW_MODES = {
  CARDS: 'cards',
  LIST: 'list',
  KANBAN: 'kanban'
};

const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high', 
  MEDIUM: 'medium',
  LOW: 'low'
};

const SLA_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  BREACHED: 'breached'
};

export default function Threads() {
  const { token, userInfo, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Core state
  const [threads, setThreads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI state
  const [viewMode, setViewMode] = useState(VIEW_MODES.CARDS);
  const [selectedThreads, setSelectedThreads] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Filter and search state
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
  
  // Sort state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Fetch data on component mount
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    loadData();
  }, [token, navigate]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [threadsData, templatesData] = await Promise.all([
        getThreads(token),
        getTemplates(token)
      ]);
      
      setThreads(enhanceThreadsData(threadsData));
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load threads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Enhance threads data with computed properties
  const enhanceThreadsData = useCallback((threadsData) => {
    return threadsData.map(thread => ({
      ...thread,
      priority: determinePriority(thread),
      sla_status: calculateSLAStatus(thread),
      unread_count: thread.unread_count || 0,
      last_activity: getLastActivity(thread),
      assignee: getAssignee(thread),
      tags: generateTags(thread)
    }));
  }, []);

  // Helper functions for data enhancement
  const determinePriority = (thread) => {
    // Logic to determine priority based on template, SLA, etc.
    if (thread.template?.name?.toLowerCase().includes('critical')) {
      return PRIORITY_LEVELS.CRITICAL;
    }
    if (thread.sla_status === 'breached') {
      return PRIORITY_LEVELS.HIGH;
    }
    return PRIORITY_LEVELS.MEDIUM;
  };

  const calculateSLAStatus = (thread) => {
    if (thread.sla_status === 'breached') {
      return SLA_STATUS.BREACHED;
    }
    
    // Calculate time remaining
    const created = new Date(thread.created_at);
    const now = new Date();
    const hoursElapsed = (now - created) / (1000 * 60 * 60);
    const slaHours = 24; // Default SLA
    
    if (hoursElapsed > slaHours * 0.8) {
      return SLA_STATUS.WARNING;
    }
    
    return SLA_STATUS.HEALTHY;
  };

  const getLastActivity = (thread) => {
    if (thread.messages && thread.messages.length > 0) {
      return thread.messages[thread.messages.length - 1].created_at;
    }
    return thread.created_at;
  };

  const getAssignee = (thread) => {
    // Logic to determine assignee (could be from thread metadata or last responder)
    return null; // Placeholder
  };

  const generateTags = (thread) => {
    const tags = [];
    if (thread.unread_count > 0) tags.push('unread');
    if (thread.sla_status === 'breached') tags.push('sla-breach');
    if (thread.template) tags.push(thread.template.name.toLowerCase());
    return tags;
  };

  // Filter and sort threads
  const filteredAndSortedThreads = useMemo(() => {
    let filtered = [...threads];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(thread => 
        thread.incident_id.toLowerCase().includes(searchLower) ||
        thread.template?.name.toLowerCase().includes(searchLower) ||
        thread.tags.some(tag => tag.includes(searchLower))
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(thread => thread.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(thread => thread.priority === filters.priority);
    }

    if (filters.sla_status !== 'all') {
      filtered = filtered.filter(thread => thread.sla_status === filters.sla_status);
    }

    if (filters.template !== 'all') {
      filtered = filtered.filter(thread => 
        thread.template?.id.toString() === filters.template
      );
    }

    if (filters.my_threads && userInfo) {
      // Filter for threads where user is involved
      filtered = filtered.filter(thread => 
        thread.messages?.some(msg => msg.sender?.id === userInfo.user_id)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'last_activity') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [threads, filters, sortBy, sortDirection, userInfo]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = threads.length;
    const active = threads.filter(t => t.status !== 'closed').length;
    const breached = threads.filter(t => t.sla_status === SLA_STATUS.BREACHED).length;
    const unread = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0);
    const myThreads = threads.filter(t => 
      t.messages?.some(msg => msg.sender?.id === userInfo?.user_id)
    ).length;

    return { total, active, breached, unread, myThreads };
  }, [threads, userInfo]);

  // Event handlers
  const handleCreateThread = (threadData) => {
    // Logic to create thread
    setShowCreateModal(false);
    loadData(); // Reload data
  };

  const handleBulkAction = (action, threadIds) => {
    // Logic for bulk operations
    console.log('Bulk action:', action, threadIds);
  };

  const handleThreadClick = (thread) => {
    navigate(`/chat/${thread.id}`);
  };

  if (loading) {
    return (
      <div className="threads-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading threads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="threads-page">
      <ThreadsHeader
        stats={stats}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateClick={() => setShowCreateModal(true)}
        onRefresh={loadData}
        selectedThreads={selectedThreads}
        onBulkAction={handleBulkAction}
      />

      <ThreadsStats stats={stats} threads={threads} />

      <ThreadsFilters
        filters={filters}
        onFiltersChange={setFilters}
        templates={templates}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={(key, direction) => {
          setSortBy(key);
          setSortDirection(direction);
        }}
      />

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={loadData} className="error-retry">
            Retry
          </button>
        </div>
      )}

      <ThreadView
        threads={filteredAndSortedThreads}
        viewMode={viewMode}
        selectedThreads={selectedThreads}
        onSelectionChange={setSelectedThreads}
        onThreadClick={handleThreadClick}
        loading={loading}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateThreadModal
          templates={templates}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateThread}
          token={token}
        />
      )}

      {showTemplateModal && selectedTemplate && (
        <TemplateModal
          show={showTemplateModal}
          template={selectedTemplate}
          onSubmit={(metadata) => {
            // Handle template submission
            setShowTemplateModal(false);
          }}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
}