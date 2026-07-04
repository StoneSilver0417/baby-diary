import { useQuery, useQueries } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/features/auth/AuthProvider'
import { getChild, getEntry, getFeed, getProfiles, getSignedPhotoUrl } from './api'

export function useChild() {
  return useQuery({ queryKey: queryKeys.child, queryFn: getChild })
}

export function useProfiles() {
  return useQuery({ queryKey: ['profiles'], queryFn: getProfiles })
}

/** 현재 로그인 사용자가 속한 household id (쓰기 시 데이터 격리에 필요) */
export function useHouseholdId(): string | undefined {
  const { userId } = useAuth()
  const { data: profiles } = useProfiles()
  return profiles?.find((p) => p.id === userId)?.household_id
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
