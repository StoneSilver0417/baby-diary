import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cloud, Star, Sun } from '@/assets/doodles'
import { createHouseholdWithChild, joinHousehold } from './api'

type Mode = 'choose' | 'create' | 'join'

export function OnboardingPage() {
  const [mode, setMode] = useState<Mode>('choose')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [householdName, setHouseholdName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [childName, setChildName] = useState('')
  const [childBirth, setChildBirth] = useState('')
  const [code, setCode] = useState('')

  async function afterJoin() {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] })
    navigate('/', { replace: true })
  }

  async function handleCreate() {
    if (!householdName.trim() || !displayName.trim() || !childName.trim() || !childBirth) {
      toast.error('모든 항목을 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      await createHouseholdWithChild({ householdName, displayName, childName, childBirth })
      toast.success('가족을 만들었어요!')
      await afterJoin()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '가족 생성에 실패했어요.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!code.trim() || !displayName.trim()) {
      toast.error('초대코드와 표시 이름을 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      await joinHousehold(code, displayName)
      toast.success('가족에 합류했어요!')
      await afterJoin()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '합류에 실패했어요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-background px-6 pt-safe pb-safe">
      <Sun className="absolute left-6 top-12 size-10 text-sticker-yellow-foreground/70" />
      <Cloud className="absolute right-4 top-24 size-12 text-sticker-sky-foreground/60" />
      <Star className="absolute bottom-16 left-8 size-7 text-sticker-pink-foreground/60" />

      <div className="text-center">
        <h1 className="font-hand text-3xl font-semibold text-foreground">환영해요!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          가족을 만들거나 초대코드로 합류해 보세요
        </p>
      </div>

      {mode === 'choose' && (
        <div className="w-full max-w-sm space-y-3">
          <button
            type="button"
            onClick={() => setMode('create')}
            className="w-full rounded-lg border border-border bg-card p-4 text-left"
          >
            <div className="font-medium text-foreground">새 가족 만들기</div>
            <div className="text-sm text-muted-foreground">
              가족 이름과 첫 아이 정보를 등록해요
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className="w-full rounded-lg border border-border bg-card p-4 text-left"
          >
            <div className="font-medium text-foreground">초대코드로 합류하기</div>
            <div className="text-sm text-muted-foreground">
              배우자가 보내준 초대코드를 입력해요
            </div>
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="w-full max-w-sm space-y-4">
          <div className="space-y-1.5">
            <Label>가족 이름</Label>
            <Input
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="예: 우리집"
            />
          </div>
          <div className="space-y-1.5">
            <Label>내 표시 이름</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="예: 아빠"
            />
          </div>
          <div className="space-y-1.5">
            <Label>아이 이름</Label>
            <Input value={childName} onChange={(e) => setChildName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>아이 생일</Label>
            <Input type="date" value={childBirth} onChange={(e) => setChildBirth(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? '만드는 중…' : '가족 만들기'}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setMode('choose')}
            disabled={loading}
          >
            뒤로
          </Button>
        </div>
      )}

      {mode === 'join' && (
        <div className="w-full max-w-sm space-y-4">
          <div className="space-y-1.5">
            <Label>초대코드</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="8자리 코드"
              autoCapitalize="characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label>내 표시 이름</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="예: 엄마"
            />
          </div>
          <Button className="w-full" onClick={handleJoin} disabled={loading}>
            {loading ? '합류하는 중…' : '합류하기'}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setMode('choose')}
            disabled={loading}
          >
            뒤로
          </Button>
        </div>
      )}
    </div>
  )
}
