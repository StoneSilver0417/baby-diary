import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

/**
 * 안드로이드 하드웨어/제스처 뒤로가기.
 * 브라우저 히스토리(window.history.back())를 그대로 따라가면 지금까지 들른
 * 탭 전환 기록까지 전부 되짚어가며 "왔다갔다"하게 되므로, 대신 고정 규칙을 쓴다:
 * 피드(홈)가 아니면 무조건 피드로, 피드에서는 앱을 종료.
 */
export function useAndroidBackButton() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (location.pathname === '/') {
        CapacitorApp.exitApp()
      } else {
        navigate('/')
      }
    })

    return () => {
      listenerPromise.then((listener) => listener.remove())
    }
  }, [location.pathname, navigate])
}
