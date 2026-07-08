import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router'
import { isStandaloneDisplay } from '@/lib/pwa'

const EXEMPT_PATHS = ['/login', '/onboarding']

/** react-router가 history.state에 기록하는 스택 인덱스. 공식 API는 아니지만
 * v6~v8에서 안정적으로 유지되는 내부 규약 — 메이저 업그레이드 시 재검증할 것. */
function historyIdx() {
  return (window.history.state?.idx as number | undefined) ?? 0
}

/**
 * "홈 앵커 불변식" 기반 뒤로가기: 히스토리 스택을 항상 ['/'] 또는 ['/', 현재화면]
 * 깊이 2 이하로 유지해 "비홈에서 뒤로가기 = 홈", "홈에서 뒤로가기 = 앱 최소화(OS 기본)"
 * 라는 기존 Capacitor 하드웨어 백버튼 규칙을 웹 표준 history API만으로 재현한다.
 * 스택 유지는 각 네비게이션 호출부(src/lib/navigation.tsx의 AppLink·useGoHome)의
 * 규율이 담당하고, 이 훅은 두 가지 보조 역할만 한다.
 */
export function useBackNavigation() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const navigate = useNavigate()
  const prevIdxRef = useRef(historyIdx())
  const normalizedRef = useRef(false)

  // (B) standalone PWA로 딥링크 진입 시 히스토리 바닥에 홈 앵커를 끼워 넣는다.
  // 브라우저 탭 딥링크는 "공유받은 곳으로 돌아가기" 기대를 지키기 위해 제외.
  useEffect(() => {
    if (normalizedRef.current) return
    normalizedRef.current = true
    if (
      isStandaloneDisplay() &&
      historyIdx() === 0 &&
      location.pathname !== '/' &&
      !EXEMPT_PATHS.includes(location.pathname)
    ) {
      navigate('/', { replace: true })
      navigate(location, { state: location.state })
    }
    // 최초 마운트 시 1회만 실행 — 정규화 이후의 location 변화는 아래 안전망이 담당한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // (C) 뒤로 방향 POP이 비홈에 착지하면 홈으로 교정하는 안전망.
  // 네비게이션 규율이 지켜지는 한 발동하지 않는다.
  useEffect(() => {
    const idx = historyIdx()
    const delta = idx - prevIdxRef.current
    prevIdxRef.current = idx
    if (
      navigationType === 'POP' &&
      delta < 0 &&
      location.pathname !== '/' &&
      !EXEMPT_PATHS.includes(location.pathname)
    ) {
      navigate('/', { replace: true })
    }
  }, [location, navigationType, navigate])
}
