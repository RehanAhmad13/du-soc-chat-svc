import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="container mt-5 text-center">
      <h1 className="mb-4">Welcome to the ChatApp Platform</h1>
      <p className="lead mb-5">
        A secure, multi-tenant communication service built for teams, IT support, and incident collaboration.
      </p>

      <div className="row justify-content-center mb-4">
        <div className="col-md-4">
          <div className="card p-4 shadow-sm bg-dark border-light text-light">
            <h5> Secure Communication</h5>
            <p className="small">
              End-to-end encryption, structured messaging templates, and file protection ensure your conversations stay confidential.
            </p>
          </div>
        </div>
        <div className="col-md-4 mt-4 mt-md-0">
          <div className="card p-4 shadow-sm bg-dark border-light text-light">
            <h5> Multi-Tenant Support</h5>
            <p className="small">
              Each organization gets its own workspace, invite codes, and thread history — ensuring clean separation.
            </p>
          </div>
        </div>
      </div>

      <h4 className="mb-3">Get Started</h4>
      <div className="d-flex justify-content-center gap-3">
        <Link to="/register" className="btn btn-primary px-4">
          Register
        </Link>
        <Link to="/login" className="btn btn-outline-light px-4">
          Login
        </Link>
      </div>
    </div>
  )
}
