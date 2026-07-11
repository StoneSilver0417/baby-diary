import { supabase, useMock } from '@/lib/supabase'
import { mockState } from '@/lib/mockDb'
import { compressImage } from '@/lib/image'
import type { Child, Comment, DiaryEntry, DiaryPhoto, Household, Profile } from '@/types/database'

/** diary_entries에 profiles·diary_photos·comments·likes를 임베드한 조인 응답 행 */
type RawEntryRow = {
  id: string
  household_id: string
  author_id: string
  child_id: string | null
  entry_date: string
  content: string
  created_at: string
  profiles: { display_name: string } | null
  diary_photos: DiaryPhoto[] | null
  comments: Comment[] | null
  likes: { author_id: string }[] | null
}

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

export async function getChildren(): Promise<Child[]> {
  if (useMock) {
    await delay()
    return [...mockState.children].sort((a, b) => a.birth_date.localeCompare(b.birth_date))
  }
  const { data, error } = await supabase.from('children').select('*').order('birth_date')
  if (error) throw error
  return data as Child[]
}

export async function getHousehold(): Promise<Household> {
  if (useMock) {
    await delay()
    return mockState.household
  }
  const { data, error } = await supabase.from('households').select('*').limit(1).single()
  if (error) throw error
  return data as Household
}

export async function getProfiles(): Promise<Profile[]> {
  if (useMock) {
    await delay()
    return mockState.profiles
  }
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) throw error
  return data as Profile[]
}

export async function getFeed(): Promise<DiaryEntry[]> {
  if (useMock) {
    await delay()
    return [...mockState.entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date))
  }
  const { data, error } = await supabase
    .from('diary_entries')
    .select(
      '*, profiles!diary_entries_author_id_fkey(display_name), diary_photos(*), comments(*), likes(author_id)',
    )
    .order('entry_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRawEntry)
}

export async function getEntry(id: string): Promise<DiaryEntry | undefined> {
  if (useMock) {
    await delay()
    return mockState.entries.find((e) => e.id === id)
  }
  const { data, error } = await supabase
    .from('diary_entries')
    .select(
      '*, profiles!diary_entries_author_id_fkey(display_name), diary_photos(*), comments(*), likes(author_id)',
    )
    .eq('id', id)
    .single()
  if (error) throw error
  return mapRawEntry(data)
}

/** 같은 작성자가 같은 날 이미 쓴 글이 있으면 수정 모드 진입에 사용 */
export async function getEntryByDate(
  authorId: string,
  date: string,
): Promise<DiaryEntry | undefined> {
  if (useMock) {
    await delay()
    return mockState.entries.find((e) => e.author_id === authorId && e.entry_date === date)
  }
  const { data, error } = await supabase
    .from('diary_entries')
    .select(
      '*, profiles!diary_entries_author_id_fkey(display_name), diary_photos(*), comments(*), likes(author_id)',
    )
    .eq('author_id', authorId)
    .eq('entry_date', date)
    .maybeSingle()
  if (error) throw error
  return data ? mapRawEntry(data) : undefined
}

type SaveEntryInput = {
  entryId?: string
  householdId: string
  authorId: string
  authorName: string
  /** null = "모두"(가족 전체 공용 글) */
  childId: string | null
  date: string
  content: string
  keepPhotoIds: string[]
  newPhotos: Blob[]
}

export type SaveEntryResult = {
  entryId: string
  /** 형식·용량 문제로 첨부하지 못하고 건너뛴 사진 수(0이면 전부 성공) */
  failedPhotos: number
}

export async function saveEntry(input: SaveEntryInput): Promise<SaveEntryResult> {
  if (useMock) {
    await delay(300)
    const existing = mockState.entries.find((e) => e.id === input.entryId)
    const keptPhotos = existing?.photos.filter((p) => input.keepPhotoIds.includes(p.id)) ?? []
    const newPhotoObjs = input.newPhotos.map((blob, i) => ({
      id: crypto.randomUUID(),
      entry_id: input.entryId ?? '',
      storage_path: URL.createObjectURL(blob),
      sort_order: keptPhotos.length + i,
    }))

    if (existing) {
      existing.content = input.content
      existing.child_id = input.childId
      existing.photos = [...keptPhotos, ...newPhotoObjs]
      newPhotoObjs.forEach((p) => (p.entry_id = existing.id))
      return { entryId: existing.id, failedPhotos: 0 }
    }

    const id = crypto.randomUUID()
    newPhotoObjs.forEach((p) => (p.entry_id = id))
    mockState.entries.push({
      id,
      household_id: input.householdId,
      author_id: input.authorId,
      child_id: input.childId,
      entry_date: input.date,
      content: input.content,
      created_at: new Date().toISOString(),
      photos: newPhotoObjs,
      comments: [],
      likedBy: [],
      authorName: input.authorName,
    })
    return { entryId: id, failedPhotos: 0 }
  }

  // 1. 텍스트 먼저 upsert — 사진 실패해도 글은 보존
  const { data: entryRow, error: upsertError } = await supabase
    .from('diary_entries')
    .upsert(
      {
        id: input.entryId,
        household_id: input.householdId,
        author_id: input.authorId,
        child_id: input.childId,
        entry_date: input.date,
        content: input.content,
      },
      { onConflict: 'author_id,entry_date' },
    )
    .select()
    .single()
  if (upsertError) throw upsertError
  const entryId = entryRow.id as string

  // 2. 기존 사진 중 제거된 것 삭제
  const { data: existingPhotos } = await supabase
    .from('diary_photos')
    .select('*')
    .eq('entry_id', entryId)
  const toDelete = (existingPhotos ?? []).filter((p) => !input.keepPhotoIds.includes(p.id))
  if (toDelete.length > 0) {
    await supabase.storage.from('photos').remove(toDelete.map((p) => p.storage_path))
    await supabase.from('diary_photos').delete().in('id', toDelete.map((p) => p.id))
  }

  // 3. 새 사진 업로드. 사진마다 독립적으로 처리해, 한 장이 실패해도(형식·용량 등)
  //    나머지 사진과 글은 그대로 저장되게 한다. sort_order는 성공한 것만 순번을 매긴다.
  let failedPhotos = 0
  let order = input.keepPhotoIds.length
  for (const photo of input.newPhotos) {
    try {
      const compressed = await compressImage(photo)
      const ext = compressed.type === 'image/webp' ? 'webp' : 'jpg'
      // 경로 첫 폴더 = household_id (storage RLS가 이 폴더로 격리)
      const path = `${input.householdId}/${entryId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, compressed, { contentType: compressed.type })
      if (uploadError) throw uploadError
      const { error: insertError } = await supabase
        .from('diary_photos')
        .insert({ entry_id: entryId, storage_path: path, sort_order: order })
      if (insertError) {
        await supabase.storage.from('photos').remove([path])
        throw insertError
      }
      order++
    } catch (err) {
      console.error('사진 업로드 실패 — 이 사진은 건너뜁니다:', err)
      failedPhotos++
    }
  }

  return { entryId, failedPhotos }
}

export async function toggleLike(entryId: string, userId: string, like: boolean): Promise<void> {
  if (useMock) {
    await delay(80)
    const entry = mockState.entries.find((e) => e.id === entryId)
    if (!entry) return
    entry.likedBy = like
      ? [...new Set([...entry.likedBy, userId])]
      : entry.likedBy.filter((id) => id !== userId)
    return
  }
  if (like) {
    const { error } = await supabase.from('likes').upsert({ entry_id: entryId, author_id: userId })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ entry_id: entryId, author_id: userId })
    if (error) throw error
  }
}

export async function addComment(
  entryId: string,
  authorId: string,
  content: string,
): Promise<Comment> {
  if (useMock) {
    await delay(120)
    const entry = mockState.entries.find((e) => e.id === entryId)
    const comment: Comment = {
      id: crypto.randomUUID(),
      entry_id: entryId,
      author_id: authorId,
      content,
      created_at: new Date().toISOString(),
    }
    entry?.comments.push(comment)
    return comment
  }
  const { data, error } = await supabase
    .from('comments')
    .insert({ entry_id: entryId, author_id: authorId, content })
    .select()
    .single()
  if (error) throw error
  return data as Comment
}

export async function deleteEntry(entryId: string): Promise<void> {
  if (useMock) {
    await delay(150)
    const idx = mockState.entries.findIndex((e) => e.id === entryId)
    if (idx >= 0) mockState.entries.splice(idx, 1)
    return
  }
  // 사진 파일을 먼저 정리한 뒤 row 삭제 (diary_photos/comments/likes는 FK cascade)
  const { data: photos } = await supabase
    .from('diary_photos')
    .select('storage_path')
    .eq('entry_id', entryId)
  if (photos && photos.length > 0) {
    await supabase.storage.from('photos').remove(photos.map((p) => p.storage_path))
  }
  const { error } = await supabase.from('diary_entries').delete().eq('id', entryId)
  if (error) throw error
}

export async function deleteComment(commentId: string, entryId: string): Promise<void> {
  if (useMock) {
    await delay(80)
    const entry = mockState.entries.find((e) => e.id === entryId)
    if (entry) entry.comments = entry.comments.filter((c) => c.id !== commentId)
    return
  }
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw error
}

export async function updateComment(
  commentId: string,
  entryId: string,
  content: string,
): Promise<void> {
  if (useMock) {
    await delay(80)
    const entry = mockState.entries.find((e) => e.id === entryId)
    const comment = entry?.comments.find((c) => c.id === commentId)
    if (comment) comment.content = content
    return
  }
  const { error } = await supabase.from('comments').update({ content }).eq('id', commentId)
  if (error) throw error
}

export async function updateLastSeen(userId: string, at: string): Promise<void> {
  if (useMock) {
    const profile = mockState.profiles.find((p) => p.id === userId)
    if (profile) profile.last_seen_diary_at = at
    return
  }
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen_diary_at: at })
    .eq('id', userId)
  if (error) throw error
}

export async function getSignedPhotoUrl(path: string): Promise<string> {
  if (useMock) return path // mock에서는 object URL을 그대로 storage_path에 저장
  // TTL 24시간 — URL이 외부로 새어도 유효 기간을 하루로 제한 (usePhotoUrls 캐시와 연동)
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, 60 * 60 * 24)
  if (error) throw error
  return data.signedUrl
}

/** 실제 Supabase 조인 결과를 DiaryEntry 형태로 정규화 */
function mapRawEntry(raw: RawEntryRow): DiaryEntry {
  return {
    id: raw.id,
    household_id: raw.household_id,
    author_id: raw.author_id,
    child_id: raw.child_id,
    entry_date: raw.entry_date,
    content: raw.content,
    created_at: raw.created_at,
    photos: raw.diary_photos ?? [],
    comments: raw.comments ?? [],
    likedBy: (raw.likes ?? []).map((l) => l.author_id),
    authorName: raw.profiles?.display_name ?? '',
  }
}
