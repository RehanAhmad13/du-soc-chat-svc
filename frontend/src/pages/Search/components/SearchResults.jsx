import React from 'react';
import { ThreadCard, ThreadListRow } from '../../../components/shared/ThreadComponents';
import './SearchResults.css';

export default function SearchResults({
  threads,
  loading,
  error,
  searchPerformed,
  viewMode,
  pagination,
  onThreadClick,
  onPageChange,
  onRetry
}) {
  
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (pagination.page > 1) {
      pages.push(
        <button
          key="prev"
          className="pagination-btn"
          onClick={() => onPageChange(pagination.page - 1)}
        >
          ‹ Previous
        </button>
      );
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className="pagination-btn"
          onClick={() => onPageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="dots1" className="pagination-dots">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${i === pagination.page ? 'active' : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pages.push(<span key="dots2" className="pagination-dots">...</span>);
      }
      pages.push(
        <button
          key={pagination.totalPages}
          className="pagination-btn"
          onClick={() => onPageChange(pagination.totalPages)}
        >
          {pagination.totalPages}
        </button>
      );
    }

    // Next button
    if (pagination.page < pagination.totalPages) {
      pages.push(
        <button
          key="next"
          className="pagination-btn"
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next ›
        </button>
      );
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
          {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
          {pagination.total.toLocaleString()} results
        </div>
        <div className="pagination-controls">
          {pages}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <span>Searching threads...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="search-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="btn btn-primary" onClick={onRetry}>
            Try Again
          </button>
        </div>
      );
    }

    if (!searchPerformed) {
      return (
        <div className="search-welcome">
          <div className="welcome-icon">🔍</div>
          <h3>Search All Threads</h3>
          <p>Find threads, incidents, messages, and more using the search above.</p>
          <div className="search-tips">
            <h4>Search Tips:</h4>
            <ul>
              <li>Use quotes for exact phrases: "network issue"</li>
              <li>Search by incident ID: #INC-2024-001</li>
              <li>Filter by tags: tag:security</li>
              <li>Use advanced search for complex queries</li>
            </ul>
          </div>
        </div>
      );
    }

    if (threads.length === 0) {
      return (
        <div className="no-results">
          <div className="no-results-icon">📭</div>
          <h3>No Results Found</h3>
          <p>No threads match your search criteria.</p>
          <div className="search-suggestions">
            <h4>Try:</h4>
            <ul>
              <li>Checking your spelling</li>
              <li>Using different keywords</li>
              <li>Removing some filters</li>
              <li>Using the advanced search</li>
            </ul>
          </div>
        </div>
      );
    }

    if (viewMode === 'cards') {
      return (
        <div className="search-results-grid">
          {threads.map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isSelected={false}
              onSelect={() => {}}
              onClick={() => onThreadClick(thread)}
              context="search"
            />
          ))}
        </div>
      );
    }

    return (
      <div className="search-results-list">
        <div className="list-header">
          <div className="list-cell">Incident</div>
          <div className="list-cell">Priority</div>
          <div className="list-cell">Status</div>
          <div className="list-cell">Template</div>
          <div className="list-cell">Messages</div>
          <div className="list-cell">Last Activity</div>
        </div>
        
        <div className="list-body">
          {threads.map(thread => (
            <ThreadListRow
              key={thread.id}
              thread={thread}
              isSelected={false}
              onSelect={() => {}}
              onClick={() => onThreadClick(thread)}
              context="search"
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="search-results">
      {renderContent()}
      {threads.length > 0 && renderPagination()}
    </div>
  );
}