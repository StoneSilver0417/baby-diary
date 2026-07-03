import { useState } from 'react'
import { cn } from '@/lib/utils'

export function PhotoCarousel({ urls, className }: { urls: string[]; className?: string }) {
  const [index, setIndex] = useState(0)
  if (urls.length === 0) return null

  return (
    <div className={cn('relative aspect-square w-full overflow-hidden bg-muted', className)}>
      <img src={urls[index]} alt="" className="size-full object-cover" />
      {urls.length > 1 && (
        <>
          <div className="absolute inset-x-0 top-2 flex justify-center gap-1">
            {urls.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  i === index ? 'bg-white' : 'bg-white/40',
                )}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="이전 사진"
            className="absolute inset-y-0 left-0 w-1/3"
            onClick={() => setIndex((i) => (i - 1 + urls.length) % urls.length)}
          />
          <button
            type="button"
            aria-label="다음 사진"
            className="absolute inset-y-0 right-0 w-1/3"
            onClick={() => setIndex((i) => (i + 1) % urls.length)}
          />
        </>
      )}
    </div>
  )
}
