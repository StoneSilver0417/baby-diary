import { useAuth } from '@/features/auth/AuthProvider'
import { useProfiles } from '@/features/diary/useDiaryQueries'
import type { Profile } from '@/types/database'

/** 현재 로그인 사용자의 프로필 (표시 이름·household 소속 등) */
export function useMyProfile(): Profile | undefined {
  const { userId } = useAuth()
  const { data: profiles } = useProfiles()
  return profiles?.find((p) => p.id === userId)
}

/** 현재 로그인 사용자가 속한 household id (쓰기 시 데이터 격리에 필요) */
export function useHouseholdId(): string | undefined {
  return useMyProfile()?.household_id
}
