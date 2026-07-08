/** 설치된 PWA(standalone)로 실행 중인지 판별. iOS Safari는 display-mode 미디어 쿼리 대신
 * navigator.standalone을 쓴다. Playwright는 display-mode를 에뮬레이션할 수 없어
 * sessionStorage 심으로 강제 전환할 수 있게 열어둔다. */
export function isStandaloneDisplay() {
  if (sessionStorage.getItem('debug:standalone') === '1') return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}
