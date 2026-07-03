import { useQuery, useQueries } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { getChild, getEntry, getFeed, getProfiles, getSignedPhotoUrl } from './api'

export function useChild() {
  return useQuery({ queryKey: queryKeys.child, queryFn: getChild })
}

export function useProfiles() {
  return useQuery({ queryKey: ['profiles'], queryFn: getProfiles })
}

export function useFeed() {
  return useQuery({ queryKey: queryKeys.feed, queryFn: getFeed })
}

export function useEntry(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.entry(id ?? ''),
    queryFn: () => getEntry(id!),
    enabled: !!id,
  })
}

export function usePhotoUrls(paths: string[]) {
  return useQueries({
    queries: paths.map((path) => ({
      queryKey: queryKeys.photoUrl(path),
      queryFn: () => getSignedPhotoUrl(path),
      staleTime: 6 * 24 * 60 * 60 * 1000,
      gcTime: 7 * 24 * 60 * 60 * 1000,
    })),
  })
}
