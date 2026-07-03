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
  child: ['child'] as const,
  feed: ['diary', 'list'] as const,
  entry: (id: string) => ['diary', 'detail', id] as const,
  photoUrl: (path: string) => ['photoUrl', path] as const,
  invest: {
    timeline: ['invest', 'timeline'] as const,
  },
}
