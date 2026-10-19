import { useMemo, useState } from 'react'
import { Bot, CircleHelp, Monitor, RefreshCw, Smartphone, Tablet, Trash2, X } from 'lucide-react'
import type { Analytics, Visit, VisitsPage } from '../lib/types'
import { api } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { compact, countryName, flagEmoji, full } from '../lib/geo'
import { formatDateTime, timeAgo } from '../lib/format'
import { cn } from '../lib/utils'
import { BarList, ColumnChart, SeriesTable } from '../components/charts'
import { Badge, Button, Card, ErrorNote, Input, PageHeader, Spinner, Switch } from '../components/ui'
import { ConfirmDialog } from '../components/Modal'
import { useToast } from '../components/Toast'

type Range = '24h' | '7d' | '30d' | '90d'
const RANGES: { id: Range; label: string; long: string }[] = [
  { id: '24h', label: '24 hours', long: 'previous 24 hours' },
  { id: '7d', label: '7 days', long: 'previous 7 days' },
  { id: '30d', label: '30 days', long: 'previous 30 days' },
  { id: '90d', label: '90 days', long: 'previous 90 days' },
]

const DEVICE_ICON: Record<string, typeof Monitor> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet, bot: Bot }
const DEVICE_LABEL: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet', bot: 'Bot', unknown: 'Unknown' }

export function VisitorsView() {
  const toast = useToast()
  const [range, setRange] = useState<Range>('7d')
  const [bots, setBots] = useState(false)
  const [country, setCountry] = useState<string | null>(null)
  const [ip, setIp] = useState('')
  const [chartMode, setChartMode] = useState<'chart' | 'table'>('chart')
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  const analytics = useFetch<Analytics>(`/admin/analytics?range=${range}&bots=${bots ? 1 : 0}`)
  const a = analytics.data

  const listQuery = useMemo(() => {
    const q = new URLSearchParams({ bots: bots ? '1' : '0', limit: '25' })
    if (a) q.set('from', a.since)
    if (country) q.set('country', country)
    if (ip.trim()) q.set('ip', ip.trim())
    return q.toString()
  }, [a, bots, country, ip])
  const visits = useFetch<VisitsPage>(`/admin/analytics/visits?${listQuery}`, a !== null)

  // "Load more" pages are tied to the filters they were loaded for, and drop when filters change.
  const [more, setMore] = useState<{ query: string; items: Visit[]; next: string | null } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const extra = more && more.query === listQuery ? more : null
  const items = [...(visits.data?.items ?? []), ...(extra?.items ?? [])]
  const nextBefore = extra ? extra.next : (visits.data?.nextBefore ?? null)

  const loadMore = async () => {
    if (!nextBefore) return
    setLoadingMore(true)
    try {
      const page = await api.get<VisitsPage>(`/admin/analytics/visits?${listQuery}&before=${encodeURIComponent(nextBefore)}`)
      setMore({ query: listQuery, items: [...(extra?.items ?? []), ...page.items], next: page.nextBefore })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load more')
    } finally {
      setLoadingMore(false)
    }
  }

  const clearAll = async () => {
    setClearing(true)
    try {
      const res = await api.del<{ deleted: number }>('/admin/analytics')
      toast.success(`Deleted ${full(res.deleted)} visits`)
      setConfirmClear(false)
      analytics.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete')
    } finally {
      setClearing(false)
    }
  }

  const refresh = () => {
    analytics.reload()
    visits.reload()
  }

  const rangeInfo = RANGES.find((r) => r.id === range)!

  return (
    <div className="space-y-6">
      <PageHeader title="Visitors" description="Who is looking at your portfolio: where from, on what device, and how they found it." />

      {/* One filter row above everything it scopes. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div role="group" aria-label="Date range" className="inline-flex rounded-lg border border-border bg-surface p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className={cn('rounded-md px-3 py-1.5 text-sm transition-colors', range === r.id ? 'bg-surface-2 font-medium text-text' : 'text-muted hover:text-text')}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Switch checked={bots} onChange={setBots} label="Include bots" />
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={refresh}>
            <RefreshCw size={14} aria-hidden className={cn((analytics.loading || visits.loading) && 'animate-spin')} /> Refresh
          </Button>
        </div>
      </div>

      {analytics.error && <ErrorNote message={analytics.error} onRetry={analytics.reload} />}
      {!a && !analytics.error && <Spinner />}

      {a && (
        <>
          <div className={cn('grid grid-cols-2 gap-4 transition-opacity duration-200 lg:grid-cols-4', analytics.loading && 'opacity-50')}>
            <Stat label="Visits" value={a.totals.visits} previous={a.previous.visits} against={rangeInfo.long} />
            <Stat label="Unique visitors" value={a.totals.visitors} previous={a.previous.visitors} against={rangeInfo.long} hint="Distinct IP addresses" />
            <Stat label="Page views" value={a.totals.pageViews} previous={a.previous.pageViews} against={rangeInfo.long} />
            <Stat label={bots ? 'Bots included' : 'Bots hidden'} value={a.totals.bots} hint="Crawlers and scrapers" />
          </div>

          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Visits per {a.unit}</h3>
                <p className="text-xs text-muted">Times are UTC. A visit is one browser session; reloads within 30 minutes count as page views.</p>
              </div>
              <div role="group" aria-label="Chart or table" className="inline-flex rounded-lg border border-border p-0.5 text-xs">
                {(['chart', 'table'] as const).map((m) => (
                  <button key={m} type="button" aria-pressed={chartMode === m} onClick={() => setChartMode(m)} className={cn('rounded-md px-2.5 py-1 capitalize', chartMode === m ? 'bg-surface-2 font-medium text-text' : 'text-muted hover:text-text')}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {a.totals.visits === 0 && !analytics.loading && <p className="mb-2 text-sm text-muted">No visits recorded in this range yet.</p>}
            {chartMode === 'chart' ? <ColumnChart points={a.series} unit={a.unit} dimmed={analytics.loading} /> : <SeriesTable points={a.series} unit={a.unit} />}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Countries</h3>
              <BarList
                rows={a.countries}
                unknownLabel="Unknown"
                render={(code) => (
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{flagEmoji(code)}</span>
                    {countryName(code)}
                  </span>
                )}
                onSelect={(code) => setCountry((c) => (c === code ? null : code))}
                selected={country}
                dimmed={analytics.loading}
              />
              <p className="mt-2 px-2 text-xs text-muted">Click a country to filter the visits below. Location comes from the hosting provider’s edge and isn’t available on localhost.</p>
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Devices</h3>
              <BarList
                rows={a.devices}
                unknownLabel="Unknown"
                render={(t) => <span>{DEVICE_LABEL[t ?? 'unknown'] ?? t}</span>}
                dimmed={analytics.loading}
              />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Browsers</h3>
              <BarList rows={a.browsers} unknownLabel="Unknown" dimmed={analytics.loading} />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Operating systems</h3>
              <BarList rows={a.systems} unknownLabel="Unknown" dimmed={analytics.loading} />
            </Card>
            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-3 font-semibold">Where visitors came from</h3>
              <BarList rows={a.referrers} unknownLabel="Direct / unknown" dimmed={analytics.loading} />
            </Card>
          </div>

          <VisitsTable
            items={items}
            loading={visits.loading}
            error={visits.error}
            onRetry={visits.reload}
            hasMore={nextBefore !== null}
            loadingMore={loadingMore}
            onMore={() => void loadMore()}
            ip={ip}
            onIp={setIp}
            country={country}
            onCountry={setCountry}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted">
            <p>
              IP addresses are personal data. Visits are deleted automatically after {a.retentionDays} days, and visitors who send Do Not Track are never recorded. Mention analytics in your privacy notice.
            </p>
            <Button size="sm" variant="danger" onClick={() => setConfirmClear(true)}>
              <Trash2 size={14} aria-hidden /> Delete all visit data
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Delete all visit data?"
        confirmLabel="Delete everything"
        busy={clearing}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => void clearAll()}
        message="Every recorded visit, including IP addresses, will be removed permanently. New visits are recorded again from now on."
      />
    </div>
  )
}

function Stat({ label, value, previous, against, hint }: { label: string; value: number; previous?: number; against?: string; hint?: string }) {
  const diff = previous === undefined ? null : previous === 0 ? (value === 0 ? 0 : null) : Math.round(((value - previous) / previous) * 100)
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold" title={full(value)}>
        {value >= 10_000 ? compact(value) : full(value)}
      </p>
      <p className="mt-1 min-h-4 text-xs text-muted">
        {previous === undefined ? (
          hint
        ) : diff === null ? (
          <>New vs. {against}</>
        ) : (
          <>
            <span className={cn('font-medium', diff > 0 ? 'text-ok' : 'text-muted')}>
              {diff > 0 ? '▲' : diff < 0 ? '▼' : '–'} {Math.abs(diff) > 999 ? '>999' : Math.abs(diff)}%
            </span>{' '}
            vs. {against}
          </>
        )}
      </p>
    </div>
  )
}

function DeviceCell({ v }: { v: Visit }) {
  const Icon = DEVICE_ICON[v.deviceType] ?? CircleHelp
  const detail = [v.browser, v.os].filter(Boolean).join(' · ')
  return (
    <span className="flex items-center gap-2">
      <Icon size={15} className={cn('shrink-0', v.isBot ? 'text-warn' : 'text-muted')} aria-label={DEVICE_LABEL[v.deviceType] ?? 'Unknown'} />
      <span className="min-w-0">
        <span className="block truncate">{detail || 'Unknown'}</span>
        {v.language && <span className="block text-[11px] text-muted">{v.language}</span>}
      </span>
    </span>
  )
}

function Place({ v }: { v: Visit }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden>{flagEmoji(v.country)}</span>
      <span className="min-w-0 truncate">{v.country ? [v.city, countryName(v.country)].filter(Boolean).join(', ') : 'Unknown'}</span>
    </span>
  )
}

interface TableProps {
  items: Visit[]
  loading: boolean
  error: string | null
  onRetry: () => void
  hasMore: boolean
  loadingMore: boolean
  onMore: () => void
  ip: string
  onIp: (ip: string) => void
  country: string | null
  onCountry: (code: string | null) => void
}

function VisitsTable({ items, loading, error, onRetry, hasMore, loadingMore, onMore, ip, onIp, country, onCountry }: TableProps) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="font-semibold">Recent visits</h3>
          <p className="text-xs text-muted">Newest first, within the selected range. Click an IP or country to filter.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {country && (
            <button type="button" onClick={() => onCountry(null)} className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent">
              {flagEmoji(country)} {countryName(country)} <X size={12} aria-hidden /> <span className="sr-only">Remove country filter</span>
            </button>
          )}
          <Input value={ip} onChange={(e) => onIp(e.target.value)} placeholder="Find an IP…" aria-label="Filter visits by IP address" className="h-9 w-40 font-mono text-xs" spellCheck={false} maxLength={45} />
        </div>
      </div>
      {error && <div className="p-4"><ErrorNote message={error} onRetry={onRetry} /></div>}
      {items.length === 0 && !error && (loading ? <Spinner /> : <p className="px-5 py-8 text-center text-sm text-muted">No visits match these filters.</p>)}

      {items.length > 0 && (
        <div className={cn('transition-opacity duration-200', loading && 'opacity-50')}>
          {/* Wide screens: a table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="px-5 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">IP address</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Device</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Page</th>
                  <th className="px-5 py-2 text-right font-medium">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((v) => (
                  <tr key={v.id} className="align-top hover:bg-surface-2/50">
                    <td className="whitespace-nowrap px-5 py-2.5 text-xs text-muted" title={formatDateTime(v.createdAt)}>
                      {timeAgo(v.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <button type="button" onClick={() => onIp(v.ip)} className="font-mono text-xs hover:text-accent hover:underline" title="Filter by this IP">
                        {v.ip}
                      </button>
                      {v.isBot && <span className="ml-2"><Badge tone="warn">Bot</Badge></span>}
                    </td>
                    <td className="max-w-48 px-3 py-2.5">
                      {v.country ? (
                        <button type="button" onClick={() => onCountry(v.country as string)} className="max-w-full text-left hover:text-accent" title="Filter by this country">
                          <Place v={v} />
                        </button>
                      ) : (
                        <Place v={v} />
                      )}
                    </td>
                    <td className="max-w-52 px-3 py-2.5"><DeviceCell v={v} /></td>
                    <td className="max-w-40 truncate px-3 py-2.5 text-xs text-muted">{v.referrerHost ?? 'Direct'}</td>
                    <td className="max-w-32 truncate px-3 py-2.5 font-mono text-xs text-muted">{v.path ?? '/'}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{v.pageViews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: one card per visit */}
          <ul className="divide-y divide-border md:hidden">
            {items.map((v) => (
              <li key={v.id} className="space-y-1.5 px-5 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => onIp(v.ip)} className="font-mono text-xs">{v.ip}</button>
                  <span className="text-xs text-muted">{timeAgo(v.createdAt)}</span>
                </div>
                <Place v={v} />
                <DeviceCell v={v} />
                <p className="text-xs text-muted">
                  {v.referrerHost ?? 'Direct'} · {v.path ?? '/'} · {v.pageViews} view{v.pageViews === 1 ? '' : 's'}
                  {v.isBot && <> · <Badge tone="warn">Bot</Badge></>}
                </p>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="border-t border-border p-3 text-center">
              <Button size="sm" loading={loadingMore} onClick={onMore}>Load more</Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
