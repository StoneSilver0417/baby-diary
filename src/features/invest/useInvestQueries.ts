import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { addNote, addTrade, getNotes, getTrades } from './api'

export function useTrades() {
  return useQuery({ queryKey: [...queryKeys.invest.timeline, 'trades'], queryFn: getTrades })
}

export function useNotes() {
  return useQuery({ queryKey: [...queryKeys.invest.timeline, 'notes'], queryFn: getNotes })
}

export function useAddTrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addTrade,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invest.timeline }),
  })
}

export function useAddNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invest.timeline }),
  })
}
