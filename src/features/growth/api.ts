import { supabase, useMock } from '@/lib/supabase'
import { mockState } from '@/lib/mockDb'
import type { GrowthRecord, Milestone } from '@/types/database'

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

export async function getGrowthRecords(): Promise<GrowthRecord[]> {
  if (useMock) {
    await delay()
    return [...mockState.growthRecords].sort((a, b) => a.record_date.localeCompare(b.record_date))
  }
  const { data, error } = await supabase.from('growth_records').select('*').order('record_date')
  if (error) throw error
  return data as GrowthRecord[]
}

type GrowthInput = {
  householdId: string
  childId: string
  recordDate: string
  heightCm: number | null
  weightKg: number | null
  memo: string | null
}

export async function upsertGrowthRecord(input: GrowthInput): Promise<void> {
  if (useMock) {
    await delay(200)
    const existing = mockState.growthRecords.find(
      (r) => r.child_id === input.childId && r.record_date === input.recordDate,
    )
    if (existing) {
      existing.height_cm = input.heightCm
      existing.weight_kg = input.weightKg
      existing.memo = input.memo
    } else {
      mockState.growthRecords.push({
        id: crypto.randomUUID(),
        household_id: input.householdId,
        child_id: input.childId,
        record_date: input.recordDate,
        height_cm: input.heightCm,
        weight_kg: input.weightKg,
        memo: input.memo,
      })
    }
    return
  }
  const { error } = await supabase.from('growth_records').upsert(
    {
      household_id: input.householdId,
      child_id: input.childId,
      record_date: input.recordDate,
      height_cm: input.heightCm,
      weight_kg: input.weightKg,
      memo: input.memo,
    },
    { onConflict: 'child_id,record_date' },
  )
  if (error) throw error
}

export async function deleteGrowthRecord(id: string): Promise<void> {
  if (useMock) {
    await delay(100)
    const idx = mockState.growthRecords.findIndex((r) => r.id === id)
    if (idx >= 0) mockState.growthRecords.splice(idx, 1)
    return
  }
  const { error } = await supabase.from('growth_records').delete().eq('id', id)
  if (error) throw error
}

export async function getMilestones(): Promise<Milestone[]> {
  if (useMock) {
    await delay()
    return [...mockState.milestones].sort((a, b) =>
      b.milestone_date.localeCompare(a.milestone_date),
    )
  }
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .order('milestone_date', { ascending: false })
  if (error) throw error
  return data as Milestone[]
}

type MilestoneInput = {
  householdId: string
  childId: string
  milestoneDate: string
  title: string
  memo: string | null
}

export async function addMilestone(input: MilestoneInput): Promise<void> {
  if (useMock) {
    await delay(200)
    mockState.milestones.push({
      id: crypto.randomUUID(),
      household_id: input.householdId,
      child_id: input.childId,
      milestone_date: input.milestoneDate,
      title: input.title,
      memo: input.memo,
      created_at: new Date().toISOString(),
    })
    return
  }
  const { error } = await supabase.from('milestones').insert({
    household_id: input.householdId,
    child_id: input.childId,
    milestone_date: input.milestoneDate,
    title: input.title,
    memo: input.memo,
  })
  if (error) throw error
}

export async function deleteMilestone(id: string): Promise<void> {
  if (useMock) {
    await delay(100)
    const idx = mockState.milestones.findIndex((m) => m.id === id)
    if (idx >= 0) mockState.milestones.splice(idx, 1)
    return
  }
  const { error } = await supabase.from('milestones').delete().eq('id', id)
  if (error) throw error
}
