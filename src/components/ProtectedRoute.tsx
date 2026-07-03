import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/AuthProvider'

export function ProtectedRoute() {
  const { userId } = useAuth()
  const location = useLocation()

  if (userId === undefined) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-muted-foreground">
        불러오는 중…
      </div>
    )
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
