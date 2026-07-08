import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProfiles } from '@/features/diary/useDiaryQueries'
import { useSelectedChild } from '@/features/shared/SelectedChildProvider'
import { useHouseholdId, useMyProfile } from '@/features/shared/useHousehold'
import { useIsAdmin } from '@/features/admin/useAdminQueries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { AppLink } from '@/lib/navigation'
import type { Child, Invite } from '@/types/database'
import { addChild, createInquiry, createInvite, getMyInquiries, updateChild, updateDisplayName } from './api'

export function SettingsPage() {
  const { userId, signOut } = useAuth()
  const queryClient = useQueryClient()
  const householdId = useHouseholdId()
  const { children } = useSelectedChild()
  const myProfile = useMyProfile()
  const { data: isAdmin } = useIsAdmin()

  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingChild, setAddingChild] = useState(false)

  useEffect(() => {
    if (myProfile) setDisplayName(myProfile.display_name)
  }, [myProfile])

  async function handleSaveProfile() {
    if (!userId) return
    setSaving(true)
    try {
      await updateDisplayName(userId, displayName)
      await queryClient.invalidateQueries({ queryKey: ['profiles'] })
      toast.success('저장했어요.')
    } catch {
      toast.error('저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full space-y-6 p-5 pt-safe">
      <h1 className="text-lg font-semibold text-foreground">설정</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">아이 정보</h2>
        <div className="space-y-3">
          {children.map((child) => (
            <ChildEditRow key={child.id} child={child} />
          ))}
        </div>
        {addingChild ? (
          <AddChildRow
            householdId={householdId}
            onDone={() => setAddingChild(false)}
            onCancel={() => setAddingChild(false)}
          />
        ) : (
          <Button variant="outline" onClick={() => setAddingChild(true)}>
            아이 추가
          </Button>
        )}
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

      <InviteSection />

      <Separator />

      <InquirySection userId={userId} />

      {isAdmin && (
        <>
          <Separator />
          <AppLink
            to="/admin"
            className="block text-center text-sm text-muted-foreground underline underline-offset-2"
          >
            관리자 페이지
          </AppLink>
        </>
      )}

      <Separator />

      <Button variant="destructive" className="w-full" onClick={() => signOut()}>
        로그아웃
      </Button>
    </div>
  )
}

function ChildEditRow({ child }: { child: Child }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(child.name)
  const [birthDate, setBirthDate] = useState(child.birth_date)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateChild(child.id, { name, birth_date: birthDate })
      await queryClient.invalidateQueries({ queryKey: ['children'] })
      toast.success('저장했어요.')
    } catch {
      toast.error('저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-1.5">
        <Label>이름</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>생일</Label>
        <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </div>
      <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
        저장
      </Button>
    </div>
  )
}

function AddChildRow({
  householdId,
  onDone,
  onCancel,
}: {
  householdId: string | undefined
  onDone: () => void
  onCancel: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!householdId || !name.trim() || !birthDate) {
      toast.error('이름과 생일을 입력해 주세요.')
      return
    }
    setSaving(true)
    try {
      await addChild(householdId, { name, birth_date: birthDate })
      await queryClient.invalidateQueries({ queryKey: ['children'] })
      toast.success('아이를 추가했어요.')
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '추가에 실패했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <div className="space-y-1.5">
        <Label>이름</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>생일</Label>
        <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd} disabled={saving}>
          {saving ? '추가 중…' : '추가하기'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          취소
        </Button>
      </div>
    </div>
  )
}

function InviteSection() {
  const { data: profiles } = useProfiles()
  const householdId = useHouseholdId()
  // profiles 테이블 select 정책이 관리자에게는 전체 가족을 열어주므로(관리자 대시보드용),
  // 여기서는 반드시 내 household로만 걸러서 보여준다 — 아니면 관리자 계정에서
  // 시스템 전체 구성원이 "우리 가족"으로 보이는 정보 노출 버그가 된다.
  const householdMembers = profiles?.filter((p) => p.household_id === householdId)
  const [invite, setInvite] = useState<Invite | null>(null)
  const [creating, setCreating] = useState(false)

  async function handleCreateInvite() {
    setCreating(true)
    try {
      const result = await createInvite()
      setInvite(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '초대코드 생성에 실패했어요.')
    } finally {
      setCreating(false)
    }
  }

  async function handleCopy() {
    if (!invite) return
    await navigator.clipboard.writeText(invite.code)
    toast.success('복사했어요.')
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">가족 구성원</h2>
      <div className="space-y-1 text-sm text-foreground">
        {householdMembers?.map((p) => <div key={p.id}>{p.display_name}</div>)}
      </div>
      {invite ? (
        <div className="rounded-lg border border-border p-3 text-center">
          <div className="font-hand text-2xl tracking-widest text-foreground">{invite.code}</div>
          <p className="mt-1 text-xs text-muted-foreground">72시간 동안 유효 · 1회만 사용 가능</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleCopy}>
            코드 복사
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={handleCreateInvite} disabled={creating}>
          {creating ? '생성 중…' : '배우자 초대코드 만들기'}
        </Button>
      )}
    </section>
  )
}

function InquirySection({ userId }: { userId: string | null | undefined }) {
  const queryClient = useQueryClient()
  const { data: inquiries } = useQuery({
    queryKey: ['inquiries', 'mine', userId],
    queryFn: () => getMyInquiries(userId!),
    enabled: !!userId,
  })
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!userId || !content.trim()) return
    setSubmitting(true)
    try {
      await createInquiry(userId, content)
      setContent('')
      await queryClient.invalidateQueries({ queryKey: ['inquiries', 'mine', userId] })
      toast.success('문의를 등록했어요.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '등록에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">문의하기</h2>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="궁금한 점이나 불편한 점을 남겨주세요"
      />
      <Button variant="outline" onClick={handleSubmit} disabled={submitting || !content.trim()}>
        {submitting ? '등록 중…' : '문의 등록'}
      </Button>
      <div className="space-y-2">
        {inquiries?.map((q) => (
          <div key={q.id} className="rounded-lg border border-border p-3 text-sm">
            <p className="text-foreground">{q.content}</p>
            {q.reply ? (
              <p className="mt-2 rounded-md bg-accent p-2 text-accent-foreground">{q.reply}</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">답변 대기 중</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
