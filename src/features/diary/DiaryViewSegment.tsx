import { useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { AppLink } from '@/lib/navigation'

const views = [
  { to: '/', label: '피드' },
  { to: '/calendar', label: '캘린더' },
  { to: '/album', label: '앨범' },
]

/** 일기 탭 상단 보기 방식 세그먼트 (피드/캘린더/앨범) */
export function DiaryViewSegment() {
  const { pathname } = useLocation()

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {views.map(({ to, label }) => {
        const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
        return (
          <AppLink
            key={to}
            to={to}
            className={cn(
              'flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-colors',
              active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {label}
          </AppLink>
        )
      })}
    </div>
  )
}
