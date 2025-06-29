import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext'
import { getAdminDashboardStats, getActivityFeed, getSystemHealth } from '../../api'
import StatsCards from './StatsCards'
import ChartsSection from './ChartsSection'
import RecentActivity from './RecentActivity'
import './Dashboard.css'

export default function AdminDashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState({
    totalThreads: 0,
    slaCompliance: 0,
    activeUsers: 0,
    avgResponseTime: 0,
    escalatedIncidents: 0,
    breachedSLA: 0
  })
  const [activityFeed, setActivityFeed] = useState([])
  const [systemHealth, setSystemHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError('')

        // Try to load real data from comprehensive admin API
        try {
          const [statsData, activityData, healthData] = await Promise.all([
            getAdminDashboardStats(token),
            getActivityFeed(token, 20),
            getSystemHealth(token)
          ])

          // Transform API data to match component expectations
          const transformedStats = {
            totalThreads: statsData.kpis.total_threads || 0,
            slaCompliance: statsData.kpis.total_threads > 0 
              ? ((statsData.kpis.total_threads - statsData.kpis.sla_breached) / statsData.kpis.total_threads * 100).toFixed(1)
              : 0,
            activeUsers: statsData.kpis.online_users || 0,
            avgResponseTime: 4.2, // Mock for now - would need calculation
            escalatedIncidents: statsData.kpis.sla_at_risk || 0,
            breachedSLA: statsData.kpis.sla_breached || 0,
            // Additional comprehensive data
            pendingApprovals: statsData.kpis.pending_approvals || 0,
            messages24h: statsData.kpis.messages_24h || 0,
            totalUsers: statsData.kpis.total_users || 0,
            activeThreads: statsData.kpis.active_threads || 0
          }

          setStats(transformedStats)
          setActivityFeed(activityData.activities || [])
          setSystemHealth(healthData)
        } catch (apiError) {
          console.warn('New admin API not available, falling back to legacy:', apiError)
          
          // Fallback to legacy API or mock data
          const res = await fetch('/api/chat/admin/dashboard/', {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (res.ok) {
            const data = await res.json()
            setStats(data)
          } else {
            throw new Error('Legacy API also failed')
          }
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError('Failed to load dashboard data')
        
        // Final fallback to mock data
        const mockData = {
          totalThreads: 156,
          slaCompliance: 87.5,
          activeUsers: 24,
          avgResponseTime: 4.2,
          escalatedIncidents: 8,
          breachedSLA: 12,
          pendingApprovals: 5,
          messages24h: 234,
          totalUsers: 67,
          activeThreads: 23
        }
        setStats(mockData)
        setActivityFeed([
          {
            type: 'thread_created',
            title: 'New thread: INC-2024-001',
            description: 'Created in Security Team',
            timestamp: new Date().toISOString(),
            user: 'System',
            icon: '💬'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [token])

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back! Here's what's happening with your SOC platform.
        </p>
      </div>

      <StatsCards stats={stats} />
      <ChartsSection stats={stats} />
      <RecentActivity activities={activityFeed} systemHealth={systemHealth} />
    </div>
  )
}