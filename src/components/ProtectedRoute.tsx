import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProfiles } from '@/features/diary/useDiaryQueries'
import { useIsAdmin } from '@/features/admin/useAdminQueries'
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

/** 로그인은 됐지만 아직 가족에 속하지 않은(profiles 행 없음) 사용자를 온보딩으로 보낸다. */
export function OnboardingGate() {
  const { userId } = useAuth()
  const { data: profiles, isLoading, isError } = useProfiles()

  if (isLoading) return <SplashScreen />
  if (isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center text-sm text-muted-foreground">
        정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </div>
    )
  }

  const hasProfile = profiles?.some((p) => p.id === userId) ?? false
  if (!hasProfile) return <Navigate to="/onboarding" replace />

  return <Outlet />
}

/** 이미 온보딩을 마친 사용자가 /onboarding에 다시 들어오면 피드로 보낸다. */
export function RedirectIfOnboarded({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth()
  const { data: profiles, isLoading } = useProfiles()

  if (isLoading) return <SplashScreen />

  const hasProfile = profiles?.some((p) => p.id === userId) ?? false
  if (hasProfile) return <Navigate to="/" replace />

  return <>{children}</>
}

/** 관리자(admins 테이블에 등록된 계정)만 /admin에 접근할 수 있다. 실제 방어는 RLS가 담당하고
 * 이 가드는 일반 사용자에게 화면을 아예 보여주지 않기 위한 UX용이다. */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: isAdmin, isLoading } = useIsAdmin()

  if (isLoading) return <SplashScreen />
  if (!isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
