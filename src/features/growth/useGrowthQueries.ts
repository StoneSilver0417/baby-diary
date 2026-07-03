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

export function useGrowthRecords() {
  return useQuery({ queryKey: queryKeys.growth.records, queryFn: getGrowthRecords })
}

export function useMilestones() {
  return useQuery({ queryKey: queryKeys.growth.milestones, queryFn: getMilestones })
}

export function useUpsertGrowthRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: upsertGrowthRecord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.growth.records }),
  })
}

export function useDeleteGrowthRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteGrowthRecord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.growth.records }),
  })
}

export function useAddMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addMilestone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.growth.milestones }),
  })
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMilestone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.growth.milestones }),
  })
}
