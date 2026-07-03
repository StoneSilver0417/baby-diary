import { supabase, useMock } from '@/lib/supabase'
import { mockState } from '@/lib/mockDb'
import type { InvestNote, Trade } from '@/types/database'

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

export async function getTrades(): Promise<Trade[]> {
  if (useMock) {
    await delay()
    return [...mockState.trades]
  }
  const { data, error } = await supabase.from('trades').select('*').order('trade_date')
  if (error) throw error
  return data as Trade[]
}

export async function getNotes(): Promise<InvestNote[]> {
  if (useMock) {
    await delay()
    return [...mockState.notes]
  }
  const { data, error } = await supabase.from('invest_notes').select('*').order('note_date')
  if (error) throw error
  return data as InvestNote[]
}

export async function addTrade(input: Omit<Trade, 'id'>): Promise<Trade> {
  if (useMock) {
    await delay(200)
    const trade: Trade = { ...input, id: crypto.randomUUID() }
    mockState.trades.push(trade)
    return trade
  }
  const { data, error } = await supabase.from('trades').insert(input).select().single()
  if (error) throw error
  return data as Trade
}

export async function addNote(input: Omit<InvestNote, 'id'>): Promise<InvestNote> {
  if (useMock) {
    await delay(200)
    const note: InvestNote = { ...input, id: crypto.randomUUID() }
    mockState.notes.push(note)
    return note
  }
  const { data, error } = await supabase.from('invest_notes').insert(input).select().single()
  if (error) throw error
  return data as InvestNote
}
