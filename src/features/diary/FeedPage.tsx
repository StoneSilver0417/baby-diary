import { Link } from 'react-router'
import { format } from 'date-fns'
import { Heart, MessageCircle, Plus, Search } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { childAge } from '@/lib/childAge'
import { useChild, useFeed, useProfiles } from './useDiaryQueries'
import { useNewBadge } from './useNewBadge'
import { EntryPhotos } from './EntryPhotos'
import { DiaryViewSegment } from './DiaryViewSegment'

export function FeedPage() {
  const { userId } = useAuth()
  const { data: child } = useChild()
  const { data: profiles } = useProfiles()
  const { data: feed, isLoading } = useFeed()
  const myProfile = profiles?.find((p) => p.id === userId)
  const { isNew } = useNewBadge(myProfile, feed)

  const age = childAge(child?.birth_date)

  return (
    <div className="relative min-h-full">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 pt-safe pb-4 backdrop-blur">
        <div className="flex items-start justify-between pt-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{child?.name ?? ' '}</h1>
            {age && (
              <p className="text-sm text-muted-foreground">
                D+{age.days}일 · {age.months}개월
              </p>
            )}
          </div>
          <Link to="/search" aria-label="일기 검색" className="mt-1 text-muted-foreground">
            <Search className="size-5" />
          </Link>
        </div>
        <div className="mt-3">
          <DiaryViewSegment />
        </div>
      </header>

      <div className="divide-y divide-border">
        {isLoading &&
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-3 p-5">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}

        {feed?.map((entry) => (
          <Link key={entry.id} to={`/entry/${entry.id}`} className="block p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{entry.authorName}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(entry.entry_date), 'M월 d일')}
              </span>
              {isNew(entry) && (
                <Badge className="bg-primary text-primary-foreground">새 글</Badge>
              )}
            </div>

            <EntryPhotos photos={entry.photos} className="mb-3 rounded-lg" />

            <p className="whitespace-pre-wrap text-sm text-foreground">{entry.content}</p>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span
                className={cn(
                  'flex items-center gap-1',
                  entry.likedBy.includes(userId ?? '') && 'text-primary',
                )}
              >
                <Heart className="size-4" />
                {entry.likedBy.length}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="size-4" />
                {entry.comments.length}
              </span>
            </div>
          </Link>
        ))}

        {!isLoading && feed?.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            아직 작성된 일기가 없어요. 첫 기록을 남겨보세요.
          </p>
        )}
      </div>

      <Link
        to="/write"
        className="fixed bottom-24 right-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        aria-label="일기 작성"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  )
}
