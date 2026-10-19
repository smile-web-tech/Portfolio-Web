import { useState, type KeyboardEvent, type ReactNode } from 'react'
import type { SeriesPoint, Tally } from '../lib/types'
import { cn } from '../lib/utils'
import { compact, full } from '../lib/geo'

const PLOT_HEIGHT = 200

/** Integer-friendly "nice" axis: at most ~5 ticks, top >= max. */
function niceScale(max: number) {
  const raw = Math.max(max, 1) / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const f = raw / pow
  const step = Math.max(1, (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow)
  const top = Math.max(step, Math.ceil(max / step) * step)
  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  return { top, ticks }
}

const hourFmt = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
const dayShort = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const dayLong = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

// eslint-disable-next-line react-refresh/only-export-components
export function bucketLabel(start: string, unit: 'hour' | 'day', long = false) {
  const d = new Date(start)
  if (unit === 'hour') return long ? `${dayShort.format(d)}, ${hourFmt.format(d)} UTC` : hourFmt.format(d)
  return long ? dayLong.format(d) : dayShort.format(d)
}

interface ColumnChartProps {
  points: SeriesPoint[]
  unit: 'hour' | 'day'
  dimmed?: boolean
}

/**
 * Visits per hour/day. One series, one hue: columns are capped at 24px with a 4px rounded top and a
 * square base, 2px apart; gridlines are solid hairlines. Each column is its own hover target (the full
 * band, far bigger than the bar); arrow keys move between columns when the chart has focus.
 */
export function ColumnChart({ points, unit, dimmed }: ColumnChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(0, ...points.map((p) => p.visits))
  const { top, ticks } = niceScale(max)
  const n = points.length
  const labelEvery = Math.max(1, Math.ceil(n / 8))
  const peak = max > 0 ? points.findIndex((p) => p.visits === max) : -1

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setActive((i) => Math.min(n - 1, Math.max(0, (i ?? n) + (e.key === 'ArrowRight' ? 1 : -1))))
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setActive(e.key === 'Home' ? 0 : n - 1)
    } else if (e.key === 'Escape') setActive(null)
  }

  const tip = active !== null ? points[active] : null
  const total = points.reduce((a, p) => a + p.visits, 0)

  return (
    <div className={cn('transition-opacity duration-200', dimmed && 'opacity-50')}>
      <div
        tabIndex={0}
        role="group"
        aria-label={`Visits per ${unit}: ${full(total)} in total. Use the left and right arrow keys to read each ${unit}, or switch to Table.`}
        onKeyDown={onKey}
        onFocus={() => setActive((i) => i ?? n - 1)}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="flex rounded-md"
      >
        <div className="relative w-9 shrink-0" style={{ height: PLOT_HEIGHT }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-2 translate-y-1/2 text-[11px] tabular-nums text-muted" style={{ bottom: `${(t / top) * 100}%` }}>
              {compact(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height: PLOT_HEIGHT }}>
            {ticks.map((t) => (
              <div key={t} aria-hidden className={cn('absolute inset-x-0 border-t', t === 0 ? 'border-[#334257]' : 'border-border/50')} style={{ bottom: `${(t / top) * 100}%` }} />
            ))}

            <div className="absolute inset-0 flex items-end gap-[2px]">
              {points.map((p, i) => (
                <div key={p.start} className="relative flex h-full min-w-0 flex-1 items-end justify-center" onPointerEnter={() => setActive(i)} onPointerMove={() => active !== i && setActive(i)}>
                  <span
                    className={cn('block w-full max-w-6 rounded-t-[4px] bg-accent transition-[opacity,filter]', active === i && 'brightness-125')}
                    style={{ height: `${(p.visits / top) * 100}%`, minHeight: p.visits > 0 ? 2 : 0, opacity: active === null || active === i ? 1 : 0.6 }}
                  />
                  {i === peak && active === null && (
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[11px] font-medium text-text" style={{ bottom: `calc(${(p.visits / top) * 100}% + 4px)` }}>
                      {full(p.visits)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {tip && active !== null && (
              <div
                role="status"
                className="pointer-events-none absolute z-10 w-44 rounded-lg border border-border bg-surface-2 p-2.5 shadow-xl"
                style={{
                  bottom: `calc(${Math.min(92, (tip.visits / top) * 100)}% + 10px)`,
                  left: `${((active + 0.5) / n) * 100}%`,
                  transform: `translateX(${active < n * 0.2 ? '-12%' : active > n * 0.8 ? '-88%' : '-50%'})`,
                }}
              >
                <p className="text-[11px] text-muted">{bucketLabel(tip.start, unit, true)}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span aria-hidden className="h-0.5 w-3 rounded bg-accent" />
                  <strong className="text-sm font-semibold text-text">{full(tip.visits)}</strong> visits
                </p>
                <p className="mt-0.5 pl-5 text-xs text-muted">
                  <strong className="font-semibold text-text">{full(tip.visitors)}</strong> unique visitors
                </p>
                <p className="mt-0.5 pl-5 text-xs text-muted">
                  <strong className="font-semibold text-text">{full(tip.pageViews)}</strong> page views
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-[2px] pt-2" style={{ height: 28 }} aria-hidden>
            {points.map((p, i) => (
              <div key={p.start} className="relative min-w-0 flex-1">
                {(n - 1 - i) % labelEvery === 0 && (
                  <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-muted">{bucketLabel(p.start, unit)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The table twin of the chart: every number, no hover required. */
export function SeriesTable({ points, unit }: { points: SeriesPoint[]; unit: 'hour' | 'day' }) {
  return (
    <div className="max-h-[260px] overflow-auto rounded-md border border-border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Visits per {unit}</caption>
        <thead className="sticky top-0 bg-surface text-xs text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">{unit === 'hour' ? 'Hour (UTC)' : 'Day (UTC)'}</th>
            <th className="px-3 py-2 text-right font-medium">Visits</th>
            <th className="px-3 py-2 text-right font-medium">Unique</th>
            <th className="px-3 py-2 text-right font-medium">Page views</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {[...points].reverse().map((p) => (
            <tr key={p.start}>
              <td className="px-3 py-1.5 text-xs text-muted">{bucketLabel(p.start, unit, true)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{full(p.visits)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{full(p.visitors)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{full(p.pageViews)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface BarListProps {
  rows: Tally[]
  /** Text shown for a null name (unknown / direct). */
  unknownLabel: string
  render?: (name: string | null) => ReactNode
  onSelect?: (name: string) => void
  selected?: string | null
  dimmed?: boolean
}

/**
 * Horizontal bars for a nominal breakdown. One category axis, one hue for every bar (a value-ramp on
 * unordered categories would double-encode length), the number at the bar tip, names in text ink.
 */
export function BarList({ rows, unknownLabel, render, onSelect, selected, dimmed }: BarListProps) {
  const max = Math.max(1, ...rows.map((r) => r.visits))
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted">No data in this range.</p>

  return (
    <ul className={cn('space-y-0.5 transition-opacity duration-200', dimmed && 'opacity-50')}>
      {rows.map((r) => {
        const label = r.name === null ? unknownLabel : null
        const pct = (r.visits / max) * 82
        const content = (
          <>
            <span className="w-28 shrink-0 truncate text-left text-sm sm:w-36">{label ?? render?.(r.name) ?? r.name}</span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="block h-2 rounded-r-[4px] bg-accent" style={{ width: `${Math.max(pct, 1.5)}%` }} />
              <span className="shrink-0 text-xs tabular-nums text-muted">
                <strong className="font-semibold text-text">{full(r.visits)}</strong>
              </span>
            </span>
          </>
        )
        const title = `${label ?? r.name}: ${full(r.visits)} visits, ${full(r.visitors)} unique visitors`
        const rowClass = cn('flex w-full items-center gap-3 rounded-md px-2 py-1.5', r.name !== null && selected === r.name ? 'bg-accent/10' : 'hover:bg-surface-2')
        return (
          <li key={r.name ?? '∅'}>
            {onSelect && r.name !== null ? (
              <button type="button" title={title} aria-pressed={selected === r.name} onClick={() => onSelect(r.name as string)} className={rowClass}>
                {content}
              </button>
            ) : (
              <div title={title} className={rowClass}>
                {content}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
