import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { format } from 'date-fns'
import { ChevronLeft, Heart } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useEntry, useProfiles } from './useDiaryQueries'
import { useAddComment, useToggleLike } from './useDiaryMutations'
import { EntryPhotos } from './EntryPhotos'

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userId } = useAuth()
  const { data: entry, isLoading } = useEntry(id)
  const { data: profiles } = useProfiles()
  const toggleLike = useToggleLike(userId ?? '')
  const addComment = useAddComment(userId ?? '')
  const [commentText, setCommentText] = useState('')

  if (isLoading || !entry) {
    return <div className="p-5 text-sm text-muted-foreground">불러오는 중…</div>
  }

  const liked = entry.likedBy.includes(userId ?? '')
  const authorOf = (authorId: string) =>
    profiles?.find((p) => p.id === authorId)?.display_name ?? ''

  function handleSubmitComment() {
    if (!commentText.trim() || !id) return
    addComment.mutate({ entryId: id, content: commentText })
    setCommentText('')
  }

  return (
    <div className="min-h-full pt-safe">
      <header className="flex items-center gap-2 border-b border-border p-4">
        <button onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-sm font-medium">
          {entry.authorName} · {format(new Date(entry.entry_date), 'M월 d일')}
        </span>
      </header>

      <EntryPhotos photos={entry.photos} />

      <div className="p-5">
        <p className="whitespace-pre-wrap text-sm text-foreground">{entry.content}</p>

        <button
          type="button"
          onClick={() => id && toggleLike.mutate({ entryId: id, like: !liked })}
          className={cn(
            'mt-4 flex items-center gap-1.5 text-sm',
            liked ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <Heart className={cn('size-5', liked && 'fill-primary')} />
          좋아요 {entry.likedBy.length}
        </button>

        <div className="mt-6 space-y-3">
          {entry.comments.map((comment) => (
            <div key={comment.id} className="text-sm">
              <span className="font-medium text-foreground">{authorOf(comment.author_id)}</span>{' '}
              <span className="text-foreground">{comment.content}</span>
            </div>
          ))}
          {entry.comments.length === 0 && (
            <p className="text-sm text-muted-foreground">아직 댓글이 없어요.</p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-background p-4 pb-safe">
        <Input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="댓글을 남겨보세요"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
        />
        <Button onClick={handleSubmitComment} disabled={!commentText.trim()}>
          등록
        </Button>
      </div>
    </div>
  )
}
