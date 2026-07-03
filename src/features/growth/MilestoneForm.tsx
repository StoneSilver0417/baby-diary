import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAddMilestone } from './useGrowthQueries'

const PRESETS = ['첫 미소', '첫 뒤집기', '첫 이유식', '첫 옹알이', '첫 앉기', '첫 걸음마', '첫 이빨']

export function MilestoneForm({ childId, onDone }: { childId: string; onDone: () => void }) {
  const addMilestone = useAddMilestone()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('마일스톤 제목을 입력해 주세요.')
      return
    }
    await addMilestone.mutateAsync({
      childId,
      milestoneDate: date,
      title: title.trim(),
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
        <Label>제목</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 첫 걸음마" />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTitle(p)}
              className={cn(
                'rounded-full border border-border px-3 py-1 text-xs',
                title === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>메모</Label>
        <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={addMilestone.isPending}>
        {addMilestone.isPending ? '저장 중…' : '마일스톤 저장'}
      </Button>
    </div>
  )
}
