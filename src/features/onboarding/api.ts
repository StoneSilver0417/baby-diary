import { supabase, useMock } from '@/lib/supabase'

type CreateHouseholdInput = {
  householdName: string
  displayName: string
  childName: string
  childBirth: string
}

export async function createHouseholdWithChild(input: CreateHouseholdInput): Promise<string> {
  if (useMock) throw new Error('모의 모드에서는 온보딩을 지원하지 않아요.')
  const { data, error } = await supabase.rpc('create_household_with_child', {
    p_household_name: input.householdName,
    p_display_name: input.displayName,
    p_child_name: input.childName,
    p_child_birth: input.childBirth,
  })
  if (error) throw error
  return data as string
}

export async function joinHousehold(code: string, displayName: string): Promise<string> {
  if (useMock) throw new Error('모의 모드에서는 온보딩을 지원하지 않아요.')
  const { data, error } = await supabase.rpc('join_household', {
    p_code: code,
    p_display_name: displayName,
  })
  if (error) throw error
  return data as string
}
