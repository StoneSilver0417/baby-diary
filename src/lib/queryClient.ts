import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

export const queryKeys = {
  profile: (id: string) => ['profile', id] as const,
  children: ['children'] as const,
  household: ['household'] as const,
  feed: ['diary', 'list'] as const,
  entry: (id: string) => ['diary', 'detail', id] as const,
  photoUrl: (path: string) => ['photoUrl', path] as const,
  invest: {
    trades: (childId: string) => ['invest', 'trades', childId] as const,
    dividends: (childId: string) => ['invest', 'dividends', childId] as const,
    notes: ['invest', 'notes'] as const,
    prices: ['invest', 'prices'] as const,
  },
  growth: {
    records: (childId: string) => ['growth', 'records', childId] as const,
    milestones: (childId: string) => ['growth', 'milestones', childId] as const,
  },
}
