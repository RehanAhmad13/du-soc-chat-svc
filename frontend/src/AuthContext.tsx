import { createContext, useContext, useState, ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'

interface AuthContextType {
  token: string | null
  isAdmin: boolean
  userInfo: {
    user_id: number | null
    username: string | null
    email: string | null
    tenant_id: number | null
    tenant_name: string | null
  } | null
  login: (newToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

interface DecodedToken {
  user_id: number
  username: string
  email: string
  tenant_id: number | null
  tenant_name: string | null
  is_staff?: boolean
  is_superuser?: boolean
  exp: number
  iat: number
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  
  const initializeUserData = (t: string | null) => {
    if (!t) return { isAdmin: false, userInfo: null }
    try {
      const decoded: DecodedToken = jwtDecode(t)
      return {
        isAdmin: !!decoded.is_staff,
        userInfo: {
          user_id: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
          tenant_id: decoded.tenant_id,
          tenant_name: decoded.tenant_name
        }
      }
    } catch {
      return { isAdmin: false, userInfo: null }
    }
  }

  const initialData = initializeUserData(localStorage.getItem('token'))
  const [isAdmin, setIsAdmin] = useState<boolean>(initialData.isAdmin)
  const [userInfo, setUserInfo] = useState(initialData.userInfo)

  function login(newToken: string) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    const data = initializeUserData(newToken)
    setIsAdmin(data.isAdmin)
    setUserInfo(data.userInfo)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setIsAdmin(false)
    setUserInfo(null)
  }

  return (
    <AuthContext.Provider value={{ token, isAdmin, userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}

