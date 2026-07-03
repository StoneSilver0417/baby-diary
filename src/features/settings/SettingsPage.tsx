import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthProvider'
import { useChild, useProfiles } from '@/features/diary/useDiaryQueries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { updateChild, updateDisplayName } from './api'

export function SettingsPage() {
  const { userId, signOut } = useAuth()
  const queryClient = useQueryClient()
  const { data: child } = useChild()
  const { data: profiles } = useProfiles()
  const myProfile = profiles?.find((p) => p.id === userId)

  const [childName, setChildName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (child) {
      setChildName(child.name)
      setBirthDate(child.birth_date)
    }
  }, [child])

  useEffect(() => {
    if (myProfile) setDisplayName(myProfile.display_name)
  }, [myProfile])

  async function handleSaveChild() {
    if (!child) return
    setSaving(true)
    try {
      await updateChild(child.id, { name: childName, birth_date: birthDate })
      await queryClient.invalidateQueries({ queryKey: ['child'] })
      toast.success('저장했어요.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfile() {
    if (!userId) return
    setSaving(true)
    try {
      await updateDisplayName(userId, displayName)
      await queryClient.invalidateQueries({ queryKey: ['profiles'] })
      toast.success('저장했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full space-y-6 p-5 pt-safe">
      <h1 className="text-lg font-semibold text-foreground">설정</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">아이 정보</h2>
        <div className="space-y-1.5">
          <Label>이름</Label>
          <Input value={childName} onChange={(e) => setChildName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>생일</Label>
          <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <Button variant="outline" onClick={handleSaveChild} disabled={saving}>
          아이 정보 저장
        </Button>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">내 표시 이름</h2>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Button variant="outline" onClick={handleSaveProfile} disabled={saving}>
          표시 이름 저장
        </Button>
      </section>

      <Separator />

      <Button variant="destructive" className="w-full" onClick={() => signOut()}>
        로그아웃
      </Button>
    </div>
  )
}
