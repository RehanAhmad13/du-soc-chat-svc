import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import NavBar from './components/NavBar'
import { useAuth } from './AuthContext'
import { jwtDecode } from 'jwt-decode'

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'))
const Chat = lazy(() => import('./pages/Chat'))
const About = lazy(() => import('./pages/About'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Threads = lazy(() => import('./pages/Threads'))
const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'))

export default function App() {
  const { token } = useAuth()

  let isAdmin = false
  if (token) {
    try {
      const decoded = jwtDecode(token)
      isAdmin = decoded?.is_staff === true   // Corrected from is_admin
    } catch (e) {
      console.error('Invalid token', e)
    }
  }

  return (
    <>
      <NavBar />
      <div style={{ padding: '1rem' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/threads" element={<Threads />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/about" element={<About />} />
            {isAdmin && <Route path="/admin-users" element={<AdminUsers />} />}  {/* Only visible if staff */}
            <Route path="*" element={<h2>Not Found</h2>} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}
