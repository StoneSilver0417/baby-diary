import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TradeSide } from '@/types/database'
import { useAddTrade } from './useInvestQueries'

export function TradeForm({ childId, onDone }: { childId: string; onDone: () => void }) {
  const addTrade = useAddTrade()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [stockName, setStockName] = useState('')
  const [side, setSide] = useState<TradeSide>('매수')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [memo, setMemo] = useState('')

  async function handleSubmit() {
    if (!stockName.trim() || !quantity || !unitPrice) return
    await addTrade.mutateAsync({
      child_id: childId,
      trade_date: date,
      stock_name: stockName,
      side,
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      memo: memo || null,
    })
    onDone()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>날짜</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>종목명</Label>
        <Input value={stockName} onChange={(e) => setStockName(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={side === '매수' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setSide('매수')}
        >
          매수
        </Button>
        <Button
          type="button"
          variant={side === '매도' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setSide('매도')}
        >
          매도
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>수량</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>단가</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>메모</Label>
        <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={addTrade.isPending}>
        {addTrade.isPending ? '저장 중…' : '거래 기록 저장'}
      </Button>
    </div>
  )
}
