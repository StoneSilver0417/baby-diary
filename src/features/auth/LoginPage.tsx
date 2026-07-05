import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cloud, Footprint, Star, Sun } from '@/assets/doodles'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    const error = await signIn(email, password)
    setLoading(false)
    if (error) toast.error(error)
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-background px-6 pt-safe pb-safe">
      <Sun className="absolute left-6 top-12 size-10 text-sticker-yellow-foreground/70" />
      <Cloud className="absolute right-4 top-24 size-12 text-sticker-sky-foreground/60" />
      <Star className="absolute bottom-28 left-8 size-7 text-sticker-pink-foreground/60" />
      <Footprint className="absolute bottom-16 right-10 size-8 rotate-12 text-sticker-mint-foreground/60" />

      <div className="text-center">
        <h1 className="font-hand text-4xl font-semibold text-foreground">육아일기</h1>
        <p className="mt-1 font-hand text-lg text-muted-foreground">우리 가족만의 기록</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '로그인 중…' : '로그인'}
        </Button>
      </form>
    </div>
  )
}
