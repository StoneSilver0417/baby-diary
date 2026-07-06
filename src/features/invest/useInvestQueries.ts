import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import {
  addDividend,
  addNote,
  addTrade,
  deleteDividend,
  deleteNote,
  deleteTrade,
  getDividends,
  getNotes,
  getPrices,
  getTrades,
  upsertPrice,
} from './api'

export function useTrades(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invest.trades(childId ?? ''),
    queryFn: () => getTrades(childId!),
    enabled: !!childId,
  })
}

export function useNotes() {
  return useQuery({ queryKey: queryKeys.invest.notes, queryFn: getNotes })
}

export function useDividends(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invest.dividends(childId ?? ''),
    queryFn: () => getDividends(childId!),
    enabled: !!childId,
  })
}

export function usePrices() {
  return useQuery({ queryKey: queryKeys.invest.prices, queryFn: getPrices })
}

export function useAddDividend() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addDividend,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invest', 'dividends'] }),
  })
}

export function useDeleteDividend() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDividend,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invest', 'dividends'] }),
  })
}

export function useUpsertPrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      householdId,
      stockName,
      price,
    }: {
      householdId: string
      stockName: string
      price: number
    }) => upsertPrice(householdId, stockName, price),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invest.prices }),
  })
}

export function useAddTrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addTrade,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invest', 'trades'] }),
  })
}

export function useDeleteTrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTrade,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invest', 'trades'] }),
  })
}

export function useAddNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invest.notes }),
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invest.notes }),
  })
}
