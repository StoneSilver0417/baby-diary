import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { GrowthRecord } from '@/types/database'

type Metric = 'height' | 'weight'

const METRICS: Record<Metric, { label: string; unit: string; pick: (r: GrowthRecord) => number | null }> = {
  height: { label: '키', unit: 'cm', pick: (r) => r.height_cm },
  weight: { label: '몸무게', unit: 'kg', pick: (r) => r.weight_kg },
}

const W = 320
const H = 180
const PAD = { top: 16, right: 16, bottom: 24, left: 36 }

export function GrowthChart({ records }: { records: GrowthRecord[] }) {
  const [metric, setMetric] = useState<Metric>('height')

  const points = useMemo(() => {
    const { pick } = METRICS[metric]
    return records
      .map((r) => ({ date: r.record_date, value: pick(r) }))
      .filter((p): p is { date: string; value: number } => p.value !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [records, metric])

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
        {(Object.keys(METRICS) as Metric[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
              metric === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {METRICS[m].label}
          </button>
        ))}
      </div>

      {points.length < 2 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          기록이 2개 이상이면 곡선이 표시돼요.
        </p>
      ) : (
        <Chart points={points} unit={METRICS[metric].unit} />
      )}
    </div>
  )
}

function Chart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  const values = points.map((p) => p.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  // y축에 여유를 둬 곡선이 상하 끝에 붙지 않게
  const pad = (maxV - minV) * 0.15 || 1
  const yMin = minV - pad
  const yMax = maxV + pad

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')
  const ticks = [yMin, (yMin + yMax) / 2, yMax]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-primary" role="img" aria-label="성장 곡선">
      {/* 눈금선·라벨 (recessive) */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(t)}
            y2={y(t)}
            className="stroke-border"
            strokeWidth={1}
          />
          <text
            x={PAD.left - 6}
            y={y(t) + 3}
            textAnchor="end"
            className="fill-muted-foreground text-[9px]"
          >
            {t.toFixed(1)}
          </text>
        </g>
      ))}

      {/* 데이터 선 (2px) + 마커 (r=4 → 8px) */}
      <polyline points={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={4} fill="currentColor" />
      ))}

      {/* x축 라벨: 처음과 끝만 */}
      {[0, points.length - 1].map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 6}
          textAnchor={i === 0 ? 'start' : 'end'}
          className="fill-muted-foreground text-[9px]"
        >
          {format(new Date(points[i].date), 'yy.MM')}
        </text>
      ))}

      <text x={W - PAD.right} y={PAD.top - 4} textAnchor="end" className="fill-muted-foreground text-[9px]">
        {unit}
      </text>
    </svg>
  )
}
