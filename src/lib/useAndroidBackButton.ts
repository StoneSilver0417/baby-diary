import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

/**
 * 안드로이드 하드웨어/제스처 뒤로가기 — 기본값은 그냥 앱을 종료시켜버림(플러그인 리스너가 없으면
 * WebView 히스토리를 확인하지 않음). 이전 화면이 있으면 그리로, 없으면(=메인) 앱을 종료하도록 연결.
 */
export function useAndroidBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listenerPromise = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        CapacitorApp.exitApp()
      }
    })

    return () => {
      listenerPromise.then((listener) => listener.remove())
    }
  }, [])
}
