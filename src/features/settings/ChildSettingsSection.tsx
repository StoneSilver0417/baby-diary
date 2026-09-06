import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { queryKeys } from '@/lib/queryClient'
import type { Child } from '@/types/database'
import { addChild, updateChild } from './api'

type ChildSettingsSectionProps = {
  readonly childList: readonly Child[]
  readonly householdId: string | undefined
  readonly addingChild: boolean
  readonly onAddingChildChange: (adding: boolean) => void
}

export function ChildSettingsSection({
  childList,
  householdId,
  addingChild,
  onAddingChildChange,
}: ChildSettingsSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">아이 정보</h2>
      <div className="space-y-3">
        {childList.map((child) => <ChildEditRow key={child.id} child={child} />)}
      </div>
      {addingChild ? (
        <AddChildRow householdId={householdId} onClose={() => onAddingChildChange(false)} />
      ) : (
        <Button variant="outline" onClick={() => onAddingChildChange(true)}>
          아이 추가
        </Button>
      )}
    </section>
  )
}

function ChildEditRow({ child }: { readonly child: Child }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(child.name)
  const [birthDate, setBirthDate] = useState(child.birth_date)
  const [saving, setSaving] = useState(false)
  const normalizedName = name.trim()
  const canSave = Boolean(normalizedName && birthDate)

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await updateChild(child.id, { name: normalizedName, birth_date: birthDate })
      await queryClient.invalidateQueries({ queryKey: queryKeys.children })
      toast.success('저장했어요.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-1.5">
        <Label htmlFor={`child-name-${child.id}`}>이름</Label>
        <Input id={`child-name-${child.id}`} value={name} onChange={(event) => setName(event.target.value)} maxLength={20} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`child-birth-date-${child.id}`}>생일</Label>
        <Input id={`child-birth-date-${child.id}`} type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
      </div>
      <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || !canSave}>
        {saving ? '저장 중…' : '저장'}
      </Button>
    </div>
  )
}

function AddChildRow({ householdId, onClose }: { readonly householdId: string | undefined; readonly onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const normalizedName = name.trim()
    if (!householdId || !normalizedName || !birthDate) {
      toast.error('이름과 생일을 입력해 주세요.')
      return
    }
    setSaving(true)
    try {
      await addChild(householdId, { name: normalizedName, birth_date: birthDate })
      await queryClient.invalidateQueries({ queryKey: queryKeys.children })
      toast.success('아이를 추가했어요.')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '추가에 실패했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <div className="space-y-1.5">
        <Label htmlFor="new-child-name">이름</Label>
        <Input id="new-child-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={20} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-child-birth-date">생일</Label>
        <Input id="new-child-birth-date" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd} disabled={saving}>
          {saving ? '추가 중…' : '추가하기'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>취소</Button>
      </div>
    </div>
  )
}
