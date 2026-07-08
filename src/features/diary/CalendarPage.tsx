import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiaryEntry } from '@/types/database'
import { useFeed } from './useDiaryQueries'
import { DiaryViewSegment } from './DiaryViewSegment'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function CalendarPage() {
  const navigate = useNavigate()
  const { data: feed } = useFeed()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<Date | null>(null)

  // 날짜(yyyy-MM-dd) → 그날의 일기들
  const entriesByDate = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>()
    for (const entry of feed ?? []) {
      const list = map.get(entry.entry_date) ?? []
      list.push(entry)
      map.set(entry.entry_date, list)
    }
    return map
  }, [feed])

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const leadingBlanks = getDay(startOfMonth(month))

  const selectedEntries = selected
    ? (entriesByDate.get(format(selected, 'yyyy-MM-dd')) ?? [])
    : []

  function handleDayClick(day: Date) {
    const list = entriesByDate.get(format(day, 'yyyy-MM-dd')) ?? []
    if (list.length === 1) {
      navigate(`/entry/${list[0].id}`, { replace: true })
    } else if (list.length > 1) {
      setSelected(day)
    } else {
      setSelected(null)
    }
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-border px-5 pt-safe pb-4">
        <div className="pt-4">
          <DiaryViewSegment />
        </div>
      </header>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setMonth(addMonths(month, -1))} aria-label="이전 달">
            <ChevronLeft className="size-5 text-muted-foreground" />
          </button>
          <span className="text-base font-semibold text-foreground">
            {format(month, 'yyyy년 M월')}
          </span>
          <button onClick={() => setMonth(addMonths(month, 1))} aria-label="다음 달">
            <ChevronRight className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const list = entriesByDate.get(format(day, 'yyyy-MM-dd')) ?? []
            const isToday = isSameDay(day, new Date())
            const isSelected = selected && isSameDay(day, selected)
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'mx-auto flex size-9 flex-col items-center justify-center rounded-full text-sm',
                  isToday && 'font-bold text-primary',
                  isSelected && 'bg-accent',
                )}
              >
                {format(day, 'd')}
                {list.length > 0 && <span className="mt-0.5 size-1.5 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>

        {selectedEntries.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {selected && format(selected, 'M월 d일')}
            </p>
            {selectedEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => navigate(`/entry/${entry.id}`, { replace: true })}
                className="block w-full rounded-lg border border-border p-3 text-left"
              >
                <span className="text-sm font-medium text-foreground">{entry.authorName}</span>
                <p className="line-clamp-1 text-sm text-muted-foreground">{entry.content}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
