import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
      <Link to="/chat" style={{ marginRight: '1rem' }}>Chat</Link>
      <Link to="/about">About</Link>
    </nav>
  )
}
