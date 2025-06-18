import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Chat from './pages/Chat'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import Threads from './pages/Threads'

export default function App() {
  return (
    <>
      <NavBar />
      <div style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/threads" element={<Threads />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<h2>Not Found</h2>} />
        </Routes>
      </div>
    </>
  )
}
