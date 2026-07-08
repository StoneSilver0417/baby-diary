import { useCallback } from 'react'
import { Link, useLocation, useNavigate, type LinkProps, type To } from 'react-router'

function historyIdx() {
  return (window.history.state?.idx as number | undefined) ?? 0
}

function toPathname(to: To) {
  return typeof to === 'string' ? to.split('?')[0].split('#')[0] : (to.pathname ?? '')
}

/** 홈으로 이동 — 히스토리 스택이 ['/', 현재화면] 형태(홈 앵커 불변식)라면 -1로 pop해
 * 앵커 위치로 돌아가고, 앵커가 없는 상태(브라우저 탭 딥링크 등)라면 replace로 대체한다. */
export function useGoHome() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return useCallback(() => {
    if (pathname === '/') return
    if (historyIdx() > 0) navigate(-1)
    else navigate('/', { replace: true })
  }, [pathname, navigate])
}

/** 네비게이션 규율을 지키는 Link: 홈으로 가는 이동은 useGoHome에 위임하고,
 * 비홈→비홈 이동은 replace로 처리해 히스토리 스택이 항상 ['/'] 또는 ['/', 현재화면]을
 * 유지하도록 한다(홈 앵커 불변식). 홈에서 출발하는 이동은 기본 push 그대로 둔다. */
export function AppLink({ to, onClick, ...props }: LinkProps) {
  const { pathname } = useLocation()
  const goHome = useGoHome()
  const isHomeTarget = toPathname(to) === '/'

  if (isHomeTarget) {
    return (
      <Link
        to="/"
        {...props}
        onClick={(e) => {
          onClick?.(e)
          if (e.defaultPrevented) return
          e.preventDefault()
          goHome()
        }}
      />
    )
  }

  return <Link to={to} replace={pathname !== '/'} onClick={onClick} {...props} />
}
