import React, { useMemo } from 'react';

export default function ThreadsStats({ stats, threads }) {
  // Helper functions defined first
  const calculateAvgResponseTime = (threads) => {
    const responseTimes = threads
      .filter(t => t.messages && t.messages.length > 1)
      .map(t => {
        const created = new Date(t.created_at);
        const firstResponse = new Date(t.messages[1]?.created_at);
        return (firstResponse - created) / (1000 * 60 * 60); // hours
      });
    
    if (responseTimes.length === 0) return 0;
    
    const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(avg * 10) / 10; // Round to 1 decimal
  };

  const calculateResolutionRate = (threads) => {
    const closed = threads.filter(t => t.status === 'closed').length;
    return threads.length > 0 ? ((closed / threads.length) * 100).toFixed(1) : 0;
  };

  // Calculate additional metrics
  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    
    const todayThreads = threads.filter(t => 
      new Date(t.created_at) >= today
    ).length;
    
    const weekThreads = threads.filter(t => 
      new Date(t.created_at) >= thisWeek
    ).length;
    
    const avgResponseTime = calculateAvgResponseTime(threads);
    const resolutionRate = calculateResolutionRate(threads);
    
    // Priority distribution
    const priorities = threads.reduce((acc, thread) => {
      acc[thread.priority] = (acc[thread.priority] || 0) + 1;
      return acc;
    }, {});
    
    // SLA compliance
    const slaCompliance = threads.length > 0 
      ? ((threads.length - stats.breached) / threads.length * 100).toFixed(1)
      : 100;
    
    return {
      todayThreads,
      weekThreads,
      avgResponseTime,
      resolutionRate,
      priorities,
      slaCompliance
    };
  }, [threads, stats.breached]);

  return (
    <div className="threads-stats">
      {/* Main metrics cards */}
      <div className="stats-cards">
        <div className="stat-card primary">
          <div className="stat-header">
            <span className="stat-icon">📊</span>
            <span className="stat-title">Activity</span>
          </div>
          <div className="stat-content">
            <div className="stat-main">
              <span className="stat-number">{analytics.todayThreads}</span>
              <span className="stat-label">Today</span>
            </div>
            <div className="stat-secondary">
              <span className="stat-sub">{analytics.weekThreads} this week</span>
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <span className="stat-icon">⏱️</span>
            <span className="stat-title">Avg Response</span>
          </div>
          <div className="stat-content">
            <div className="stat-main">
              <span className="stat-number">{analytics.avgResponseTime}</span>
              <span className="stat-label">hours</span>
            </div>
            <div className="stat-secondary">
              <span className="stat-sub">First response time</span>
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <span className="stat-icon">🎯</span>
            <span className="stat-title">SLA Compliance</span>
          </div>
          <div className="stat-content">
            <div className="stat-main">
              <span className="stat-number">{analytics.slaCompliance}</span>
              <span className="stat-label">%</span>
            </div>
            <div className="stat-secondary">
              <span className="stat-sub">{stats.breached} breached</span>
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-header">
            <span className="stat-icon">✅</span>
            <span className="stat-title">Resolution Rate</span>
          </div>
          <div className="stat-content">
            <div className="stat-main">
              <span className="stat-number">{analytics.resolutionRate}</span>
              <span className="stat-label">%</span>
            </div>
            <div className="stat-secondary">
              <span className="stat-sub">Closed threads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority distribution */}
      <div className="priority-distribution">
        <h3 className="distribution-title">Priority Distribution</h3>
        <div className="priority-bars">
          {Object.entries(analytics.priorities).map(([priority, count]) => (
            <div key={priority} className="priority-bar">
              <div className="priority-label">
                <span className={`priority-dot priority-${priority}`}></span>
                <span className="priority-name">{priority}</span>
                <span className="priority-count">{count}</span>
              </div>
              <div className="priority-progress">
                <div 
                  className={`priority-fill priority-${priority}`}
                  style={{ 
                    width: `${(count / threads.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick insights */}
      <div className="quick-insights">
        <h3 className="insights-title">Quick Insights</h3>
        <div className="insights-list">
          {stats.breached > 0 && (
            <div className="insight urgent">
              <span className="insight-icon">⚠️</span>
              <span className="insight-text">
                {stats.breached} thread{stats.breached > 1 ? 's' : ''} breached SLA
              </span>
            </div>
          )}
          
          {stats.unread > 0 && (
            <div className="insight info">
              <span className="insight-icon">💬</span>
              <span className="insight-text">
                {stats.unread} unread message{stats.unread > 1 ? 's' : ''} waiting
              </span>
            </div>
          )}
          
          {analytics.todayThreads > 0 && (
            <div className="insight success">
              <span className="insight-icon">📈</span>
              <span className="insight-text">
                {analytics.todayThreads} new thread{analytics.todayThreads > 1 ? 's' : ''} today
              </span>
            </div>
          )}
          
          {analytics.slaCompliance >= 95 && (
            <div className="insight success">
              <span className="insight-icon">🎯</span>
              <span className="insight-text">
                Excellent SLA compliance at {analytics.slaCompliance}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}