import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import CompactNavBar from './components/CompactNavBar'
import { useAuth } from './AuthContext'
import { jwtDecode } from 'jwt-decode'

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'))
const Chat = lazy(() => import('./pages/Chat/Chat.jsx'))
const About = lazy(() => import('./pages/About'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Threads = lazy(() => import('./pages/Threads/Threads.jsx'))
const Incidents = lazy(() => import('./pages/Incidents'))
const Search = lazy(() => import('./pages/Search'))
const Organization = lazy(() => import('./pages/Organization'))

// Admin components
const AdminLayout = lazy(() => import('./admin/layout/AdminLayout'))
const AdminDashboard = lazy(() => import('./admin/dashboard/AdminDashboard'))
const UserManagement = lazy(() => import('./admin/users/UserManagement'))
const ThreadManagement = lazy(() => import('./admin/threads/ThreadManagement'))
const TemplateManagement = lazy(() => import('./admin/templates/TemplateManagement'))
const TenantManagement = lazy(() => import('./admin/tenants/TenantManagement'))

// Legacy admin component (keeping for compatibility)
const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'))

// Admin route wrapper component
function AdminRoute({ children }) {
  const { token } = useAuth()
  
  let isAdmin = false
  if (token) {
    try {
      const decoded = jwtDecode(token)
      isAdmin = decoded?.is_staff === true
    } catch (e) {
      console.error('Invalid token', e)
    }
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  
  return children
}

export default function App() {
  const { token } = useAuth()

  let isAdmin = false
  if (token) {
    try {
      const decoded = jwtDecode(token)
      isAdmin = decoded?.is_staff === true
    } catch (e) {
      console.error('Invalid token', e)
    }
  }

  return (
    <>
      {/* Show navbar only for authenticated users, except on admin and chat routes */}
      {token && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/chat') && <CompactNavBar />}
      <div style={{ 
        padding: (isAdmin && window.location.pathname.startsWith('/admin')) || window.location.pathname.startsWith('/chat') ? '0' : '1rem',
        paddingTop: token && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/chat') ? '64px' : '1rem'
      }}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* New restructured routes */}
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/search" element={<Search />} />
            <Route path="/organization" element={<Organization />} />
            
            {/* Legacy routes for backward compatibility */}
            <Route path="/threads" element={<Navigate to="/incidents" replace />} />
            
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/about" element={<About />} />
            
            {/* Legacy Admin Route */}
            <Route 
              path="/admin-users" 
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } 
            />
            
            {/* New Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Routes>
                      {/* Admin Dashboard */}
                      <Route index element={<AdminDashboard />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      
                      {/* User Management */}
                      <Route path="users" element={<UserManagement />} />
                      
                      {/* Thread Management */}
                      <Route path="threads" element={<ThreadManagement />} />
                      
                      {/* Tenant Management */}
                      <Route path="tenants" element={<TenantManagement />} />
                      <Route path="templates" element={<TemplateManagement />} />
                      <Route 
                        path="analytics" 
                        element={
                          <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <h2>📊 Analytics & Reports</h2>
                            <p>Coming soon...</p>
                          </div>
                        } 
                      />
                      <Route 
                        path="settings" 
                        element={
                          <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <h2>⚙️ System Settings</h2>
                            <p>Coming soon...</p>
                          </div>
                        } 
                      />
                      
                      {/* Redirect admin root to dashboard */}
                      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                    </Routes>
                  </AdminLayout>
                </AdminRoute>
              } 
            />
            
            {/* Not Found */}
            <Route path="*" element={<h2>Not Found</h2>} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}
