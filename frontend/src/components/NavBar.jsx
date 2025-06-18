import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
      <Link to="/threads" style={{ marginRight: '1rem' }}>Threads</Link>
      <Link to="/about" style={{ marginRight: '1rem' }}>About</Link>
      <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
      <Link to="/register">Register</Link>
    </nav>
  )
}
