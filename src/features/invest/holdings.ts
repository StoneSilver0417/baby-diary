import type { StockPrice, Trade } from '@/types/database'

export type Holding = {
  stockName: string
  quantity: number
  avgUnitPrice: number
  principal: number
}

export type EnrichedHolding = Holding & {
  currentPrice: number | null
  valuation: number | null
  profit: number | null
  returnPct: number | null
}

/** 종목별 보유 수량·평단·투입 원금 집계 (매수는 더하고, 매도는 원금 비례로 차감) */
export function computeHoldings(trades: Trade[]): Holding[] {
  const byStock = new Map<string, { quantity: number; principal: number }>()

  for (const trade of [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date))) {
    const cur = byStock.get(trade.stock_name) ?? { quantity: 0, principal: 0 }
    const amount = trade.quantity * trade.unit_price

    if (trade.side === '매수') {
      cur.quantity += trade.quantity
      cur.principal += amount
    } else {
      const avgPrice = cur.quantity > 0 ? cur.principal / cur.quantity : 0
      cur.quantity -= trade.quantity
      cur.principal -= avgPrice * trade.quantity
    }
    byStock.set(trade.stock_name, cur)
  }

  return Array.from(byStock.entries())
    .filter(([, v]) => v.quantity > 0)
    .map(([stockName, v]) => ({
      stockName,
      quantity: v.quantity,
      avgUnitPrice: Math.round(v.principal / v.quantity),
      principal: Math.round(v.principal),
    }))
}

/** 보유 종목에 수동 입력 현재가를 결합해 평가금액·수익률 계산 */
export function enrichHoldings(holdings: Holding[], prices: StockPrice[]): EnrichedHolding[] {
  const priceMap = new Map(prices.map((p) => [p.stock_name, p.current_price]))
  return holdings.map((h) => {
    const currentPrice = priceMap.get(h.stockName) ?? null
    if (currentPrice === null) {
      return { ...h, currentPrice: null, valuation: null, profit: null, returnPct: null }
    }
    const valuation = Math.round(currentPrice * h.quantity)
    const profit = valuation - h.principal
    const returnPct = h.principal > 0 ? (profit / h.principal) * 100 : 0
    return { ...h, currentPrice, valuation, profit, returnPct }
  })
}
