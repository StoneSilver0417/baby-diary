import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router'
import {
  ProtectedRoute,
  RedirectIfAuthed,
  RedirectIfOnboarded,
  OnboardingGate,
  AdminRoute,
} from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { SplashScreen } from '@/components/SplashScreen'
import { useBackNavigation } from '@/lib/useBackNavigation'
import { LoginPage } from '@/features/auth/LoginPage'
import { FeedPage } from '@/features/diary/FeedPage'
import { EntryEditorPage } from '@/features/diary/EntryEditorPage'
import { EntryDetailPage } from '@/features/diary/EntryDetailPage'

// 핵심 경로(로그인·피드·작성·상세)는 즉시 로드, 나머지 탭은 lazy로 분리해 초기 번들 축소
const OnboardingPage = lazy(() =>
  import('@/features/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
)
const CalendarPage = lazy(() =>
  import('@/features/diary/CalendarPage').then((m) => ({ default: m.CalendarPage })),
)
const AlbumPage = lazy(() =>
  import('@/features/diary/AlbumPage').then((m) => ({ default: m.AlbumPage })),
)
const SearchPage = lazy(() =>
  import('@/features/diary/SearchPage').then((m) => ({ default: m.SearchPage })),
)
const GrowthPage = lazy(() =>
  import('@/features/growth/GrowthPage').then((m) => ({ default: m.GrowthPage })),
)
const InvestPage = lazy(() =>
  import('@/features/invest/InvestPage').then((m) => ({ default: m.InvestPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const AdminPage = lazy(() =>
  import('@/features/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
)

function App() {
  useBackNavigation()

  return (
    <Suspense fallback={<SplashScreen />}>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/onboarding"
            element={
              <RedirectIfOnboarded>
                <OnboardingPage />
              </RedirectIfOnboarded>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route element={<OnboardingGate />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<FeedPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/album" element={<AlbumPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/write" element={<EntryEditorPage />} />
              <Route path="/entry/:id" element={<EntryDetailPage />} />
              <Route path="/growth" element={<GrowthPage />} />
              <Route path="/invest" element={<InvestPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
