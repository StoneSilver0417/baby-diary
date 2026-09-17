# 육아일기 디자인 시스템

## 1. 방향

- 분위기: 크림색 종이 위에 가족 기록을 정리한 따뜻한 그림일기.
- 핵심 재료: 흰 종이 카드, 살구색 포인트, 파스텔 스티커 장식, Hi Melody 손글씨 제목.
- 모바일 우선이며 긴 글은 문서 자체가 자연스럽게 세로 스크롤한다.

## 2. 색상

- 모든 색은 `src/index.css`의 semantic token을 사용한다.
- 배경은 `bg-background`, 본문은 `text-foreground`, 보조 문구는 `text-muted-foreground`를 쓴다.
- 종이 표면은 `bg-card`와 `border-border`, 강조는 `primary` 또는 기존 sticker token만 사용한다.
- 컴포넌트에 raw hex/rgb 색상을 추가하지 않는다.

## 3. 타이포그래피

- 기본 본문은 시스템 sans-serif와 Tailwind 기본 type scale을 사용한다.
- 서비스명과 다이어리 감성의 짧은 제목만 `font-hand`를 사용한다.
- 페이지 제목은 `text-lg font-semibold`, 카드 제목은 `text-base font-semibold`, 본문은 `text-sm leading-6`을 기준으로 한다.

## 4. 간격과 형태

- 간격은 Tailwind 4px 단위 scale을 사용한다.
- 모바일 페이지 좌우 여백은 `p-5` 또는 `px-5`, 읽기 폭은 `max-w-2xl`로 제한한다.
- 중요 문서 카드는 `rounded-3xl border border-border bg-card`로 종이 뭉치처럼 표현한다.
- 클릭 영역은 최소 40px 이상을 확보하고 safe-area 유틸을 유지한다.

## 5. 재사용 프리미티브와 상태

- **Page header**: 왼쪽 뒤로가기 아이콘 + `text-lg font-semibold` 제목. 링크에는 명확한 `aria-label`과 focus ring을 둔다.
- **Paper card**: `rounded-3xl`, semantic border/card colors, 넉넉한 `p-5`; 긴 설명은 section과 list로 구조화한다.
- **Text link**: `text-muted-foreground underline underline-offset-2`; hover/focus에서 foreground로 선명해진다.
- **Primary form controls**: 기존 shadcn `Button`, `Input`, `Label`을 그대로 사용하며 disabled 상태를 유지한다.

## 6. 접근성

- 문서 화면은 `main`, `header`, `section`, heading hierarchy를 사용한다.
- 아이콘 단독 버튼/링크에는 한국어 접근성 이름을 제공한다.
- 이메일과 외부 연락 수단은 실제 `mailto:` 링크로 제공한다.
- 색상만으로 의미를 전달하지 않으며 focus-visible 상태를 숨기지 않는다.

## 7. 반응형

- 375px에서 가로 스크롤 없이 읽을 수 있어야 한다.
- 768px 이상에서는 카드 폭만 제한하고 정보 구조를 바꾸지 않는다.
- 데스크톱에서도 모바일 다이어리의 친밀한 읽기 폭을 유지한다.

## 8. 허용된 부채

- 기존 shadcn primitive의 radius가 이 문서의 중요 문서 카드보다 작다. 기존 화면 호환을 위해 전역 primitive는 변경하지 않는다.
- React 개발 보조 도구는 현재 프로젝트에 설치되어 있지 않으며, 기능 범위를 벗어나는 의존성 변경은 별도 작업으로 남긴다.
