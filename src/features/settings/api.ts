import { supabase, useMock } from '@/lib/supabase'
import { mockState } from '@/lib/mockDb'
import type { Child, Profile } from '@/types/database'

export async function updateChild(childId: string, patch: Partial<Pick<Child, 'name' | 'birth_date'>>) {
  if (useMock) {
    Object.assign(mockState.child, patch)
    return
  }
  const { error } = await supabase.from('children').update(patch).eq('id', childId)
  if (error) throw error
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
