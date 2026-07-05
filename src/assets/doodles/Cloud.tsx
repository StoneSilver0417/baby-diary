import type { SVGProps } from 'react'

/** 손그림 느낌의 몽글몽글한 구름 */
export function Cloud(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 44 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M11 24c-4.4 0-7.8-3.3-7.8-7.2 0-3.7 3-6.8 6.8-7.1C11 5.6 15 2.5 19.8 2.5c5.3 0 9.7 3.7 10.6 8.6 4.4.4 7.8 3.8 7.8 8 0 4.4-3.9 8-8.6 8H11.4Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
