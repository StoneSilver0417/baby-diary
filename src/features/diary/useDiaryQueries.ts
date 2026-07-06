import { useQuery, useQueries } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { getChildren, getEntry, getFeed, getHousehold, getProfiles, getSignedPhotoUrl } from './api'

export function useChildren() {
  return useQuery({ queryKey: queryKeys.children, queryFn: getChildren })
}

export function useHouseholdInfo() {
  return useQuery({ queryKey: queryKeys.household, queryFn: getHousehold })
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
      // 서명 URL TTL(24h)보다 짧게 유지해 만료된 URL을 캐시에서 내주지 않도록 함
      staleTime: 12 * 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    })),
  })
}
