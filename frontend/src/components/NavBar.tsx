import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import type { ReactElement } from 'react'

export default function NavBar(): ReactElement {
  const { token, logout } = useAuth()
  return (
    <nav
      className="navbar navbar-expand-md navbar-light bg-light mb-3"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Home
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarsMain"
          aria-controls="navbarsMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarsMain">
          <ul className="navbar-nav me-auto mb-2 mb-md-0">
            <li className="nav-item">
              <Link className="nav-link" to="/threads">
                Threads
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">
                About
              </Link>
            </li>
          </ul>
          <div className="d-flex">
            {token ? (
              <button className="btn btn-outline-secondary" onClick={logout}>
                Logout
              </button>
            ) : (
              <>
                <Link className="btn btn-outline-primary me-2" to="/login">
                  Login
                </Link>
                <Link className="btn btn-primary" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
