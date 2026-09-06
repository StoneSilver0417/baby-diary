import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useIsAdmin } from '@/features/admin/useAdminQueries'
import { useAuth } from '@/features/auth/AuthProvider'
import { useSelectedChild } from '@/features/shared/SelectedChildProvider'
import { useHouseholdId, useMyProfile } from '@/features/shared/useHousehold'
import { AppLink } from '@/lib/navigation'
import { ChildSettingsSection } from './ChildSettingsSection'
import { InquirySection } from './InquirySection'
import { InviteSection } from './InviteSection'
import { ProfileSection } from './ProfileSection'

export function SettingsPage() {
  const { userId, signOut } = useAuth()
  const householdId = useHouseholdId()
  const { children } = useSelectedChild()
  const myProfile = useMyProfile()
  const { data: isAdmin } = useIsAdmin()
  const [addingChild, setAddingChild] = useState(false)

  return (
    <div className="min-h-full space-y-6 p-5 pt-safe">
      <h1 className="text-lg font-semibold text-foreground">설정</h1>

      <ChildSettingsSection
        childList={children}
        householdId={householdId}
        addingChild={addingChild}
        onAddingChildChange={setAddingChild}
      />

      <Separator />

      <ProfileSection
        key={myProfile?.id ?? 'profile-loading'}
        userId={userId}
        initialDisplayName={myProfile?.display_name ?? ''}
      />

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
