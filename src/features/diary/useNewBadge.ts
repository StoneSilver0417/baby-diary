import { useEffect } from 'react'
import type { DiaryEntry, Profile } from '@/types/database'
import { updateLastSeen } from './api'

/**
 * "새 글" 뱃지: profiles.last_seen_diary_at을 진입 시점 기준선으로 고정한다.
 * FeedPage는 탭 이동마다 마운트/언마운트되므로 baseline을 컴포넌트 밖(모듈 스코프)에
 * 두어야 이번 앱 실행(=페이지 전체 새로고침 전까지) 동안 뱃지가 유지된다.
 * 화면에 피드가 표시된 직후 서버 값만 갱신해 다음 실행부터는 사라지게 한다.
 */
let baseline: string | null = null
let hasMarkedSeen = false

export function useNewBadge(myProfile: Profile | undefined, feed: DiaryEntry[] | undefined) {
  if (baseline === null && myProfile) {
    baseline = myProfile.last_seen_diary_at ?? '1970-01-01T00:00:00.000Z'
  }

  useEffect(() => {
    if (!myProfile || !feed || feed.length === 0 || hasMarkedSeen) return
    hasMarkedSeen = true
    void updateLastSeen(myProfile.id, new Date().toISOString())
  }, [myProfile, feed])

  function isNew(entry: DiaryEntry) {
    if (!baseline || !myProfile) return false
    return entry.author_id !== myProfile.id && entry.created_at > baseline
  }

  return { isNew }
}
