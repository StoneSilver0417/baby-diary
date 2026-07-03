import type { Dividend, Trade } from '@/types/database'

export type YearlySummary = {
  year: string
  buyTotal: number
  sellTotal: number
  dividendTotal: number
}

/** 연도별 매수액·매도액·배당액 합계 (연도 역순) */
export function computeYearlySummary(trades: Trade[], dividends: Dividend[]): YearlySummary[] {
  const byYear = new Map<string, YearlySummary>()

  const ensure = (year: string) => {
    let row = byYear.get(year)
    if (!row) {
      row = { year, buyTotal: 0, sellTotal: 0, dividendTotal: 0 }
      byYear.set(year, row)
    }
    return row
  }

  for (const t of trades) {
    const row = ensure(t.trade_date.slice(0, 4))
    const amount = t.quantity * t.unit_price
    if (t.side === '매수') row.buyTotal += amount
    else row.sellTotal += amount
  }

  for (const d of dividends) {
    ensure(d.dividend_date.slice(0, 4)).dividendTotal += d.amount
  }

  return Array.from(byYear.values()).sort((a, b) => b.year.localeCompare(a.year))
}
