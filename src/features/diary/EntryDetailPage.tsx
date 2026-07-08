import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { format } from 'date-fns'
import { ChevronLeft, Heart, Pencil, Trash2, X } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useSelectedChild } from '@/features/shared/SelectedChildProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { AppLink, useGoHome } from '@/lib/navigation'
import { useEntry, useProfiles } from './useDiaryQueries'
import { useAddComment, useDeleteComment, useDeleteEntry, useToggleLike } from './useDiaryMutations'
import { EntryPhotos } from './EntryPhotos'

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goHome = useGoHome()
  const { userId } = useAuth()
  const { data: entry, isLoading } = useEntry(id)
  const { data: profiles } = useProfiles()
  const { children } = useSelectedChild()
  const toggleLike = useToggleLike(userId ?? '')
  const addComment = useAddComment(userId ?? '')
  const deleteComment = useDeleteComment()
  const deleteEntry = useDeleteEntry()
  const [commentText, setCommentText] = useState('')

  if (isLoading || !entry) {
    return <div className="p-5 text-sm text-muted-foreground">불러오는 중…</div>
  }

  const liked = entry.likedBy.includes(userId ?? '')
  const isMyEntry = entry.author_id === userId
  const authorOf = (authorId: string) =>
    profiles?.find((p) => p.id === authorId)?.display_name ?? ''

  function handleSubmitComment() {
    if (!commentText.trim() || !id) return
    addComment.mutate({ entryId: id, content: commentText })
    setCommentText('')
  }

  function handleDeleteEntry() {
    if (!id) return
    // 먼저 피드로 이동해 이 페이지의 useEntry 구독을 끊은 뒤 삭제를 진행한다.
    // 순서를 반대로 하면(삭제 완료 후 이동) 훅의 onSuccess가 캐시를 정리하는 시점에
    // 이 페이지가 아직 마운트돼 있어 삭제된 엔트리를 재조회하다 404/406이 난다.
    navigate('/', { replace: true })
    deleteEntry.mutate(id)
  }

  return (
    <div className="min-h-full pt-safe">
      <header className="flex items-center gap-2 border-b border-border p-4">
        <button onClick={goHome} aria-label="뒤로">
          <ChevronLeft className="size-5" />
        </button>
        <span className="font-hand text-lg font-medium">
          {entry.authorName} · {format(new Date(entry.entry_date), 'M월 d일')}
        </span>
        {children.length > 1 && entry.child_id && (
          <Badge variant="outline">
            {children.find((c) => c.id === entry.child_id)?.name}
          </Badge>
        )}
        {isMyEntry && (
          <div className="ml-auto flex items-center gap-3">
            <AppLink to={`/write?date=${entry.entry_date}`} className="text-muted-foreground" aria-label="일기 수정">
              <Pencil className="size-5" />
            </AppLink>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-muted-foreground" aria-label="일기 삭제">
                  <Trash2 className="size-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>일기를 삭제할까요?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  삭제하면 사진·댓글·좋아요도 함께 사라지며 되돌릴 수 없어요.
                </p>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">취소</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteEntry}
                    disabled={deleteEntry.isPending}
                  >
                    삭제
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </header>

      {entry.photos.length > 0 && (
        <div className="polaroid polaroid-tilt-right tape m-4 mb-0">
          <EntryPhotos photos={entry.photos} />
        </div>
      )}

      <div className="p-5">
        <p className="paper-lines whitespace-pre-wrap px-1 py-1 font-hand text-lg leading-[1.6rem] text-foreground">
          {entry.content}
        </p>

        <button
          type="button"
          onClick={() => id && toggleLike.mutate({ entryId: id, like: !liked })}
          className={cn(
            'sticker mt-4 flex items-center gap-1.5 px-3 py-1.5 text-sm',
            liked
              ? 'border-primary bg-sticker-pink text-sticker-pink-foreground'
              : 'border-border text-muted-foreground',
          )}
        >
          <Heart className={cn('size-5', liked && 'fill-primary')} />
          좋아요 {entry.likedBy.length}
        </button>

        <div className="mt-6 space-y-3 font-hand">
          {entry.comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2 text-base">
              <div className="flex-1">
                <span className="font-medium text-foreground">{authorOf(comment.author_id)}</span>{' '}
                <span className="text-foreground">{comment.content}</span>
              </div>
              {comment.author_id === userId && id && (
                <button
                  type="button"
                  aria-label="댓글 삭제"
                  className="mt-0.5 text-muted-foreground"
                  onClick={() => deleteComment.mutate({ commentId: comment.id, entryId: id })}
                >
                  <X className="size-4" />
                </button>
              )}
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
