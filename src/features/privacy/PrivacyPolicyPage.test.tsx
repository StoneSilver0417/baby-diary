import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PrivacyPolicyPage } from './PrivacyPolicyPage'

describe('PrivacyPolicyPage', () => {
  it('개인정보 처리에 필요한 모든 고지 항목을 제공한다', () => {
    // Given
    const requiredNotices = [
      '수집 및 이용 목적',
      '수집하는 개인정보',
      '보유 및 이용 기간',
      '개인정보 처리 위탁',
      '이용자의 권리',
      '안전성 확보 조치',
      '개인정보 보호책임자',
    ] as const

    // When
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>,
    )

    // Then
    for (const notice of requiredNotices) expect(markup).toContain(notice)
    expect(markup).toContain('waterdrop11@naver.com')
    expect(markup).toContain('Supabase')
    expect(markup).toContain('Vercel')
  })

  it('이전 화면으로 돌아가는 접근 가능한 버튼을 제공한다', () => {
    // Given / When
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/privacy']}>
        <PrivacyPolicyPage />
      </MemoryRouter>,
    )

    // Then
    expect(markup).toContain('aria-label="이전 화면으로 돌아가기"')
  })
})
