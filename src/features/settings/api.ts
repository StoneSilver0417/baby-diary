import { supabase, useMock } from '@/lib/supabase'
import { mockState } from '@/lib/mockDb'
import type { Child, Inquiry, Invite, Profile } from '@/types/database'

export async function updateChild(childId: string, patch: Partial<Pick<Child, 'name' | 'birth_date'>>) {
  if (useMock) {
    const child = mockState.children.find((c) => c.id === childId)
    if (child) Object.assign(child, patch)
    return
  }
  const { error } = await supabase.from('children').update(patch).eq('id', childId)
  if (error) throw error
}

export async function addChild(
  householdId: string,
  input: Pick<Child, 'name' | 'birth_date'>,
): Promise<Child> {
  if (useMock) {
    const child: Child = {
      id: crypto.randomUUID(),
      household_id: householdId,
      name: input.name,
      birth_date: input.birth_date,
    }
    mockState.children.push(child)
    return child
  }
  const { data, error } = await supabase
    .from('children')
    .insert({ household_id: householdId, name: input.name, birth_date: input.birth_date })
    .select()
    .single()
  if (error) throw error
  return data as Child
}

export async function createInvite(): Promise<Invite> {
  if (useMock) throw new Error('모의 모드에서는 초대를 지원하지 않아요.')
  const { data, error } = await supabase.rpc('create_invite')
  if (error) throw error
  return data as Invite
}

export async function createInquiry(authorId: string, content: string): Promise<Inquiry> {
  if (useMock) throw new Error('모의 모드에서는 문의를 지원하지 않아요.')
  const { data, error } = await supabase
    .from('inquiries')
    .insert({ author_id: authorId, content })
    .select()
    .single()
  if (error) throw error
  return data as Inquiry
}

export async function getMyInquiries(authorId: string): Promise<Inquiry[]> {
  if (useMock) return []
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Inquiry[]
}

export async function updateDisplayName(userId: string, displayName: string) {
  if (useMock) {
    const profile = mockState.profiles.find((p) => p.id === userId)
    if (profile) profile.display_name = displayName
    return
  }
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName } satisfies Partial<Profile>)
    .eq('id', userId)
  if (error) throw error
}
