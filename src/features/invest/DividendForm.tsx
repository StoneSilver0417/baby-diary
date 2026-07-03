import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAddDividend } from './useInvestQueries'

export function DividendForm({ childId, onDone }: { childId: string; onDone: () => void }) {
  const addDividend = useAddDividend()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [stockName, setStockName] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  async function handleSubmit() {
    if (!stockName.trim() || !amount) return
    await addDividend.mutateAsync({
      child_id: childId,
      dividend_date: date,
      stock_name: stockName,
      amount: Number(amount),
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
      <div className="space-y-1.5">
        <Label>배당금 (원)</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>메모</Label>
        <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={addDividend.isPending}>
        {addDividend.isPending ? '저장 중…' : '배당 기록 저장'}
      </Button>
    </div>
  )
}
