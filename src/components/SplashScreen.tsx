import { Cloud, Footprint, Star, Sun } from '@/assets/doodles'

/** 세션 확인 중 보여주는 브랜드 로딩 화면 (로그인 화면과 톤을 맞춤) */
export function SplashScreen() {
  return (
    <div className="relative flex h-dvh flex-col items-center justify-center gap-3 overflow-hidden bg-background">
      <Sun className="absolute left-6 top-12 size-10 text-sticker-yellow-foreground/70" />
      <Cloud className="absolute right-4 top-24 size-12 text-sticker-sky-foreground/60" />
      <Star className="absolute bottom-28 left-8 size-7 text-sticker-pink-foreground/60" />

      <Footprint className="size-9 animate-bounce text-primary/70" />
      <h1 className="font-hand text-3xl font-semibold text-foreground">육아일기</h1>
      <p className="animate-pulse font-hand text-base text-muted-foreground">불러오는 중…</p>
    </div>
  )
}
