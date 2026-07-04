import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/queryClient'
import type { DiaryEntry } from '@/types/database'
import { addComment, deleteComment, deleteEntry, saveEntry, toggleLike } from './api'

export function useSaveEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary'] })
    },
    onError: () => toast.error('저장에 실패했습니다. 다시 시도해 주세요.'),
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEntry,
    onSuccess: (_data, entryId) => {
      // 상세 쿼리는 invalidate(재조회) 대신 즉시 제거 — 삭제된 행을 다시 조회하면
      // 404/406으로 실패하는 레이스가 생긴다 (탐색으로 언마운트되기 전에 재조회가 먼저 발생).
      queryClient.removeQueries({ queryKey: queryKeys.entry(entryId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.feed })
      toast.success('일기를 삭제했어요.')
    },
    onError: () => toast.error('삭제에 실패했습니다. 다시 시도해 주세요.'),
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, entryId }: { commentId: string; entryId: string }) =>
      deleteComment(commentId, entryId),
    onMutate: async ({ commentId, entryId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.entry(entryId) })
      const prevEntry = queryClient.getQueryData<DiaryEntry>(queryKeys.entry(entryId))
      queryClient.setQueryData<DiaryEntry>(queryKeys.entry(entryId), (old) =>
        old ? { ...old, comments: old.comments.filter((c) => c.id !== commentId) } : old,
      )
      return { prevEntry, entryId }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      queryClient.setQueryData(queryKeys.entry(ctx.entryId), ctx.prevEntry)
      toast.error('댓글 삭제에 실패했습니다.')
    },
    onSettled: (_data, _err, { entryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entry(entryId) })
    },
  })
}

export function useToggleLike(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, like }: { entryId: string; like: boolean }) =>
      toggleLike(entryId, userId, like),
    onMutate: async ({ entryId, like }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feed })
      await queryClient.cancelQueries({ queryKey: queryKeys.entry(entryId) })

      const prevFeed = queryClient.getQueryData<DiaryEntry[]>(queryKeys.feed)
      const prevEntry = queryClient.getQueryData<DiaryEntry>(queryKeys.entry(entryId))

      const patch = (entry: DiaryEntry): DiaryEntry => ({
        ...entry,
        likedBy: like
          ? [...new Set([...entry.likedBy, userId])]
          : entry.likedBy.filter((id) => id !== userId),
      })

      queryClient.setQueryData<DiaryEntry[]>(queryKeys.feed, (old) =>
        old?.map((e) => (e.id === entryId ? patch(e) : e)),
      )
      queryClient.setQueryData<DiaryEntry>(queryKeys.entry(entryId), (old) =>
        old ? patch(old) : old,
      )

      return { prevFeed, prevEntry, entryId }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      queryClient.setQueryData(queryKeys.feed, ctx.prevFeed)
      queryClient.setQueryData(queryKeys.entry(ctx.entryId), ctx.prevEntry)
      toast.error('좋아요 처리에 실패했습니다.')
    },
    onSettled: (_data, _err, { entryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed })
      queryClient.invalidateQueries({ queryKey: queryKeys.entry(entryId) })
    },
  })
}

export function useAddComment(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, content }: { entryId: string; content: string }) =>
      addComment(entryId, userId, content),
    onMutate: async ({ entryId, content }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.entry(entryId) })
      const prevEntry = queryClient.getQueryData<DiaryEntry>(queryKeys.entry(entryId))

      queryClient.setQueryData<DiaryEntry>(queryKeys.entry(entryId), (old) =>
        old
          ? {
              ...old,
              comments: [
                ...old.comments,
                {
                  id: `pending-${crypto.randomUUID()}`,
                  entry_id: entryId,
                  author_id: userId,
                  content,
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : old,
      )

      return { prevEntry, entryId }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      queryClient.setQueryData(queryKeys.entry(ctx.entryId), ctx.prevEntry)
      toast.error('댓글 작성에 실패했습니다.')
    },
    onSettled: (_data, _err, { entryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entry(entryId) })
    },
  })
}
