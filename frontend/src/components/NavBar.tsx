import { ReactElement, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { FaUserCircle } from 'react-icons/fa'

export default function NavBar(): ReactElement {
  const { token, userInfo, isAdmin, logout } = useAuth()
  const location = useLocation()

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark px-3 fixed-top shadow-sm" role="navigation" style={{ height: '56px' }}>
      <div className="container-fluid d-flex justify-content-between align-items-center" style={{ height: '100%' }}>

        {/* LEFT: USER INFO */}
        {token && userInfo ? (
          <div className="d-flex align-items-center text-light gap-2">
            <FaUserCircle size={22} />
            <div className="d-flex flex-column lh-sm">
              <strong>{userInfo.username}</strong>
              {!isAdmin && (
                <span className="badge bg-secondary">{userInfo.tenant_name || 'N/A'}</span>
              )}
            </div>
          </div>
        ) : (
          <Link className="navbar-brand fw-bold" to="/">ChatApp</Link>
        )}

        {/* CENTER: NAV LINKS */}
        <div className="d-flex justify-content-center flex-grow-1">
          <ul className="navbar-nav mb-0">
            {token && (
              <li className="nav-item">
                <Link className="nav-link px-3" to="/threads">Threads</Link>
              </li>
            )}
            {token && isAdmin && (
              <li className="nav-item">
                <Link className="nav-link px-3" to="/admin">Admin Dashboard</Link>
              </li>
            )}
            {!token && (
              <li className="nav-item">
                <Link className="nav-link px-3" to="/about">About</Link>
              </li>
            )}
          </ul>
        </div>

        {/* RIGHT: AUTH BUTTONS */}
        <div>
          {token ? (
            <button className="btn btn-outline-light rounded-pill px-3" onClick={logout}>
              Logout
            </button>
          ) : (
            <>
              <Link className="btn btn-outline-light me-2" to="/login">Login</Link>
              <Link className="btn btn-primary" to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
