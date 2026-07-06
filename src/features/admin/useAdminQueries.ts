import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { checkIsAdmin, getAdminStats, getAllInquiries, replyInquiry } from './api'

export function useIsAdmin() {
  return useQuery({ queryKey: ['isAdmin'], queryFn: checkIsAdmin })
}

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats })
}

export function useAllInquiries() {
  return useQuery({ queryKey: ['admin', 'inquiries'], queryFn: getAllInquiries })
}

export function useReplyInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => replyInquiry(id, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiries'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
