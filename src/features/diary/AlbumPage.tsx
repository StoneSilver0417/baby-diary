import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { useFeed, usePhotoUrls } from './useDiaryQueries'
import { DiaryViewSegment } from './DiaryViewSegment'

export function AlbumPage() {
  const navigate = useNavigate()
  const { data: feed } = useFeed()

  // 전체 일기의 사진을 날짜 역순으로 펼침
  const photos = useMemo(() => {
    return (feed ?? []).flatMap((entry) =>
      [...entry.photos]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => ({ path: p.storage_path, entryId: entry.id })),
    )
  }, [feed])

  const results = usePhotoUrls(photos.map((p) => p.path))

  return (
    <div className="min-h-full">
      <header className="border-b border-border px-5 pt-safe pb-4">
        <div className="pt-4">
          <DiaryViewSegment />
        </div>
      </header>

      {photos.length === 0 ? (
        <p className="p-8 text-center font-hand text-lg text-muted-foreground">
          아직 사진이 없어요.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 p-4">
          {photos.map((photo, i) => {
            const url = results[i]?.data
            return (
              <button
                key={`${photo.entryId}-${i}`}
                onClick={() => navigate(`/entry/${photo.entryId}`, { replace: true })}
                className={cn(
                  'polaroid aspect-square overflow-hidden',
                  i % 2 === 0 ? 'polaroid-tilt-left' : 'polaroid-tilt-right',
                )}
              >
                {url && <img src={url} alt="" className="size-full rounded-[2px] object-cover" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
