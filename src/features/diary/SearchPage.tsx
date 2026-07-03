import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { format } from 'date-fns'
import { ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useFeed } from './useDiaryQueries'

export function SearchPage() {
  const navigate = useNavigate()
  const { data: feed } = useFeed()
  const [query, setQuery] = useState('')

  // 피드가 전량 로드 구조라 클라이언트 필터로 충분.
  // 추후 페이지네이션 도입 시 supabase .ilike() 서버 검색으로 이관.
  const q = query.trim()
  const results = q
    ? (feed ?? []).filter(
        (e) =>
          e.content.includes(q) || e.comments.some((c) => c.content.includes(q)),
      )
    : []

  return (
    <div className="min-h-full">
      <header className="flex items-center gap-2 border-b border-border p-4 pt-safe">
        <button onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft className="size-5" />
        </button>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="일기·댓글 내용 검색"
        />
      </header>

      <div className="divide-y divide-border">
        {q && results.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">검색 결과가 없어요.</p>
        )}
        {results.map((entry) => (
          <Link key={entry.id} to={`/entry/${entry.id}`} className="block p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{entry.authorName}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(entry.entry_date), 'M월 d일')}
              </span>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{entry.content}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
