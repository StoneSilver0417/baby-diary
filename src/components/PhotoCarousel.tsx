import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const SWIPE_THRESHOLD = 50 // px

export function PhotoCarousel({
  urls,
  className,
  fit = 'cover',
  fill = false,
}: {
  urls: string[]
  className?: string
  /** 이미지 맞춤: 피드 썸네일은 cover(꽉 채움), 상세 뷰어는 contain(전체 표시) */
  fit?: 'cover' | 'contain'
  /** true면 정사각형 대신 부모 높이를 꽉 채운다(전체화면 뷰어용) */
  fill?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef(0)

  if (urls.length === 0) return null

  function handlePointerDown(e: React.PointerEvent) {
    if (urls.length <= 1) return
    startXRef.current = e.clientX
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    setDragOffset(e.clientX - startXRef.current)
  }

  function endDrag() {
    if (!dragging) return
    if (dragOffset <= -SWIPE_THRESHOLD && index < urls.length - 1) {
      setIndex((i) => i + 1)
    } else if (dragOffset >= SWIPE_THRESHOLD && index > 0) {
      setIndex((i) => i - 1)
    }
    setDragging(false)
    setDragOffset(0)
  }

  return (
    <div
      className={cn(
        'relative w-full touch-pan-y overflow-hidden',
        fill ? 'h-full' : 'aspect-square bg-muted',
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className={cn('flex size-full', !dragging && 'transition-transform duration-300 ease-out')}
        style={{
          transform: `translateX(calc(${-index * 100}% + ${dragging ? dragOffset : 0}px))`,
        }}
      >
        {urls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            draggable={false}
            className={cn('size-full shrink-0', fit === 'contain' ? 'object-contain' : 'object-cover')}
          />
        ))}
      </div>
      {urls.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center gap-1">
          {urls.map((_, i) => (
            <span
              key={i}
              className={cn('h-1.5 w-1.5 rounded-full', i === index ? 'bg-white' : 'bg-white/40')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
