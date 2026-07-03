import { NavLink, Outlet } from 'react-router'
import { BookHeart, LineChart, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: '일기', icon: BookHeart, end: true },
  { to: '/invest', label: '투자', icon: LineChart, end: false },
  { to: '/settings', label: '설정', icon: Settings, end: false },
]

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card pb-safe">
        <div className="mx-auto flex max-w-md">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
