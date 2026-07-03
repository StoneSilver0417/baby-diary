import { supabase, useMock } from '@/lib/supabase'
import { mockState } from '@/lib/mockDb'
import { compressImage } from '@/lib/image'
import type { Child, Comment, DiaryEntry, Profile } from '@/types/database'

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

export async function getChild(): Promise<Child> {
  if (useMock) {
    await delay()
    return mockState.child
  }
  const { data, error } = await supabase.from('children').select('*').limit(1).single()
  if (error) throw error
  return data as Child
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
    .select('*, profiles(display_name), diary_photos(*), comments(*), likes(author_id)')
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
    .select('*, profiles(display_name), diary_photos(*), comments(*), likes(author_id)')
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
    .select('*, profiles(display_name), diary_photos(*), comments(*), likes(author_id)')
    .eq('author_id', authorId)
    .eq('entry_date', date)
    .maybeSingle()
  if (error) throw error
  return data ? mapRawEntry(data) : undefined
}

type SaveEntryInput = {
  entryId?: string
  authorId: string
  authorName: string
  date: string
  content: string
  keepPhotoIds: string[]
  newPhotos: Blob[]
}

export async function saveEntry(input: SaveEntryInput): Promise<string> {
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
      existing.photos = [...keptPhotos, ...newPhotoObjs]
      newPhotoObjs.forEach((p) => (p.entry_id = existing.id))
      return existing.id
    }

    const id = crypto.randomUUID()
    newPhotoObjs.forEach((p) => (p.entry_id = id))
    mockState.entries.push({
      id,
      author_id: input.authorId,
      entry_date: input.date,
      content: input.content,
      created_at: new Date().toISOString(),
      photos: newPhotoObjs,
      comments: [],
      likedBy: [],
      authorName: input.authorName,
    })
    return id
  }

  // 1. 텍스트 먼저 upsert — 사진 실패해도 글은 보존
  const { data: entryRow, error: upsertError } = await supabase
    .from('diary_entries')
    .upsert(
      {
        id: input.entryId,
        author_id: input.authorId,
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

  // 3. 새 사진 업로드 (실패 시 업로드분 롤백)
  const uploadedPaths: string[] = []
  try {
    const startOrder = input.keepPhotoIds.length
    for (let i = 0; i < input.newPhotos.length; i++) {
      const compressed = await compressImage(input.newPhotos[i])
      const path = `${input.authorId}/${entryId}/${crypto.randomUUID()}.webp`
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, compressed)
      if (uploadError) throw uploadError
      uploadedPaths.push(path)
      const { error: insertError } = await supabase
        .from('diary_photos')
        .insert({ entry_id: entryId, storage_path: path, sort_order: startOrder + i })
      if (insertError) throw insertError
    }
  } catch (err) {
    if (uploadedPaths.length > 0) await supabase.storage.from('photos').remove(uploadedPaths)
    throw err
  }

  return entryId
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
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, 60 * 60 * 24 * 7)
  if (error) throw error
  return data.signedUrl
}

// biome-ignore lint: 실제 Supabase 조인 결과를 DiaryEntry 형태로 정규화
function mapRawEntry(raw: any): DiaryEntry {
  return {
    id: raw.id,
    author_id: raw.author_id,
    entry_date: raw.entry_date,
    content: raw.content,
    created_at: raw.created_at,
    photos: raw.diary_photos ?? [],
    comments: raw.comments ?? [],
    likedBy: (raw.likes ?? []).map((l: { author_id: string }) => l.author_id),
    authorName: raw.profiles?.display_name ?? '',
  }
}
