import type { SVGProps } from 'react'

/** 살짝 삐뚤빼뚤한 손그림 별 */
export function Star(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M18.2 3.2 22 13.6l11 .7-8.7 7 3 10.7-9.1-6.3-9.3 6 3.3-10.6-8.6-7.2 11-.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
