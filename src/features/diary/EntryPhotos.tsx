import { PhotoCarousel } from '@/components/PhotoCarousel'
import type { DiaryPhoto } from '@/types/database'
import { usePhotoUrls } from './useDiaryQueries'

export function EntryPhotos({
  photos,
  className,
}: {
  photos: DiaryPhoto[]
  className?: string
}) {
  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order)
  const results = usePhotoUrls(sorted.map((p) => p.storage_path))
  const urls = results.map((r) => r.data).filter((u): u is string => !!u)

  if (urls.length === 0) return null
  return <PhotoCarousel urls={urls} className={className} />
}
