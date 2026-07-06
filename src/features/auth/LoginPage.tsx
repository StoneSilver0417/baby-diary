import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cloud, Footprint, Star, Sun } from '@/assets/doodles'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (mode === 'signup' && password !== passwordConfirm) {
      toast.error('비밀번호가 서로 달라요.')
      return
    }
    setLoading(true)
    const error = mode === 'login' ? await signIn(email, password) : await signUp(email, password)
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
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
            />
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? mode === 'login'
              ? '로그인 중…'
              : '가입 중…'
            : mode === 'login'
              ? '로그인'
              : '가입하기'}
        </Button>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full text-center text-sm text-muted-foreground underline underline-offset-2"
        >
          {mode === 'login' ? '계정이 없으신가요? 가입하기' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </form>
    </div>
  )
}
