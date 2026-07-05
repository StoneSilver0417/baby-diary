import { useState } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { Fab } from '@/components/Fab'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthProvider'
import { useChild, useProfiles } from '@/features/diary/useDiaryQueries'
import { useHouseholdId } from '@/features/shared/useHousehold'
import { cn } from '@/lib/utils'
import { computeHoldings, enrichHoldings, type EnrichedHolding } from './holdings'
import { computeYearlySummary } from './summary'
import {
  useDeleteDividend,
  useDeleteNote,
  useDeleteTrade,
  useDividends,
  useNotes,
  useTrades,
  usePrices,
  useUpsertPrice,
} from './useInvestQueries'
import { TradeForm } from './TradeForm'
import { NoteForm } from './NoteForm'
import { DividendForm } from './DividendForm'

type TimelineItem =
  | { type: 'trade'; date: string; id: string; label: string }
  | { type: 'dividend'; date: string; id: string; label: string }
  | { type: 'note'; date: string; id: string; label: string; authorName: string; authorId: string }

export function InvestPage() {
  const { userId } = useAuth()
  const { data: child } = useChild()
  const { data: profiles } = useProfiles()
  const { data: trades } = useTrades()
  const { data: notes } = useNotes()
  const { data: dividends } = useDividends()
  const { data: prices } = usePrices()
  const deleteTrade = useDeleteTrade()
  const deleteDividend = useDeleteDividend()
  const deleteNote = useDeleteNote()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [priceTarget, setPriceTarget] = useState<EnrichedHolding | null>(null)

  const holdings = enrichHoldings(computeHoldings(trades ?? []), prices ?? [])
  const yearly = computeYearlySummary(trades ?? [], dividends ?? [])

  const totalPrincipal = holdings.reduce((sum, h) => sum + h.principal, 0)
  const totalValuation = holdings.reduce((sum, h) => sum + (h.valuation ?? h.principal), 0)

  const timeline: TimelineItem[] = [
    ...(trades ?? []).map((t) => ({
      type: 'trade' as const,
      date: t.trade_date,
      id: t.id,
      label: `${t.side} · ${t.stock_name} ${t.quantity}주 @${t.unit_price.toLocaleString()}${t.memo ? ` · ${t.memo}` : ''}`,
    })),
    ...(dividends ?? []).map((d) => ({
      type: 'dividend' as const,
      date: d.dividend_date,
      id: d.id,
      label: `배당 · ${d.stock_name} ${d.amount.toLocaleString()}원${d.memo ? ` · ${d.memo}` : ''}`,
    })),
    ...(notes ?? []).map((n) => ({
      type: 'note' as const,
      date: n.note_date,
      id: n.id,
      label: n.content,
      authorName: profiles?.find((p) => p.id === n.author_id)?.display_name ?? '',
      authorId: n.author_id,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="min-h-full pt-safe">
      <header className="p-5">
        <h1 className="text-xl font-semibold text-foreground">{child?.name} 투자일기</h1>
      </header>

      {/* 보유 현황 */}
      <section className="mx-5 mb-5 rounded-lg border border-border bg-card p-4">
        {holdings.length === 0 && (
          <p className="text-sm text-muted-foreground">아직 보유 중인 종목이 없어요.</p>
        )}
        <div className="space-y-3">
          {holdings.map((h) => (
            <button
              key={h.stockName}
              onClick={() => setPriceTarget(h)}
              className="flex w-full items-center justify-between text-left text-sm"
            >
              <div>
                <div className="font-medium text-foreground">{h.stockName}</div>
                <div className="text-xs text-muted-foreground">
                  {h.quantity}주 · 평단 {h.avgUnitPrice.toLocaleString()}원
                </div>
              </div>
              <div className="text-right">
                {h.valuation !== null ? (
                  <>
                    <div className="text-foreground">{h.valuation.toLocaleString()}원</div>
                    <div
                      className={cn(
                        'text-xs',
                        (h.returnPct ?? 0) >= 0 ? 'text-primary' : 'text-destructive',
                      )}
                    >
                      {(h.returnPct ?? 0) >= 0 ? '+' : ''}
                      {(h.returnPct ?? 0).toFixed(1)}% ({(h.profit ?? 0) >= 0 ? '+' : ''}
                      {(h.profit ?? 0).toLocaleString()}원)
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">현재가 입력 →</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {holdings.length > 0 && (
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>총 투입원금</span>
              <span>{totalPrincipal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between font-medium text-foreground">
              <span>총 평가액</span>
              <span>{totalValuation.toLocaleString()}원</span>
            </div>
          </div>
        )}
      </section>

      {/* 연도별 요약 */}
      {yearly.length > 0 && (
        <section className="mx-5 mb-5 rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">연도별 요약</h2>
          <div className="space-y-2">
            {yearly.map((y) => (
              <div key={y.year} className="text-sm">
                <div className="font-medium text-foreground">{y.year}년</div>
                <div className="text-xs text-muted-foreground">
                  매수 {y.buyTotal.toLocaleString()} · 매도 {y.sellTotal.toLocaleString()} · 배당{' '}
                  {y.dividendTotal.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 타임라인 */}
      <div className="divide-y divide-border">
        {timeline.map((item) => {
          const canDelete = item.type !== 'note' || item.authorId === userId
          function handleDelete() {
            if (item.type === 'trade') deleteTrade.mutate(item.id)
            else if (item.type === 'dividend') deleteDividend.mutate(item.id)
            else deleteNote.mutate(item.id)
          }
          return (
            <div key={`${item.type}-${item.id}`} className="flex items-start justify-between p-5">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(item.date), 'M월 d일')}</span>
                  {item.type === 'note' && <span>{item.authorName}</span>}
                </div>
                <p className="text-sm text-foreground">{item.label}</p>
              </div>
              {canDelete && (
                <button
                  type="button"
                  aria-label="기록 삭제"
                  className="mt-0.5 shrink-0 text-muted-foreground"
                  onClick={handleDelete}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )
        })}
        {timeline.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            아직 기록된 거래·배당·메모가 없어요.
          </p>
        )}
      </div>

      {/* 추가 시트 */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Fab aria-label="거래·배당·메모 추가" />
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>거래·배당·메모 추가</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-0">
            <Tabs defaultValue="trade">
              <TabsList className="w-full">
                <TabsTrigger value="trade" className="flex-1">
                  거래
                </TabsTrigger>
                <TabsTrigger value="dividend" className="flex-1">
                  배당
                </TabsTrigger>
                <TabsTrigger value="note" className="flex-1">
                  메모
                </TabsTrigger>
              </TabsList>
              <TabsContent value="trade" className="pt-4">
                {child && <TradeForm childId={child.id} onDone={() => setSheetOpen(false)} />}
              </TabsContent>
              <TabsContent value="dividend" className="pt-4">
                {child && <DividendForm childId={child.id} onDone={() => setSheetOpen(false)} />}
              </TabsContent>
              <TabsContent value="note" className="pt-4">
                <NoteForm onDone={() => setSheetOpen(false)} />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* 현재가 입력 시트 */}
      <PriceSheet holding={priceTarget} onClose={() => setPriceTarget(null)} />
    </div>
  )
}

function PriceSheet({
  holding,
  onClose,
}: {
  holding: EnrichedHolding | null
  onClose: () => void
}) {
  const upsertPrice = useUpsertPrice()
  const householdId = useHouseholdId()
  const [value, setValue] = useState('')

  async function handleSubmit() {
    if (!holding || !value || !householdId) return
    await upsertPrice.mutateAsync({ householdId, stockName: holding.stockName, price: Number(value) })
    setValue('')
    onClose()
  }

  return (
    <Sheet
      open={holding !== null}
      onOpenChange={(open) => {
        if (!open) {
          setValue('')
          onClose()
        }
      }}
    >
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{holding?.stockName} 현재가 입력</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 p-4 pt-0">
          {holding?.currentPrice != null && (
            <p className="text-xs text-muted-foreground">
              현재 저장값 {holding.currentPrice.toLocaleString()}원
            </p>
          )}
          <div className="space-y-1.5">
            <Label>현재가 (원)</Label>
            <Input
              type="number"
              inputMode="numeric"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={upsertPrice.isPending || !value}>
            {upsertPrice.isPending ? '저장 중…' : '저장'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
