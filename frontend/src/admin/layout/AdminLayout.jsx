import { Outlet } from 'react-router-dom'
import AdminNavigation from './AdminNavigation'
import './AdminLayout.css'

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminNavigation />
      <div className="admin-content">
        <main className="admin-main">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}