import type { SVGProps } from 'react'

/** 아기 발자국 손그림 */
export function Footprint(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <ellipse cx="14" cy="25" rx="8.5" ry="12" stroke="currentColor" strokeWidth="2.1" />
      <ellipse cx="5" cy="6.5" rx="2.6" ry="3.4" stroke="currentColor" strokeWidth="2.1" />
      <ellipse cx="11.5" cy="3.6" rx="2.8" ry="3.8" stroke="currentColor" strokeWidth="2.1" />
      <ellipse cx="18.3" cy="4" rx="2.6" ry="3.6" stroke="currentColor" strokeWidth="2.1" />
      <ellipse cx="24" cy="6.8" rx="2.3" ry="3.1" stroke="currentColor" strokeWidth="2.1" />
    </svg>
  )
}
