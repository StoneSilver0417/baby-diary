import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import {
  addDividend,
  addNote,
  addTrade,
  getDividends,
  getNotes,
  getPrices,
  getTrades,
  upsertPrice,
} from './api'

export function useTrades() {
  return useQuery({ queryKey: [...queryKeys.invest.timeline, 'trades'], queryFn: getTrades })
}

export function useNotes() {
  return useQuery({ queryKey: [...queryKeys.invest.timeline, 'notes'], queryFn: getNotes })
}

export function useDividends() {
  return useQuery({ queryKey: [...queryKeys.invest.timeline, 'dividends'], queryFn: getDividends })
}

export function usePrices() {
  return useQuery({ queryKey: queryKeys.invest.prices, queryFn: getPrices })
}

export function useAddDividend() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addDividend,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invest.timeline }),
  })
}

export function useUpsertPrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stockName, price }: { stockName: string; price: number }) =>
      upsertPrice(stockName, price),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invest.prices }),
  })
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
