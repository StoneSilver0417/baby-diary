import { useState } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import { Calendar, Plus, Sparkles, TrendingUp, Trophy, X } from 'lucide-react'
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
import { getLatestMeasurements } from './growthSummary'
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

  const latestMeasurements = getLatestMeasurements(sortedRecords)

  return (
    <div className="min-h-full pb-24">
      <header className="space-y-3 border-b border-border/60 bg-background/80 px-5 pt-safe pb-4 backdrop-blur-md">
        <div className="flex items-center justify-between pt-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{child?.name ?? '아이'} 성장기록</h1>
              <Sparkles className="size-4 text-amber-400" />
            </div>
            {age && (
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                D+{age.days}일 <span className="text-border">·</span> {age.months}개월
              </p>
            )}
          </div>
        </div>
        <ChildSwitcher />
      </header>

      <div className="p-4 space-y-4">
        {(latestMeasurements.height || latestMeasurements.weight) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/70 bg-amber-50/50 p-4 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                <TrendingUp className="size-4" /> 최근 키
              </div>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {latestMeasurements.height ? `${latestMeasurements.height.value} cm` : '-'}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {latestMeasurements.height
                  ? `${format(new Date(latestMeasurements.height.recordDate), 'yyyy.MM.dd')} 기준`
                  : '아직 기록 없음'}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-rose-50/50 p-4 dark:bg-rose-950/20">
              <div className="flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                <Trophy className="size-4" /> 최근 몸무게
              </div>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {latestMeasurements.weight ? `${latestMeasurements.weight.value} kg` : '-'}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {latestMeasurements.weight
                  ? `${format(new Date(latestMeasurements.weight.recordDate), 'yyyy.MM.dd')} 기준`
                  : '아직 기록 없음'}
              </p>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="records" className="rounded-lg text-xs font-semibold py-2">
              신체 측정
            </TabsTrigger>
            <TabsTrigger value="milestones" className="rounded-lg text-xs font-semibold py-2">
              발달 마일스톤
            </TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="mt-4 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
              <GrowthChart records={records ?? []} />
            </div>

            <div className="space-y-2.5">
              {sortedRecords.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(r.record_date), 'yyyy년 M월 d일')}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {r.height_cm != null && `${r.height_cm}cm`}
                        {r.height_cm != null && r.weight_kg != null && ' · '}
                        {r.weight_kg != null && `${r.weight_kg}kg`}
                      </div>
                      {r.memo && <div className="mt-0.5 text-xs text-muted-foreground">{r.memo}</div>}
                    </div>
                  </div>

                  <button
                    aria-label="기록 삭제"
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => deleteRecord.mutate(r.id)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}

              {sortedRecords.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
                  아직 성장 기록이 없어요.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="mt-4 space-y-2.5">
            {(milestones ?? []).map((m) => {
              const dPlus = child
                ? differenceInCalendarDays(new Date(m.milestone_date), new Date(child.birth_date))
                : null
              return (
                <div
                  key={m.id}
                  className="flex items-start justify-between rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs transition-colors hover:border-primary/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{m.title}</span>
                      {dPlus !== null && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          D+{dPlus}일
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(m.milestone_date), 'yyyy년 M월 d일')}
                    </div>
                    {m.memo && <p className="text-xs text-muted-foreground/90">{m.memo}</p>}
                  </div>

                  <button
                    aria-label="마일스톤 삭제"
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => deleteMilestone.mutate(m.id)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )
            })}

            {(milestones ?? []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
                아직 마일스톤이 없어요.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Fab aria-label={tab === 'records' ? '성장 기록 추가' : '마일스톤 추가'}>
            <Plus className="size-6" />
          </Fab>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-lg font-bold">
              {tab === 'records' ? '성장 기록 추가' : '마일스톤 추가'}
            </SheetTitle>
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
