import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { SplashScreen } from '@/components/SplashScreen'

export function ProtectedRoute() {
  const { userId } = useAuth()
  const location = useLocation()

  if (userId === undefined) {
    return <SplashScreen />
  }

  if (userId === null) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth()
  if (userId) return <Navigate to="/" replace />
  return <>{children}</>
}
