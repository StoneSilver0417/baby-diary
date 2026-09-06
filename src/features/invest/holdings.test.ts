import { describe, it, expect } from 'vitest'
import { computeHoldings, enrichHoldings } from './holdings'
import type { Trade, StockPrice } from '@/types/database'

describe('computeHoldings', () => {
  it('Given trades with buys and sells, When computed, Then it calculates correct quantity and principal', () => {
    const trades: Trade[] = [
      {
        id: '1',
        household_id: 'h1',
        child_id: 'c1',
        trade_date: '2023-01-01',
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
        trade_date: '2023-01-02',
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
        trade_date: '2023-01-03',
        stock_name: 'AAPL',
        side: '매도',
        quantity: 5,
        unit_price: 170,
        memo: null,
      },
    ]

    const result = computeHoldings(trades)
    
    expect(result).toHaveLength(1)
    expect(result[0].stockName).toBe('AAPL')
    expect(result[0].quantity).toBe(10) // 10 + 5 - 5
    // Total principal before sell: 10 * 150 + 5 * 160 = 1500 + 800 = 2300
    // Avg price before sell: 2300 / 15 = 153.333...
    // Sell 5 shares: principal reduced by 5 * 153.333... = 766.666...
    // Remaining principal: 2300 - 766.666... = 1533.333...
    // Math.round(1533.333...) = 1533
    expect(result[0].principal).toBe(1533)
    expect(result[0].avgUnitPrice).toBe(153) // Math.round(1533 / 10)
  })

  it('Given trades that result in 0 quantity, When computed, Then it excludes the stock', () => {
    const trades: Trade[] = [
      {
        id: '1',
        household_id: 'h1',
        child_id: 'c1',
        trade_date: '2023-01-01',
        stock_name: 'TSLA',
        side: '매수',
        quantity: 10,
        unit_price: 200,
        memo: null,
      },
      {
        id: '2',
        household_id: 'h1',
        child_id: 'c1',
        trade_date: '2023-01-02',
        stock_name: 'TSLA',
        side: '매도',
        quantity: 10,
        unit_price: 250,
        memo: null,
      },
    ]

    const result = computeHoldings(trades)
    expect(result).toHaveLength(0)
  })

  it('Given trades out of order, When computed, Then it sorts by date before calculating', () => {
    const trades: Trade[] = [
      {
        id: '2',
        household_id: 'h1',
        child_id: 'c1',
        trade_date: '2023-01-02',
        stock_name: 'MSFT',
        side: '매도',
        quantity: 5,
        unit_price: 300,
        memo: null,
      },
      {
        id: '1',
        household_id: 'h1',
        child_id: 'c1',
        trade_date: '2023-01-01',
        stock_name: 'MSFT',
        side: '매수',
        quantity: 10,
        unit_price: 250,
        memo: null,
      },
    ]

    const result = computeHoldings(trades)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(5)
    // Principal before sell: 2500
    // Avg price: 250
    // Sell 5: principal reduced by 1250
    // Remaining principal: 1250
    expect(result[0].principal).toBe(1250)
  })
})

describe('enrichHoldings', () => {
  it('Given holdings and prices, When enriched, Then it calculates valuation, profit, and returnPct', () => {
    const holdings = [
      { stockName: 'AAPL', quantity: 10, avgUnitPrice: 150, principal: 1500 },
      { stockName: 'TSLA', quantity: 5, avgUnitPrice: 200, principal: 1000 },
    ]
    const prices: StockPrice[] = [
      { household_id: 'h1', stock_name: 'AAPL', current_price: 170, updated_at: '2023-01-01' },
    ]

    const result = enrichHoldings(holdings, prices)

    expect(result).toHaveLength(2)
    
    // AAPL has price
    expect(result[0].currentPrice).toBe(170)
    expect(result[0].valuation).toBe(1700) // 170 * 10
    expect(result[0].profit).toBe(200) // 1700 - 1500
    expect(result[0].returnPct).toBeCloseTo(13.33, 2) // (200 / 1500) * 100

    // TSLA has no price
    expect(result[1].currentPrice).toBeNull()
    expect(result[1].valuation).toBeNull()
    expect(result[1].profit).toBeNull()
    expect(result[1].returnPct).toBeNull()
  })

  it('Given holding with 0 principal, When enriched, Then returnPct is 0', () => {
    const holdings = [
      { stockName: 'FREE', quantity: 10, avgUnitPrice: 0, principal: 0 },
    ]
    const prices: StockPrice[] = [
      { household_id: 'h1', stock_name: 'FREE', current_price: 10, updated_at: '2023-01-01' },
    ]

    const result = enrichHoldings(holdings, prices)
    expect(result[0].returnPct).toBe(0)
    expect(result[0].profit).toBe(100)
  })
})
