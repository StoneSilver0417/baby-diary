import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Star } from '@/assets/doodles'

const DISMISS_KEY = 'baby-diary-ios-banner-dismissed'

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/** 아이폰은 네이티브 앱 배포가 불가능해 PWA 홈화면 추가가 유일한 설치 경로 — 안내 배너로 유도 */
export function IosInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isIos() && !isStandalone() && !localStorage.getItem(DISMISS_KEY)) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="mx-3 mt-3 flex items-center gap-2 rounded-2xl border border-sticker-sky bg-sticker-sky px-3 py-2.5 text-sm text-sticker-sky-foreground">
      <Star className="size-5 shrink-0" />
      <p className="flex-1 leading-tight">
        아이폰에서도 앱처럼 쓰려면 공유 버튼 → "홈 화면에 추가"를 눌러보세요.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="닫기"
        className="shrink-0 text-sticker-sky-foreground/70"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
