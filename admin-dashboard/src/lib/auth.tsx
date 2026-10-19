import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, setCsrfToken, setUnauthorizedHandler } from './api'
import type { User } from './types'

type Status = 'loading' | 'anonymous' | 'authenticated'

interface AuthContextValue {
  status: Status
  user: User | null
  notice: string | null
  login: (email: string, password: string, code?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface SessionResponse {
  user: User
  csrfToken: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const apply = useCallback((res: SessionResponse) => {
    setCsrfToken(res.csrfToken)
    setUser(res.user)
    setStatus('authenticated')
    setNotice(null)
  }, [])

  const clear = useCallback((message: string | null) => {
    setCsrfToken('')
    setUser(null)
    setStatus('anonymous')
    setNotice(message)
  }, [])

  const refresh = useCallback(async () => {
    try {
      apply(await api.get<SessionResponse>('/auth/me'))
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) setNotice(err.message)
      clear(null)
    }
  }, [apply, clear])

  useEffect(() => {
    setUnauthorizedHandler(() => clear('Your session ended. Please sign in again.'))
    void refresh()
  }, [refresh, clear])

  const login = useCallback(
    async (email: string, password: string, code?: string) => {
      apply(await api.post<SessionResponse>('/auth/login', { email, password, ...(code ? { code } : {}) }))
    },
    [apply],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clear(null)
    }
  }, [clear])

  const value = useMemo(
    () => ({ status, user, notice, login, logout, refresh }),
    [status, user, notice, login, logout, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
