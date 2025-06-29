import { useLocation, Link } from 'react-router-dom'

export default function AdminBreadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  const breadcrumbNames = {
    admin: 'Admin',
    dashboard: 'Dashboard',
    threads: 'Thread Management',
    users: 'User Management',
    tenants: 'Tenant Management',
    templates: 'Template Management',
    analytics: 'Analytics & Reports',
    settings: 'System Settings'
  }

  return (
    <nav className="admin-breadcrumbs">
      <Link to="/admin" className="breadcrumb-item">
        <span className="breadcrumb-icon">🏠</span>
        Admin
      </Link>
      
      {pathnames.slice(1).map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 2).join('/')}`
        const isLast = index === pathnames.length - 2
        const displayName = breadcrumbNames[name] || name

        return (
          <span key={name} className="breadcrumb-wrapper">
            <span className="breadcrumb-separator">/</span>
            {isLast ? (
              <span className="breadcrumb-item active">{displayName}</span>
            ) : (
              <Link to={routeTo} className="breadcrumb-item">
                {displayName}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}