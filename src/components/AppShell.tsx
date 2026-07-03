import { Link, Outlet, useLocation } from 'react-router'
import { BookHeart, LineChart, Ruler, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card pb-safe">
        <div className="mx-auto flex max-w-md">
          {tabs.map(({ to, label, icon: Icon, prefixes }) => {
            const active = isTabActive(pathname, prefixes)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
