import { ReactElement, useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { FaUserCircle, FaChevronDown, FaBell, FaBars, FaTimes } from 'react-icons/fa'
import { FiShield, FiSearch, FiUsers, FiAlertCircle } from 'react-icons/fi'
import './CompactNavBar.css'

export default function CompactNavBar(): ReactElement | null {
  const { token, userInfo, isAdmin, logout } = useAuth()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [unreadCount] = useState(3) // Mock notification count
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navigation items
  const navItems = [
    {
      key: 'incidents',
      label: 'Incidents',
      path: '/incidents',
      icon: <FiAlertCircle size={16} />,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      key: 'search',
      label: 'Search',
      path: '/search',
      icon: <FiSearch size={16} />
    },
    {
      key: 'organization',
      label: 'Organization',
      path: '/organization',
      icon: <FiUsers size={16} />
    }
  ]

  // Add admin dashboard for admin users
  if (isAdmin) {
    navItems.push({
      key: 'admin',
      label: 'Admin',
      path: '/admin',
      icon: <FiShield size={16} />
    })
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Early return if no token - no navbar should render
  if (!token) {
    return null
  }

  return (
    <nav className="compact-navbar">
      <div className="navbar-container">
        {/* Left: Brand/Logo */}
        <div className="navbar-brand">
          <FiShield size={24} />
          <span>SOC Portal</span>
        </div>

        {/* Center: Navigation Tabs */}
        <div className={`navbar-center ${showMobileMenu ? 'mobile-open' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`nav-tab ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
        </div>

        {/* Right: User Menu */}
        <div className="navbar-actions">
          {/* Notification Bell */}
          <div className="notification-bell">
            <FaBell size={18} />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </div>

          {/* User Menu */}
          <div className="user-menu" ref={userMenuRef}>
            <button
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <FaUserCircle size={24} />
              <div className="user-info">
                <span className="username">{userInfo?.username}</span>
                {!isAdmin && userInfo?.tenant_name && (
                  <span className="tenant">{userInfo.tenant_name}</span>
                )}
              </div>
              <FaChevronDown 
                size={12} 
                className={`chevron ${showUserMenu ? 'rotated' : ''}`} 
              />
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="user-details">
                    <strong>{userInfo?.username}</strong>
                    {!isAdmin && userInfo?.tenant_name && (
                      <span className="tenant-badge">{userInfo.tenant_name}</span>
                    )}
                    {isAdmin && <span className="admin-badge">Administrator</span>}
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item">
                  Profile Settings
                </Link>
                <Link to="/preferences" className="dropdown-item">
                  Preferences
                </Link>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    logout()
                    setShowUserMenu(false)
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>
    </nav>
  )
}