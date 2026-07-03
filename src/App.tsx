import { Routes, Route } from 'react-router'
import { ProtectedRoute, RedirectIfAuthed } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { FeedPage } from '@/features/diary/FeedPage'
import { CalendarPage } from '@/features/diary/CalendarPage'
import { AlbumPage } from '@/features/diary/AlbumPage'
import { SearchPage } from '@/features/diary/SearchPage'
import { EntryEditorPage } from '@/features/diary/EntryEditorPage'
import { EntryDetailPage } from '@/features/diary/EntryDetailPage'
import { GrowthPage } from '@/features/growth/GrowthPage'
import { InvestPage } from '@/features/invest/InvestPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

function App() {
  return (
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
    </Routes>
  )
}

export default App
