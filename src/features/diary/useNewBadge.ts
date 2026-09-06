import { useEffect, useRef } from 'react'
import type { DiaryEntry, Profile } from '@/types/database'
import { updateLastSeen } from './api'

/**
 * "새 글" 뱃지: profiles.last_seen_diary_at을 진입 시점 기준선으로 고정한다.
 * FeedPage는 탭 이동마다 마운트/언마운트되므로 baselineRef/hasMarkedSeenRef 또는 module state를
 * Effect 및 Ref로 안전하게 다룬다.
 */
let globalBaseline: string | null = null
let globalHasMarkedSeen = false

export function useNewBadge(myProfile: Profile | undefined, feed: DiaryEntry[] | undefined) {
  const baselineRef = useRef<string | null>(globalBaseline)

  if (baselineRef.current === null && myProfile) {
    globalBaseline = myProfile.last_seen_diary_at ?? '1970-01-01T00:00:00.000Z'
    baselineRef.current = globalBaseline
  }

  useEffect(() => {
    if (!myProfile || !feed || feed.length === 0 || globalHasMarkedSeen) return
    globalHasMarkedSeen = true
    void updateLastSeen(myProfile.id, new Date().toISOString())
  }, [myProfile, feed])

  function isNew(entry: DiaryEntry) {
    const activeBaseline = baselineRef.current
    if (!activeBaseline || !myProfile) return false
    return entry.author_id !== myProfile.id && entry.created_at > activeBaseline
  }

  return { isNew }
}
