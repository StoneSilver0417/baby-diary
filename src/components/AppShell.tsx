import { Outlet, useLocation } from 'react-router'
import { BookHeart, LineChart, Ruler, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppLink } from '@/lib/navigation'
import { IosInstallBanner } from '@/components/IosInstallBanner'
import { SelectedChildProvider } from '@/features/shared/SelectedChildProvider'

const tabs = [
  { to: '/', label: '일기', icon: BookHeart, prefixes: ['/', '/calendar', '/album', '/write', '/entry', '/search'] },
  { to: '/growth', label: '성장', icon: Ruler, prefixes: ['/growth'] },
  { to: '/invest', label: '투자', icon: LineChart, prefixes: ['/invest'] },
  { to: '/settings', label: '설정', icon: Settings, prefixes: ['/settings'] },
]

function isTabActive(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
}

export function AppShell() {
  const { pathname } = useLocation()

  return (
    <SelectedChildProvider>
      {/* scroll-body-shell: 본문(main)만 스크롤하고 하단 탭바는 grid의 고정 행으로 둔다.
         탭바를 fixed로 겹치지 않으므로 본문이 탭바에 가릴 일이 구조적으로 없다(수동 여백 불필요). */}
      <div className="grid h-dvh grid-rows-[minmax(0,1fr)_auto] bg-background">
        <main className="min-h-0 overflow-y-auto">
          <IosInstallBanner />
          <Outlet />
        </main>
        <nav className="border-t border-border bg-card pb-safe">
          <div className="mx-auto flex max-w-md gap-1 px-2 py-1.5">
            {tabs.map(({ to, label, icon: Icon, prefixes }) => {
              const active = isTabActive(pathname, prefixes)
              return (
                <AppLink
                  key={to}
                  to={to}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </AppLink>
              )
            })}
          </div>
        </nav>
      </div>
    </SelectedChildProvider>
  )
}
