import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, useMock } from '@/lib/supabase'
import { MOCK_USERS } from '@/lib/mockDb'

type AuthContextValue = {
  /** undefined = 세션 판정 전, null = 로그아웃 상태 */
  userId: string | null | undefined
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const MOCK_STORAGE_KEY = 'baby-diary-mock-user-id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (useMock) {
      setUserId(localStorage.getItem(MOCK_STORAGE_KEY))
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user.id ?? null)
      if (event === 'SIGNED_OUT') {
        queryClient.clear()
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [queryClient])

  async function signIn(email: string, password: string) {
    if (useMock) {
      const user = MOCK_USERS.find((u) => u.email === email && u.password === password)
      if (!user) return '이메일 또는 비밀번호가 올바르지 않습니다.'
      localStorage.setItem(MOCK_STORAGE_KEY, user.id)
      setUserId(user.id)
      return null
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  async function signUp(email: string, password: string) {
    if (useMock) {
      return '모의 모드에서는 회원가입을 지원하지 않아요.'
    }
    const { error } = await supabase.auth.signUp({ email, password })
    return error ? error.message : null
  }

  async function signOut() {
    if (useMock) {
      localStorage.removeItem(MOCK_STORAGE_KEY)
      setUserId(null)
      queryClient.clear()
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ userId, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
