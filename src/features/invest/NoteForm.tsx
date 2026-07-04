import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthProvider'
import { useHouseholdId } from '@/features/diary/useDiaryQueries'
import { useAddNote } from './useInvestQueries'

export function NoteForm({ onDone }: { onDone: () => void }) {
  const { userId } = useAuth()
  const householdId = useHouseholdId()
  const addNote = useAddNote()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [content, setContent] = useState('')

  async function handleSubmit() {
    if (!content.trim() || !userId || !householdId) return
    await addNote.mutateAsync({ household_id: householdId, author_id: userId, note_date: date, content })
    onDone()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>날짜</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>메모</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘의 투자 생각을 기록해 보세요"
          className="min-h-32"
        />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={addNote.isPending}>
        {addNote.isPending ? '저장 중…' : '메모 저장'}
      </Button>
    </div>
  )
}
