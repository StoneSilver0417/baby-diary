import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useHouseholdId } from '@/features/diary/useDiaryQueries'
import { useUpsertGrowthRecord } from './useGrowthQueries'

export function GrowthRecordForm({ childId, onDone }: { childId: string; onDone: () => void }) {
  const upsert = useUpsertGrowthRecord()
  const householdId = useHouseholdId()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [memo, setMemo] = useState('')

  async function handleSubmit() {
    if (!height && !weight) {
      toast.error('키 또는 몸무게 중 하나는 입력해 주세요.')
      return
    }
    if (!householdId) return
    await upsert.mutateAsync({
      householdId,
      childId,
      recordDate: date,
      heightCm: height ? Number(height) : null,
      weightKg: weight ? Number(weight) : null,
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
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>키 (cm)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>몸무게 (kg)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>메모</Label>
        <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={upsert.isPending}>
        {upsert.isPending ? '저장 중…' : '성장 기록 저장'}
      </Button>
    </div>
  )
}
