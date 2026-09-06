import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useProfiles } from '@/features/diary/useDiaryQueries'
import { useHouseholdId } from '@/features/shared/useHousehold'
import type { Invite } from '@/types/database'
import { createInvite } from './api'

export function InviteSection() {
  const { data: profiles } = useProfiles()
  const householdId = useHouseholdId()
  const householdMembers = profiles?.filter((profile) => profile.household_id === householdId)
  const [invite, setInvite] = useState<Invite | null>(null)
  const [creating, setCreating] = useState(false)

  async function handleCreateInvite() {
    setCreating(true)
    try {
      setInvite(await createInvite())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '초대코드 생성에 실패했어요.')
    } finally {
      setCreating(false)
    }
  }

  async function handleCopy() {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.code)
      toast.success('복사했어요.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '복사하지 못했어요.')
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">가족 구성원</h2>
      <ul className="space-y-1 text-sm text-foreground">
        {householdMembers?.map((profile) => <li key={profile.id}>{profile.display_name}</li>)}
      </ul>
      {invite ? (
        <div className="rounded-lg border border-border p-3 text-center">
          <div className="font-hand text-2xl tracking-widest text-foreground">{invite.code}</div>
          <p className="mt-1 text-xs text-muted-foreground">72시간 동안 유효 · 1회만 사용 가능</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleCopy}>코드 복사</Button>
        </div>
      ) : (
        <Button variant="outline" onClick={handleCreateInvite} disabled={creating}>
          {creating ? '생성 중…' : '배우자 초대코드 만들기'}
        </Button>
      )}
    </section>
  )
}
