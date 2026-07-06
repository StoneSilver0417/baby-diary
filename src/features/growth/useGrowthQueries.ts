import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import {
  addMilestone,
  deleteGrowthRecord,
  deleteMilestone,
  getGrowthRecords,
  getMilestones,
  upsertGrowthRecord,
} from './api'

export function useGrowthRecords(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.growth.records(childId ?? ''),
    queryFn: () => getGrowthRecords(childId!),
    enabled: !!childId,
  })
}

export function useMilestones(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.growth.milestones(childId ?? ''),
    queryFn: () => getMilestones(childId!),
    enabled: !!childId,
  })
}

export function useUpsertGrowthRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: upsertGrowthRecord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['growth', 'records'] }),
  })
}

export function useDeleteGrowthRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteGrowthRecord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['growth', 'records'] }),
  })
}

export function useAddMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addMilestone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['growth', 'milestones'] }),
  })
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMilestone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['growth', 'milestones'] }),
  })
}
