import { describe, it, expect } from 'vitest'
import { computeYearlySummary } from './summary'
import type { Trade, Dividend } from '@/types/database'

describe('computeYearlySummary', () => {
  it('Given trades and dividends across multiple years, When computed, Then it aggregates by year in descending order', () => {
    const trades: Trade[] = [
      {
        id: '1',
        household_id: 'h1',
        child_id: 'c1',
        trade_date: '2022-05-01',
        stock_name: 'AAPL',
        side: '매수',
        quantity: 10,
        unit_price: 150,
        memo: null,
      },
      {
        id: '2',
        household_id: 'h1',
        child_id: 'c1',
        trade_date: '2023-01-01',
        stock_name: 'AAPL',
        side: '매수',
        quantity: 5,
        unit_price: 160,
        memo: null,
      },
      {
        id: '3',
        household_id: 'h1',
        child_id: 'c1',
        trade_date: '2023-06-01',
        stock_name: 'AAPL',
        side: '매도',
        quantity: 5,
        unit_price: 170,
        memo: null,
      },
    ]

    const dividends: Dividend[] = [
      {
        id: '1',
        household_id: 'h1',
        child_id: 'c1',
        dividend_date: '2022-12-01',
        stock_name: 'AAPL',
        amount: 50,
        memo: null,
      },
      {
        id: '2',
        household_id: 'h1',
        child_id: 'c1',
        dividend_date: '2023-12-01',
        stock_name: 'AAPL',
        amount: 100,
        memo: null,
      },
    ]

    const result = computeYearlySummary(trades, dividends)

    expect(result).toHaveLength(2)
    
    // 2023 should be first (descending)
    expect(result[0].year).toBe('2023')
    expect(result[0].buyTotal).toBe(800) // 5 * 160
    expect(result[0].sellTotal).toBe(850) // 5 * 170
    expect(result[0].dividendTotal).toBe(100)

    // 2022 should be second
    expect(result[1].year).toBe('2022')
    expect(result[1].buyTotal).toBe(1500) // 10 * 150
    expect(result[1].sellTotal).toBe(0)
    expect(result[1].dividendTotal).toBe(50)
  })

  it('Given empty inputs, When computed, Then it returns empty array', () => {
    const result = computeYearlySummary([], [])
    expect(result).toHaveLength(0)
  })

  it('Given only dividends, When computed, Then it aggregates correctly', () => {
    const dividends: Dividend[] = [
      {
        id: '1',
        household_id: 'h1',
        child_id: 'c1',
        dividend_date: '2023-12-01',
        stock_name: 'AAPL',
        amount: 100,
        memo: null,
      },
    ]

    const result = computeYearlySummary([], dividends)
    expect(result).toHaveLength(1)
    expect(result[0].year).toBe('2023')
    expect(result[0].buyTotal).toBe(0)
    expect(result[0].sellTotal).toBe(0)
    expect(result[0].dividendTotal).toBe(100)
  })
})
