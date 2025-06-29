import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getThreads, getTemplates } from '../../api';
import { ThreadCard, ThreadListRow, ThreadFilters } from '../../components/shared/ThreadComponents';
import SearchHeader from './components/SearchHeader';
import SearchResults from './components/SearchResults';
import SavedSearches from './components/SavedSearches';
import AdvancedSearch from './components/AdvancedSearch';
import './Search.css';

export default function Search() {
  const navigate = useNavigate();
  const { token, userInfo } = useAuth();
  
  // State management
  const [threads, setThreads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  
  // Search and filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    sla_status: 'all',
    assignee: 'all',
    template: 'all',
    date_range: 'all',
    my_threads: false,
    // Advanced search fields
    incident_id: '',
    tags: '',
    message_content: '',
    attachments: false,
    created_by: '',
    date_from: '',
    date_to: ''
  });
  
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  });

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await getTemplates(token);
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      } catch (err) {
        console.error('Error loading templates:', err);
      }
    };

    if (token) {
      loadTemplates();
      loadSavedSearches();
    }
  }, [token]);

  // Load saved searches
  const loadSavedSearches = () => {
    // TODO: Load from API or localStorage
    const saved = localStorage.getItem(`savedSearches_${userInfo?.id}`);
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  };

  // Perform search
  const performSearch = useCallback(async (searchFilters = filters, page = 1) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const threadsData = await getThreads(token, {
        ...searchFilters,
        sort_by: sortBy,
        sort_direction: sortDirection,
        page,
        page_size: pagination.pageSize,
        context: 'search'
      });
      
      // Handle both paginated and direct array responses
      const threads = Array.isArray(threadsData) ? threadsData : [];
      setThreads(threads);
      
      // For pagination, use default values since getThreads returns processed results
      setPagination({
        page: page || 1,
        pageSize: pagination.pageSize,
        total: threads.length,
        totalPages: Math.ceil(threads.length / pagination.pageSize)
      });
      setSearchPerformed(true);
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, sortBy, sortDirection, pagination.pageSize]);

  // Event handlers
  const handleSearch = useCallback((searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    performSearch(newFilters);
  }, [filters, performSearch]);

  const handleAdvancedSearch = useCallback((advancedFilters) => {
    const newFilters = { ...filters, ...advancedFilters };
    setFilters(newFilters);
    performSearch(newFilters);
    setShowAdvanced(false);
  }, [filters, performSearch]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    if (searchPerformed) {
      performSearch(newFilters);
    }
  }, [searchPerformed, performSearch]);

  const handleSortChange = useCallback((field, direction) => {
    setSortBy(field);
    setSortDirection(direction);
    if (searchPerformed) {
      performSearch(filters);
    }
  }, [searchPerformed, performSearch, filters]);

  const handlePageChange = useCallback((page) => {
    performSearch(filters, page);
  }, [performSearch, filters]);

  const handleThreadClick = useCallback((thread) => {
    navigate(`/chat/${thread.id}`);
  }, [navigate]);

  const handleSaveSearch = useCallback((name) => {
    const searchToSave = {
      id: Date.now(),
      name,
      filters: { ...filters },
      sortBy,
      sortDirection,
      createdAt: new Date().toISOString()
    };
    
    const newSavedSearches = [...savedSearches, searchToSave];
    setSavedSearches(newSavedSearches);
    localStorage.setItem(`savedSearches_${userInfo?.id}`, JSON.stringify(newSavedSearches));
  }, [filters, sortBy, sortDirection, savedSearches, userInfo]);

  const handleLoadSavedSearch = useCallback((savedSearch) => {
    setFilters(savedSearch.filters);
    setSortBy(savedSearch.sortBy);
    setSortDirection(savedSearch.sortDirection);
    performSearch(savedSearch.filters);
  }, [performSearch]);

  const handleDeleteSavedSearch = useCallback((searchId) => {
    const newSavedSearches = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(newSavedSearches);
    localStorage.setItem(`savedSearches_${userInfo?.id}`, JSON.stringify(newSavedSearches));
  }, [savedSearches, userInfo]);

  // Calculate search statistics
  const searchStats = React.useMemo(() => {
    return {
      total: pagination.total,
      pages: pagination.totalPages,
      currentPage: pagination.page,
      hasResults: threads.length > 0,
      resultText: pagination.total === 1 ? 'result' : 'results'
    };
  }, [pagination, threads]);

  if (!token) {
    return (
      <div className="search-unauthorized">
        <h2>Access Denied</h2>
        <p>Please log in to search threads.</p>
      </div>
    );
  }

  return (
    <div className="search-page">
      <SearchHeader
        onSearch={handleSearch}
        onAdvancedSearch={() => setShowAdvanced(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
        stats={searchStats}
        searchPerformed={searchPerformed}
        currentSearch={filters.search}
      />

      <div className="search-content">
        <div className="search-sidebar">
          <SavedSearches
            savedSearches={savedSearches}
            onLoad={handleLoadSavedSearch}
            onDelete={handleDeleteSavedSearch}
            onSave={() => {
              const name = prompt('Enter a name for this search:');
              if (name) handleSaveSearch(name);
            }}
            canSave={searchPerformed && Object.values(filters).some(v => v !== 'all' && v !== '' && v !== false)}
          />
        </div>

        <div className="search-main">
          <ThreadFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            templates={templates}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            context="search"
          />

          <SearchResults
            threads={threads}
            loading={loading}
            error={error}
            searchPerformed={searchPerformed}
            viewMode={viewMode}
            pagination={pagination}
            onThreadClick={handleThreadClick}
            onPageChange={handlePageChange}
            onRetry={() => performSearch(filters)}
          />
        </div>
      </div>

      {showAdvanced && (
        <AdvancedSearch
          filters={filters}
          templates={templates}
          onSearch={handleAdvancedSearch}
          onClose={() => setShowAdvanced(false)}
        />
      )}
    </div>
  );
}