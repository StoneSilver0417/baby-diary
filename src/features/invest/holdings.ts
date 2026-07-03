import type { Trade } from '@/types/database'

export type Holding = {
  stockName: string
  quantity: number
  avgUnitPrice: number
  principal: number
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
