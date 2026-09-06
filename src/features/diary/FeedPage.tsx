import { Link } from 'react-router'
import { format } from 'date-fns'
import { Heart, MessageCircle, Plus, Search, Sparkles } from 'lucide-react'
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
  const headerTitle = singleChild ? singleChild.name : (household?.name ?? '육아일기')
  const childName = (childId: string | null) =>
    childId ? children.find((c) => c.id === childId)?.name : undefined

  return (
    <div className="relative min-h-full pb-24">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 px-5 pt-safe pb-4 backdrop-blur-md transition-all">
        <div className="flex items-center justify-between pt-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{headerTitle}</h1>
              <Sparkles className="size-4 text-amber-400" />
            </div>
            {age && (
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                D+{age.days}일 <span className="text-border">·</span> {age.months}개월
              </p>
            )}
          </div>
          <Link
            to="/search"
            aria-label="일기 검색"
            className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="size-4" />
          </Link>
        </div>
        <div className="mt-4">
          <DiaryViewSegment />
        </div>
      </header>

      <div className="space-y-5 p-4">
        {isLoading &&
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}

        {feed?.map((entry) => (
          <Link
            key={entry.id}
            to={`/entry/${entry.id}`}
            className="group block overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/30"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                  <Sun className="size-5 shrink-0 text-amber-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-hand text-lg font-semibold leading-tight text-foreground">
                    {entry.authorName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.entry_date), 'yyyy년 M월 d일')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isNew(entry) && (
                  <Badge className="bg-primary text-primary-foreground shadow-xs animate-pulse">
                    새 글
                  </Badge>
                )}
                {children.length > 1 && childName(entry.child_id) && (
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                    {childName(entry.child_id)}
                  </Badge>
                )}
              </div>
            </div>

            {entry.photos.length > 0 && (
              <div className="polaroid polaroid-tilt-left tape my-4 overflow-hidden rounded-lg">
                <EntryPhotos photos={entry.photos} className="rounded-sm" />
              </div>
            )}

            <p className="paper-lines line-clamp-4 whitespace-pre-wrap px-2 py-0 font-hand text-lg text-foreground">
              {entry.content}
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'flex items-center gap-1.5 transition-colors',
                    entry.likedBy.includes(userId ?? '') && 'font-semibold text-rose-500',
                  )}
                >
                  <Heart
                    className={cn(
                      'size-4',
                      entry.likedBy.includes(userId ?? '') && 'fill-rose-500 text-rose-500',
                    )}
                  />
                  {entry.likedBy.length}
                </span>
                <span className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                  <MessageCircle className="size-4" />
                  {entry.comments.length}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground/70">자세히 보기 →</span>
            </div>
          </Link>
        ))}

        {!isLoading && feed?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center">
            <Sun className="mb-3 size-12 text-amber-300" />
            <p className="text-base font-medium text-foreground">아직 작성된 일기가 없어요</p>
            <p className="mt-1 text-xs text-muted-foreground">소중한 첫 육아 기록을 작성해 보세요.</p>
          </div>
        )}
      </div>

      <Link to="/write" className={fabClassName} aria-label="일기 작성">
        <Plus className="size-6" />
      </Link>
    </div>
  )
}
