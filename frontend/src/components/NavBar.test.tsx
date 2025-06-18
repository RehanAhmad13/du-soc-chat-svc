import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../AuthContext'
import NavBar from './NavBar'

test('renders navigation links', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
      </AuthProvider>
    </BrowserRouter>
  )
  expect(screen.getByText('Home')).toBeInTheDocument()
  expect(screen.getByText('Threads')).toBeInTheDocument()
  expect(screen.getByText('About')).toBeInTheDocument()
})
