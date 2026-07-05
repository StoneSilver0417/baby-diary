import type { SVGProps } from 'react'

/** 크레용으로 쓱쓱 그린 듯한 손그림 해 */
export function Sun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="20" cy="20" r="8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M20 4v4.2M20 31.8V36M36 20h-4.2M8.2 20H4M31 9l-2.8 2.8M11.8 28.2 9 31M31 31l-2.8-2.8M11.8 11.8 9 9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
