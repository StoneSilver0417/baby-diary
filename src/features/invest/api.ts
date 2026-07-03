import { supabase, useMock } from '@/lib/supabase'
import { mockState } from '@/lib/mockDb'
import type { Dividend, InvestNote, StockPrice, Trade } from '@/types/database'

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

export async function getDividends(): Promise<Dividend[]> {
  if (useMock) {
    await delay()
    return [...mockState.dividends]
  }
  const { data, error } = await supabase.from('dividends').select('*').order('dividend_date')
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

export async function getPrices(): Promise<StockPrice[]> {
  if (useMock) {
    await delay()
    return [...mockState.prices]
  }
  const { data, error } = await supabase.from('stock_prices').select('*')
  if (error) throw error
  return data as StockPrice[]
}

export async function upsertPrice(stockName: string, currentPrice: number): Promise<void> {
  if (useMock) {
    await delay(150)
    const existing = mockState.prices.find((p) => p.stock_name === stockName)
    const now = new Date().toISOString()
    if (existing) {
      existing.current_price = currentPrice
      existing.updated_at = now
    } else {
      mockState.prices.push({ stock_name: stockName, current_price: currentPrice, updated_at: now })
    }
    return
  }
  const { error } = await supabase
    .from('stock_prices')
    .upsert(
      { stock_name: stockName, current_price: currentPrice, updated_at: new Date().toISOString() },
      { onConflict: 'stock_name' },
    )
  if (error) throw error
}
