import { ChevronLeft, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router'

type PolicySectionProps = {
  readonly title: string
  readonly children: React.ReactNode
}

function PolicySection({ title, children }: PolicySectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  )
}

export function PrivacyPolicyPage() {
  const navigate = useNavigate()

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-dvh bg-background px-5 pt-safe pb-safe">
      <div className="mx-auto w-full max-w-2xl py-5 sm:py-8">
        <header className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="이전 화면으로 돌아가기"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <div>
            <p className="font-hand text-base text-primary">우리 가족의 소중한 기록</p>
            <h1 className="text-lg font-semibold text-foreground">개인정보 처리방침</h1>
          </div>
        </header>

        <article className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <div className="absolute -right-5 -top-5 size-24 rounded-full bg-sticker-yellow/60" />
          <div className="relative space-y-7">
            <div className="flex items-start gap-3 border-b border-border pb-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sticker-mint text-sticker-mint-foreground">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="font-hand text-xl text-foreground">안심하고 기록할 수 있도록</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  육아일기(이하 “서비스”)는 가족의 개인정보와 아이의 성장 기록을 소중히
                  다루며, 개인정보보호법 등 관계 법령을 준수합니다.
                </p>
                <p className="text-xs text-muted-foreground">시행일: 2026년 9월 17일</p>
              </div>
            </div>

            <PolicySection title="1. 수집 및 이용 목적">
              <ul className="list-disc space-y-1 pl-5">
                <li>회원 가입, 로그인, 본인 식별 및 계정 관리</li>
                <li>가족 공간 생성·합류와 가족 구성원 간 기록 공유</li>
                <li>육아일기, 사진, 댓글, 좋아요, 성장 및 투자 기록의 저장·제공</li>
                <li>문의 접수와 답변, 서비스 안정성 유지 및 부정 이용 방지</li>
              </ul>
            </PolicySection>

            <PolicySection title="2. 수집하는 개인정보">
              <ul className="list-disc space-y-1 pl-5">
                <li>필수정보: 이메일 주소, 비밀번호</li>
                <li>가족정보: 가족 이름, 표시 이름, 가족 초대 및 구성원 정보</li>
                <li>아이정보: 이름, 생년월일, 키·몸무게, 성장기록과 마일스톤</li>
                <li>서비스 기록: 일기 내용·날짜·사진, 댓글, 좋아요, 투자 및 배당 기록</li>
                <li>문의 내용과 답변, 서비스 이용 과정에서 생성되는 접속·오류 정보</li>
              </ul>
              <p>
                비밀번호는 인증 제공업체인 Supabase Auth에서 암호화 방식으로 관리하며,
                서비스 운영자는 평문 비밀번호를 확인할 수 없습니다. 아이 정보는 법정대리인인
                보호자가 가족 기록을 위해 직접 입력합니다.
              </p>
            </PolicySection>

            <PolicySection title="3. 보유 및 이용 기간">
              <p>
                개인정보는 회원 탈퇴 또는 서비스 종료 시까지 보유·이용합니다. 이용자가 삭제한
                기록은 지체 없이 삭제하며, 백업 데이터는 시스템 운영 주기에 따라 순차적으로
                삭제될 수 있습니다. 관계 법령에서 별도의 보존기간을 정한 경우에는 해당 기간 동안
                분리 보관한 뒤 파기합니다.
              </p>
            </PolicySection>

            <PolicySection title="4. 개인정보의 제3자 제공">
              <p>
                서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만,
                이용자가 사전에 동의했거나 법령에 근거가 있는 경우에만 필요한 범위에서 제공할 수
                있습니다.
              </p>
            </PolicySection>

            <PolicySection title="5. 개인정보 처리 위탁">
              <div className="overflow-x-auto rounded-2xl bg-secondary/70 p-4">
                <dl className="grid min-w-80 grid-cols-[6rem_1fr] gap-x-3 gap-y-2">
                  <dt className="font-medium text-foreground">Supabase</dt>
                  <dd>회원 인증, 데이터베이스 및 사진 저장</dd>
                  <dt className="font-medium text-foreground">Vercel</dt>
                  <dd>웹 애플리케이션 호스팅 및 배포</dd>
                </dl>
              </div>
              <p>
                위 업체의 글로벌 인프라 이용 과정에서 개인정보가 국외에서 처리될 수 있습니다.
                전송 항목은 서비스 제공에 필요한 계정·기록·접속 정보이며, 암호화된 통신으로
                전송되고 회원 탈퇴 또는 위탁계약 종료 시까지 처리됩니다. 서비스는 수탁업체가
                개인정보를 안전하게 처리하도록 관리·감독합니다.
              </p>
            </PolicySection>

            <PolicySection title="6. 이용자의 권리">
              <p>
                이용자는 언제든 자신의 개인정보를 열람·수정·삭제하고 처리정지 또는 회원 탈퇴를
                요청할 수 있습니다. 설정 화면의 정보 수정·문의 기능 또는 아래 보호책임자 이메일로
                요청하면 본인 확인 후 지체 없이 처리합니다. 가족 공간에 공유된 다른 구성원의
                개인정보는 해당 구성원의 권리를 침해하지 않는 범위에서만 처리할 수 있습니다.
              </p>
            </PolicySection>

            <PolicySection title="7. 개인정보의 파기">
              <p>
                보유기간이 끝나거나 처리 목적이 달성된 개인정보는 복구하기 어려운 방법으로
                삭제합니다. 전자적 파일은 안전하게 삭제하고, 출력물이 발생한 경우에는 파쇄 또는
                소각합니다.
              </p>
            </PolicySection>

            <PolicySection title="8. 안전성 확보 조치">
              <div className="flex gap-3 rounded-2xl bg-sticker-sky/45 p-4">
                <LockKeyhole className="mt-0.5 size-5 shrink-0 text-sticker-sky-foreground" aria-hidden="true" />
                <ul className="list-disc space-y-1 pl-4">
                  <li>Supabase Row Level Security를 통한 가족별 데이터 접근 통제</li>
                  <li>TLS 암호화 통신과 인증정보의 안전한 관리</li>
                  <li>최소 권한 원칙에 따른 관리자 접근 제한</li>
                  <li>사진 업로드 용량·형식 제한과 서비스 데이터의 지속적인 점검</li>
                </ul>
              </div>
            </PolicySection>

            <PolicySection title="9. 개인정보 보호책임자">
              <p>개인정보 관련 문의, 불만 처리 및 권리 행사는 아래 연락처로 요청해 주세요.</p>
              <p>
                책임자: 육아일기 운영자
                <br />
                이메일:{' '}
                <a
                  href="mailto:waterdrop11@naver.com"
                  className="font-medium text-primary underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  waterdrop11@naver.com
                </a>
              </p>
            </PolicySection>

            <PolicySection title="10. 처리방침의 변경">
              <p>
                법령이나 서비스 내용이 변경되어 본 방침을 수정하는 경우, 시행 전에 서비스 내에서
                알립니다. 중요한 변경은 이해하기 쉬운 방법으로 별도 안내합니다.
              </p>
            </PolicySection>
          </div>
        </article>
      </div>
    </main>
  )
}
