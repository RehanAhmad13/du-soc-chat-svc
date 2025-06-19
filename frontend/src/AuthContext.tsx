import { createContext, useContext, useState, ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'

interface AuthContextType {
  token: string | null
  isAdmin: boolean
  login: (newToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

interface DecodedToken {
  user_id: number
  tenant_id: number
  exp: number
  iat: number
  is_staff?: boolean
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const t = localStorage.getItem('token')
    if (!t) return false
    try {
      const decoded: DecodedToken = jwtDecode(t)
      return !!decoded.is_staff
    } catch {
      return false
    }
  })

  function login(newToken: string) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    try {
      const decoded: DecodedToken = jwtDecode(newToken)
      setIsAdmin(!!decoded.is_staff)
    } catch {
      setIsAdmin(false)
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ token, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}

