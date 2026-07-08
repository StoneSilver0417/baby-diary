import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Images, X } from 'lucide-react'
import { PhotoCarousel } from '@/components/PhotoCarousel'
import { useFeed, usePhotoUrls } from './useDiaryQueries'
import { DiaryViewSegment } from './DiaryViewSegment'

export function AlbumPage() {
  const { data: feed } = useFeed()
  const [openDate, setOpenDate] = useState<string | null>(null)

  // 전체 일기의 사진을 평면 배열로(엔트리 내부는 sort_order 순)
  const flatPhotos = useMemo(
    () =>
      (feed ?? []).flatMap((entry) =>
        [...entry.photos]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((p) => ({ path: p.storage_path, date: entry.entry_date })),
      ),
    [feed],
  )

  const results = usePhotoUrls(flatPhotos.map((p) => p.path))

  // 날짜별 그룹(최신순). 각 그룹은 그날의 모든 사진 URL을 순서대로 담는다.
  const groups = useMemo(() => {
    const byDate = new Map<string, (string | undefined)[]>()
    flatPhotos.forEach((p, i) => {
      const list = byDate.get(p.date) ?? []
      list.push(results[i]?.data)
      byDate.set(p.date, list)
    })
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, urls]) => ({ date, urls }))
  }, [flatPhotos, results])

  const openGroup = groups.find((g) => g.date === openDate) ?? null

  // 라이트박스가 열려 있으면 Esc로 닫기
  useEffect(() => {
    if (!openGroup) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenDate(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openGroup])

  return (
    <div className="min-h-full">
      <header className="border-b border-border px-5 pt-safe pb-4">
        <div className="pt-4">
          <DiaryViewSegment />
        </div>
      </header>

      {groups.length === 0 ? (
        <p className="p-8 text-center font-hand text-lg text-muted-foreground">
          아직 사진이 없어요.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-4">
          {groups.map((g) => {
            const cover = g.urls[0]
            const more = g.urls.length > 1
            return (
              <button
                key={g.date}
                onClick={() => setOpenDate(g.date)}
                className="block"
                aria-label={`${format(new Date(g.date), 'M월 d일')} 사진 ${g.urls.length}장`}
              >
                <div className="relative aspect-square">
                  {/* 여러 장이면 뒤에 사진이 더 있는 듯한 겹침 효과 */}
                  {more && (
                    <div
                      aria-hidden
                      className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-[4deg] overflow-hidden rounded-sm bg-white shadow-sm"
                    >
                      {g.urls[1] && (
                        <img src={g.urls[1]} alt="" className="size-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="polaroid relative size-full overflow-hidden">
                    {cover ? (
                      <img src={cover} alt="" className="size-full rounded-[2px] object-cover" />
                    ) : (
                      <div className="size-full rounded-[2px] bg-muted" />
                    )}
                  </div>
                  {more && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
                      <Images className="size-3.5" />
                      {g.urls.length}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-center font-hand text-base text-muted-foreground">
                  {format(new Date(g.date), 'M월 d일')}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {openGroup && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          onClick={() => setOpenDate(null)}
        >
          <div className="flex items-center justify-between px-4 pt-safe pb-2 text-white">
            <span className="font-hand text-lg">
              {format(new Date(openGroup.date), 'yyyy년 M월 d일')}
            </span>
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setOpenDate(null)}
              className="rounded-full p-1"
            >
              <X className="size-6" />
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <PhotoCarousel
              urls={openGroup.urls.filter((u): u is string => !!u)}
              fit="contain"
              fill
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
