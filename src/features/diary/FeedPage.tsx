import { Link } from 'react-router'
import { format } from 'date-fns'
import { Heart, MessageCircle, Plus, Search } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { childAge } from '@/lib/childAge'
import { Sun } from '@/assets/doodles'
import { fabClassName } from '@/components/Fab'
import { useMyProfile } from '@/features/shared/useHousehold'
import { useSelectedChild } from '@/features/shared/SelectedChildProvider'
import { useFeed, useHouseholdInfo } from './useDiaryQueries'
import { useNewBadge } from './useNewBadge'
import { EntryPhotos } from './EntryPhotos'
import { DiaryViewSegment } from './DiaryViewSegment'

export function FeedPage() {
  const { userId } = useAuth()
  const { children } = useSelectedChild()
  const { data: household } = useHouseholdInfo()
  const { data: feed, isLoading } = useFeed()
  const myProfile = useMyProfile()
  const { isNew } = useNewBadge(myProfile, feed)

  const singleChild = children.length === 1 ? children[0] : undefined
  const age = childAge(singleChild?.birth_date)
  const headerTitle = singleChild ? singleChild.name : (household?.name ?? ' ')
  const childName = (childId: string | null) =>
    childId ? children.find((c) => c.id === childId)?.name : undefined

  return (
    <div className="relative min-h-full pb-20">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 pt-safe pb-4 backdrop-blur">
        <div className="flex items-start justify-between pt-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{headerTitle}</h1>
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

      <div className="space-y-4 p-4">
        {isLoading &&
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}

        {feed?.map((entry) => (
          <Link
            key={entry.id}
            to={`/entry/${entry.id}`}
            className="block rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2 font-hand text-lg text-foreground">
              <Sun className="size-6 shrink-0 text-sticker-yellow-foreground" />
              <span className="font-medium">{entry.authorName}</span>
              <span className="text-muted-foreground">
                {format(new Date(entry.entry_date), 'M월 d일')}
              </span>
              {isNew(entry) && (
                <Badge className="bg-primary text-primary-foreground">새 글</Badge>
              )}
              {children.length > 1 && childName(entry.child_id) && (
                <Badge variant="outline">{childName(entry.child_id)}</Badge>
              )}
            </div>

            {entry.photos.length > 0 && (
              <div className="polaroid polaroid-tilt-left tape mb-3">
                <EntryPhotos photos={entry.photos} className="rounded-sm" />
              </div>
            )}

            <p className="paper-lines whitespace-pre-wrap px-1 py-1 font-hand text-base leading-[1.6rem] text-foreground">
              {entry.content}
            </p>

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

      <Link to="/write" className={fabClassName} aria-label="일기 작성">
        <Plus className="size-6" />
      </Link>
    </div>
  )
}
