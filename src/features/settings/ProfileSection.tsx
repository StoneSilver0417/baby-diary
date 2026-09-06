import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { queryKeys } from '@/lib/queryClient'
import { updateDisplayName } from './api'

type ProfileSectionProps = {
  readonly userId: string | null | undefined
  readonly initialDisplayName: string
}

export function ProfileSection({ userId, initialDisplayName }: ProfileSectionProps) {
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [saving, setSaving] = useState(false)
  const normalizedDisplayName = displayName.trim()
  const canSave = Boolean(userId && normalizedDisplayName && normalizedDisplayName !== initialDisplayName)

  async function handleSave() {
    if (!userId || !canSave) return
    setSaving(true)
    try {
      await updateDisplayName(userId, normalizedDisplayName)
      await queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
      toast.success('저장했어요.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">내 표시 이름</h2>
        <p className="mt-1 text-xs text-muted-foreground">일기와 댓글에 표시되는 이름이에요.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-display-name">표시 이름</Label>
        <Input
          id="profile-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={20}
          autoComplete="nickname"
        />
      </div>
      <Button variant="outline" onClick={handleSave} disabled={saving || !canSave}>
        {saving ? '저장 중…' : '표시 이름 저장'}
      </Button>
    </section>
  )
}
