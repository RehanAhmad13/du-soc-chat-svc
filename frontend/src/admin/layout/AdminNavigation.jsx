import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'

// Sophisticated SVG Icons
const Icons = {
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  messages: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  building: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M5 21V7l8-4v18"/>
      <path d="M19 21V11l-6-4"/>
    </svg>
  ),
  clipboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  analytics: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-6.5L17 10m-5 5l-3.5 3.5M17 14l-3.5-3.5M7 10L3.5 6.5"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export default function AdminNavigation() {
  const navigate = useNavigate()
  const { logout } = useAuth()


  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="admin-nav">
      <div className="admin-nav-header">
        <h1 className="admin-logo">
          <span className="logo-icon">{Icons.shield}</span>
          <span className="logo-text">
            <span className="logo-primary">SOC</span>
            <span className="logo-secondary">Admin</span>
          </span>
        </h1>
      </div>

      <div className="admin-nav-menu">
        <NavLink to="/admin" end className="nav-item">
          <span className="nav-icon">{Icons.dashboard}</span>
          <span className="nav-text">Dashboard</span>
        </NavLink>

        <NavLink to="/admin/threads" className="nav-item">
          <span className="nav-icon">{Icons.messages}</span>
          <span className="nav-text">Thread Management</span>
        </NavLink>

        <NavLink to="/admin/users" className="nav-item">
          <span className="nav-icon">{Icons.users}</span>
          <span className="nav-text">User Management</span>
        </NavLink>

        <NavLink to="/admin/tenants" className="nav-item">
          <span className="nav-icon">{Icons.building}</span>
          <span className="nav-text">Tenant Management</span>
        </NavLink>

        <NavLink to="/admin/templates" className="nav-item">
          <span className="nav-icon">{Icons.clipboard}</span>
          <span className="nav-text">Template Management</span>
        </NavLink>

        <NavLink to="/admin/analytics" className="nav-item">
          <span className="nav-icon">{Icons.analytics}</span>
          <span className="nav-text">Analytics & Reports</span>
        </NavLink>

        <NavLink to="/admin/settings" className="nav-item">
          <span className="nav-icon">{Icons.settings}</span>
          <span className="nav-text">System Settings</span>
        </NavLink>
      </div>

      <div className="admin-nav-footer">
        <button 
          onClick={handleLogout}
          className="nav-item nav-logout"
        >
          <span className="nav-icon">{Icons.logout}</span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </nav>
  )
}