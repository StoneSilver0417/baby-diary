import { useState } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import { X } from 'lucide-react'
import { Fab } from '@/components/Fab'
import { ChildSwitcher } from '@/components/ChildSwitcher'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSelectedChild } from '@/features/shared/SelectedChildProvider'
import { childAge } from '@/lib/childAge'
import { GrowthChart } from './GrowthChart'
import { GrowthRecordForm } from './GrowthRecordForm'
import { MilestoneForm } from './MilestoneForm'
import {
  useDeleteGrowthRecord,
  useDeleteMilestone,
  useGrowthRecords,
  useMilestones,
} from './useGrowthQueries'

export function GrowthPage() {
  const { selectedChild: child } = useSelectedChild()
  const { data: records } = useGrowthRecords(child?.id)
  const { data: milestones } = useMilestones(child?.id)
  const deleteRecord = useDeleteGrowthRecord()
  const deleteMilestone = useDeleteMilestone()
  const [tab, setTab] = useState('records')
  const [sheetOpen, setSheetOpen] = useState(false)

  const age = childAge(child?.birth_date)
  const sortedRecords = [...(records ?? [])].sort((a, b) =>
    b.record_date.localeCompare(a.record_date),
  )

  return (
    <div className="min-h-full">
      <header className="space-y-3 border-b border-border px-5 pt-safe pb-4">
        <div className="pt-4">
          <h1 className="text-xl font-semibold text-foreground">{child?.name} 성장기록</h1>
          {age && (
            <p className="text-sm text-muted-foreground">
              D+{age.days}일 · {age.months}개월
            </p>
          )}
        </div>
        <ChildSwitcher />
      </header>

      <Tabs value={tab} onValueChange={setTab} className="p-5">
        <TabsList className="w-full">
          <TabsTrigger value="records" className="flex-1">
            성장기록
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex-1">
            마일스톤
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="pt-4">
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <GrowthChart records={records ?? []} />
          </div>
          <div className="space-y-2">
            {sortedRecords.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <span className="text-muted-foreground">
                    {format(new Date(r.record_date), 'yyyy.M.d')}
                  </span>{' '}
                  <span className="text-foreground">
                    {r.height_cm != null && `${r.height_cm}cm`}
                    {r.height_cm != null && r.weight_kg != null && ' · '}
                    {r.weight_kg != null && `${r.weight_kg}kg`}
                  </span>
                  {r.memo && <span className="text-muted-foreground"> · {r.memo}</span>}
                </div>
                <button
                  aria-label="기록 삭제"
                  className="text-muted-foreground"
                  onClick={() => deleteRecord.mutate(r.id)}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {sortedRecords.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                아직 성장 기록이 없어요.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="pt-4">
          <div className="space-y-2">
            {(milestones ?? []).map((m) => {
              const dPlus = child
                ? differenceInCalendarDays(new Date(m.milestone_date), new Date(child.birth_date))
                : null
              return (
                <div
                  key={m.id}
                  className="flex items-start justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{m.title}</span>
                      {dPlus !== null && (
                        <span className="text-xs text-muted-foreground">D+{dPlus}일</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(m.milestone_date), 'yyyy.M.d')}
                    </span>
                    {m.memo && <p className="mt-1 text-sm text-muted-foreground">{m.memo}</p>}
                  </div>
                  <button
                    aria-label="마일스톤 삭제"
                    className="text-muted-foreground"
                    onClick={() => deleteMilestone.mutate(m.id)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )
            })}
            {(milestones ?? []).length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                아직 마일스톤이 없어요.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Fab aria-label={tab === 'records' ? '성장 기록 추가' : '마일스톤 추가'} />
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{tab === 'records' ? '성장 기록 추가' : '마일스톤 추가'}</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-0">
            {child && tab === 'records' && (
              <GrowthRecordForm key={child.id} childId={child.id} onDone={() => setSheetOpen(false)} />
            )}
            {child && tab === 'milestones' && (
              <MilestoneForm key={child.id} childId={child.id} onDone={() => setSheetOpen(false)} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
