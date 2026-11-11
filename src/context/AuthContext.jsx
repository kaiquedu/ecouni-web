import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError, api, setToken, setUnauthorizedHandler } from '../lib/api'

const KEY = 'ecouni.session'
const AuthContext = createContext(null)

const restore = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY))
    if (s?.Token) setToken(s.Token)
    return s
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(restore)

  const logout = useCallback(() => {
    sessionStorage.removeItem(KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const login = useCallback(async (email, senha) => {
    const data = await api.login(email.trim(), senha)
    if (!data.IsAdmin) throw new ApiError('O painel web é exclusivo do administrador. Colaboradores usam o app EcoUni no celular.', 403)
    sessionStorage.setItem(KEY, JSON.stringify(data))
    setToken(data.Token)
    setUser(data)
    return data
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
