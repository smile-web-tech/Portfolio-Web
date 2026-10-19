import { AlertTriangle, Briefcase, Code2, FolderKanban, Globe, GraduationCap, Image as ImageIcon, ShieldCheck } from 'lucide-react'
import type { Overview } from '../lib/types'
import { useFetch } from '../hooks/useFetch'
import { useAuth } from '../lib/auth'
import { timeAgo } from '../lib/format'
import { Badge, Card, ErrorNote, PageHeader, Spinner } from '../components/ui'

const STATS = [
  { key: 'projects', label: 'Projects', icon: FolderKanban, tab: 'projects' },
  { key: 'experience', label: 'Roles', icon: Briefcase, tab: 'experience' },
  { key: 'education', label: 'Education', icon: GraduationCap, tab: 'education' },
  { key: 'skills', label: 'Skills', icon: Code2, tab: 'skills' },
  { key: 'media', label: 'Files', icon: ImageIcon, tab: 'media' },
] as const

export function OverviewView({ go }: { go: (tab: string) => void }) {
  const { user } = useAuth()
  const { data, error, reload } = useFetch<Overview>('/admin/overview')

  if (error) return <ErrorNote message={error} onRetry={reload} />
  if (!data) return <Spinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Everything on the public site is managed from here." />

      {!user?.totpEnabled && (
        <button
          type="button"
          onClick={() => go('security')}
          className="flex w-full items-center gap-3 rounded-xl border border-warn/40 bg-warn/10 p-4 text-left text-sm transition-colors hover:bg-warn/15"
        >
          <AlertTriangle size={18} className="shrink-0 text-warn" aria-hidden />
          <span>
            <strong className="font-semibold text-warn">Two-factor authentication is off.</strong> Anyone with your password can edit your site. Turn it on in Security.
          </span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {STATS.map(({ key, label, icon: Icon, tab }) => (
          <button key={key} type="button" onClick={() => go(tab)} className="rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent">
            <Icon size={18} className="text-accent" aria-hidden />
            <p className="mt-3 text-2xl font-semibold tabular-nums">{data.counts[key]}</p>
            <p className="text-xs text-muted">{label}</p>
          </button>
        ))}
      </div>

      <button type="button" onClick={() => go('visitors')} className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent">
        <span className="flex items-center gap-3">
          <Globe size={18} className="text-accent" aria-hidden />
          <span>
            <span className="block text-2xl font-semibold">{data.visits.last24h}</span>
            <span className="text-xs text-muted">visits in the last 24 hours · {data.visits.last7d} in 7 days</span>
          </span>
        </span>
        <span className="text-xs text-accent">See visitors</span>
      </button>

      {data.drafts > 0 && (
        <p className="text-sm text-muted">
          <Badge tone="warn">{data.drafts}</Badge> item{data.drafts === 1 ? ' is' : 's are'} hidden from visitors (drafts).
        </p>
      )}

      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={16} className="text-accent" aria-hidden /> Recent activity
          </h3>
          <button type="button" onClick={() => go('security')} className="text-xs text-accent hover:underline">
            Full log
          </button>
        </div>
        <ul className="divide-y divide-border">
          {data.recent.length === 0 && <li className="px-5 py-4 text-sm text-muted">Nothing yet.</li>}
          {data.recent.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
              <span className="min-w-0 truncate">
                <code className="font-mono text-xs text-accent">{e.action}</code>
                {e.detail && <span className="ml-2 text-muted">{e.detail}</span>}
              </span>
              <span className="shrink-0 text-xs text-muted">{timeAgo(e.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
