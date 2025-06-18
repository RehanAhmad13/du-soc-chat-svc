import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import NavBar from './components/NavBar'

const Home = lazy(() => import('./pages/Home'))
const Chat = lazy(() => import('./pages/Chat'))
const About = lazy(() => import('./pages/About'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Threads = lazy(() => import('./pages/Threads'))

export default function App() {
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
            <Route path="*" element={<h2>Not Found</h2>} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}
