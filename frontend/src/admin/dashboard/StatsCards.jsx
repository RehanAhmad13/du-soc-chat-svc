// Sophisticated SVG Icons for Stats
const StatsIcons = {
  messages: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  clock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  users: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  zap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
    </svg>
  ),
  alert: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  )
}

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Total Threads',
      value: stats.totalThreads,
      change: '+12%',
      trend: 'up',
      icon: StatsIcons.messages,
      color: 'blue'
    },
    {
      title: 'SLA Compliance',
      value: `${stats.slaCompliance}%`,
      change: '+2.1%',
      trend: 'up',
      icon: StatsIcons.shield,
      color: 'green'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      change: '+5',
      trend: 'up',
      icon: StatsIcons.users,
      color: 'purple'
    },
    {
      title: 'Avg Response Time',
      value: `${stats.avgResponseTime}h`,
      change: '-0.3h',
      trend: 'down',
      icon: StatsIcons.zap,
      color: 'orange'
    },
    {
      title: 'Escalated Incidents',
      value: stats.escalatedIncidents,
      change: '+2',
      trend: 'up',
      icon: StatsIcons.alert,
      color: 'red'
    },
    {
      title: 'SLA Breached',
      value: stats.breachedSLA,
      change: '-4',
      trend: 'down',
      icon: StatsIcons.clock,
      color: 'yellow'
    }
  ]

  return (
    <div className="stats-grid">
      {cards.map((card, index) => (
        <div key={index} className={`stat-card stat-card-${card.color}`}>
          <div className="stat-header">
            <div className={`stat-icon-wrapper stat-icon-${card.color}`}>
              <span className="stat-icon">{card.icon}</span>
            </div>
            <span className={`stat-change trend-${card.trend}`}>
              {card.trend === 'up' ? '↗' : '↘'} {card.change}
            </span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{card.value}</h3>
            <p className="stat-title">{card.title}</p>
          </div>
        </div>
      ))}
    </div>
  )
}