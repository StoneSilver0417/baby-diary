import { supabase, useMock } from '@/lib/supabase'
import { mockState } from '@/lib/mockDb'
import type { Dividend, InvestNote, StockPrice, Trade } from '@/types/database'

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

export async function getTrades(childId: string): Promise<Trade[]> {
  if (useMock) {
    await delay()
    return mockState.trades.filter((t) => t.child_id === childId)
  }
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('child_id', childId)
    .order('trade_date')
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

export async function deleteTrade(id: string): Promise<void> {
  if (useMock) {
    await delay(100)
    const idx = mockState.trades.findIndex((t) => t.id === id)
    if (idx >= 0) mockState.trades.splice(idx, 1)
    return
  }
  const { error } = await supabase.from('trades').delete().eq('id', id)
  if (error) throw error
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

export async function deleteNote(id: string): Promise<void> {
  if (useMock) {
    await delay(100)
    const idx = mockState.notes.findIndex((n) => n.id === id)
    if (idx >= 0) mockState.notes.splice(idx, 1)
    return
  }
  const { error } = await supabase.from('invest_notes').delete().eq('id', id)
  if (error) throw error
}

export async function getDividends(childId: string): Promise<Dividend[]> {
  if (useMock) {
    await delay()
    return mockState.dividends.filter((d) => d.child_id === childId)
  }
  const { data, error } = await supabase
    .from('dividends')
    .select('*')
    .eq('child_id', childId)
    .order('dividend_date')
  if (error) throw error
  return data as Dividend[]
}

export async function addDividend(input: Omit<Dividend, 'id'>): Promise<Dividend> {
  if (useMock) {
    await delay(200)
    const dividend: Dividend = { ...input, id: crypto.randomUUID() }
    mockState.dividends.push(dividend)
    return dividend
  }
  const { data, error } = await supabase.from('dividends').insert(input).select().single()
  if (error) throw error
  return data as Dividend
}

export async function deleteDividend(id: string): Promise<void> {
  if (useMock) {
    await delay(100)
    const idx = mockState.dividends.findIndex((d) => d.id === id)
    if (idx >= 0) mockState.dividends.splice(idx, 1)
    return
  }
  const { error } = await supabase.from('dividends').delete().eq('id', id)
  if (error) throw error
}

export async function getPrices(): Promise<StockPrice[]> {
  if (useMock) {
    await delay()
    return [...mockState.prices]
  }
  const { data, error } = await supabase.from('stock_prices').select('*')
  if (error) throw error
  return data as StockPrice[]
}

export async function upsertPrice(
  householdId: string,
  stockName: string,
  currentPrice: number,
): Promise<void> {
  if (useMock) {
    await delay(150)
    const existing = mockState.prices.find((p) => p.stock_name === stockName)
    const now = new Date().toISOString()
    if (existing) {
      existing.current_price = currentPrice
      existing.updated_at = now
    } else {
      mockState.prices.push({
        household_id: householdId,
        stock_name: stockName,
        current_price: currentPrice,
        updated_at: now,
      })
    }
    return
  }
  const { error } = await supabase
    .from('stock_prices')
    .upsert(
      {
        household_id: householdId,
        stock_name: stockName,
        current_price: currentPrice,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'household_id,stock_name' },
    )
  if (error) throw error
}
