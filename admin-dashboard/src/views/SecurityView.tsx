import { useState, type FormEvent } from 'react'
import { Copy, Download, KeyRound, LogOut, MonitorSmartphone, ShieldCheck, ShieldOff } from 'lucide-react'
import type { AuditEntry, SessionInfo } from '../lib/types'
import { api, ApiError } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { useAuth } from '../lib/auth'
import { describeUserAgent, formatDateTime, timeAgo } from '../lib/format'
import { Badge, Button, Card, ErrorNote, Field, Input, PageHeader, Spinner } from '../components/ui'
import { useToast } from '../components/Toast'

export function SecurityView() {
  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="Protect the account that can edit your site." />
      <TwoFactorCard />
      <PasswordCard />
      <SessionsCard />
      <AuditCard />
    </div>
  )
}

function PasswordCard() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (next !== confirm) return setError('The new passwords do not match')
    setBusy(true)
    try {
      const res = await api.post<{ revokedSessions: number }>('/auth/change-password', { currentPassword: current, newPassword: next })
      toast.success(res.revokedSessions ? `Password changed. ${res.revokedSessions} other session(s) signed out.` : 'Password changed')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5">
      <h3 className="mb-1 flex items-center gap-2 font-semibold">
        <KeyRound size={16} className="text-accent" aria-hidden /> Change password
      </h3>
      <p className="mb-4 text-sm text-muted">At least 12 characters. A long passphrase works better than a short complex one. Other devices are signed out.</p>
      <form onSubmit={(e) => void submit(e)} className="max-w-md space-y-4">
        {/* Lets password managers attach the new password to this account. */}
        <input type="text" name="username" autoComplete="username" hidden readOnly />
        <Field label="Current password">{(id) => <Input id={id} type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />}</Field>
        <Field label="New password">{(id) => <Input id={id} type="password" autoComplete="new-password" required minLength={12} value={next} onChange={(e) => setNext(e.target.value)} />}</Field>
        <Field label="Confirm new password" error={error ?? undefined}>
          {(id) => <Input id={id} type="password" autoComplete="new-password" required minLength={12} value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        <Button type="submit" variant="primary" loading={busy}>
          Update password
        </Button>
      </form>
    </Card>
  )
}

interface Setup {
  secret: string
  qr: string
}

function TwoFactorCard() {
  const { user, refresh } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState<'idle' | 'password' | 'scan' | 'codes' | 'disable'>('idle')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [setup, setSetup] = useState<Setup | null>(null)
  const [recovery, setRecovery] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setStep('idle')
    setPassword('')
    setCode('')
    setSetup(null)
    setError(null)
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const start = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      setSetup(await api.post<Setup>('/auth/2fa/setup', { password }))
      setPassword('')
      setStep('scan')
    })
  }

  const enable = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const res = await api.post<{ recoveryCodes: string[] }>('/auth/2fa/enable', { code })
      setRecovery(res.recoveryCodes)
      setSetup(null)
      setCode('')
      setStep('codes')
      await refresh()
    })
  }

  const disable = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      await api.post('/auth/2fa/disable', { password, code })
      toast.success('Two-factor authentication turned off')
      reset()
      await refresh()
    })
  }

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(recovery.join('\n'))
      toast.success('Recovery codes copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  const downloadCodes = () => {
    const url = URL.createObjectURL(new Blob([`Portfolio admin recovery codes\nEach works once.\n\n${recovery.join('\n')}\n`], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'portfolio-recovery-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            {user?.totpEnabled ? <ShieldCheck size={16} className="text-ok" aria-hidden /> : <ShieldOff size={16} className="text-warn" aria-hidden />}
            Two-factor authentication
            <Badge tone={user?.totpEnabled ? 'ok' : 'warn'}>{user?.totpEnabled ? 'On' : 'Off'}</Badge>
          </h3>
          <p className="mt-1 text-sm text-muted">A 6-digit code from an authenticator app (Google Authenticator, 1Password, Authy…) is required at every sign-in.</p>
        </div>
        {step === 'idle' && !user?.totpEnabled && (
          <Button variant="primary" onClick={() => setStep('password')}>
            Turn on
          </Button>
        )}
        {step === 'idle' && user?.totpEnabled && <Button variant="danger" onClick={() => setStep('disable')}>Turn off</Button>}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {step === 'password' && (
        <form onSubmit={start} className="mt-4 max-w-sm space-y-4">
          <Field label="Confirm your password to continue">{(id) => <Input id={id} type="password" autoComplete="current-password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />}</Field>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={busy}>Continue</Button>
            <Button onClick={reset}>Cancel</Button>
          </div>
        </form>
      )}

      {step === 'scan' && setup && (
        <form onSubmit={enable} className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr]">
          <img src={setup.qr} alt="QR code to scan with your authenticator app" width={176} height={176} className="rounded-lg bg-white p-2" />
          <div className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
              <li>Scan the QR code with your authenticator app.</li>
              <li>Enter the 6-digit code it shows to finish.</li>
            </ol>
            <p className="text-xs text-muted">
              Can’t scan? Enter this key manually: <code className="select-all break-all font-mono text-text">{setup.secret}</code>
            </p>
            <Field label="Authentication code">
              {(id) => <Input id={id} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="max-w-40 text-center font-mono text-lg tracking-widest" />}
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={busy}>Verify and turn on</Button>
              <Button onClick={reset}>Cancel</Button>
            </div>
          </div>
        </form>
      )}

      {step === 'codes' && (
        <div className="mt-4 space-y-4">
          <p className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
            Save these recovery codes now. They’re shown once. Each one works a single time if you lose your phone.
          </p>
          <ul className="grid max-w-md grid-cols-2 gap-2 font-mono text-sm">
            {recovery.map((c) => (
              <li key={c} className="rounded-md border border-border bg-bg px-3 py-1.5 text-center select-all">{c}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void copyCodes()}><Copy size={14} aria-hidden /> Copy</Button>
            <Button onClick={downloadCodes}><Download size={14} aria-hidden /> Download</Button>
            <Button variant="primary" onClick={() => { setRecovery([]); reset() }}>I’ve saved them</Button>
          </div>
        </div>
      )}

      {step === 'disable' && (
        <form onSubmit={disable} className="mt-4 max-w-sm space-y-4">
          <Field label="Password">{(id) => <Input id={id} type="password" autoComplete="current-password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />}</Field>
          <Field label="Authentication or recovery code">{(id) => <Input id={id} autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} className="font-mono" maxLength={20} />}</Field>
          <div className="flex gap-2">
            <Button type="submit" variant="danger" loading={busy}>Turn off</Button>
            <Button onClick={reset}>Cancel</Button>
          </div>
        </form>
      )}
    </Card>
  )
}

function SessionsCard() {
  const toast = useToast()
  const { data: sessions, error, reload: load } = useFetch<SessionInfo[]>('/auth/sessions')

  const revoke = async (id: string) => {
    try {
      await api.del(`/auth/sessions/${id}`)
      toast.success('Session signed out')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign out')
    }
  }

  const revokeOthers = async () => {
    try {
      const res = await api.post<{ revoked: number }>('/auth/sessions/revoke-others')
      toast.success(`${res.revoked} session(s) signed out`)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign out')
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <MonitorSmartphone size={16} className="text-accent" aria-hidden /> Active sessions
        </h3>
        {sessions && sessions.length > 1 && (
          <Button size="sm" onClick={() => void revokeOthers()}>
            <LogOut size={14} aria-hidden /> Sign out all others
          </Button>
        )}
      </div>
      {error && <div className="p-4"><ErrorNote message={error} onRetry={load} /></div>}
      {!sessions && !error && <Spinner />}
      <ul className="divide-y divide-border">
        {sessions?.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-medium">
                {describeUserAgent(s.userAgent)} {s.current && <Badge tone="accent">This device</Badge>}
              </p>
              <p className="truncate text-xs text-muted">
                {s.ip ?? 'Unknown IP'} · signed in {formatDateTime(s.createdAt)} · active {timeAgo(s.lastSeenAt)}
              </p>
            </div>
            {!s.current && (
              <Button size="sm" variant="danger" onClick={() => void revoke(s.id)}>
                Sign out
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function AuditCard() {
  const { data: entries, error, reload: load } = useFetch<AuditEntry[]>('/admin/audit?limit=100')

  return (
    <Card>
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-semibold">Activity log</h3>
        <p className="text-sm text-muted">Sign-ins (including failed attempts) and every change made here. Kept for 180 days.</p>
      </div>
      {error && <div className="p-4"><ErrorNote message={error} onRetry={load} /></div>}
      {!entries && !error && <Spinner />}
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-surface text-xs text-muted">
            <tr>
              <th className="px-5 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">Detail</th>
              <th className="hidden px-5 py-2 font-medium md:table-cell">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries?.map((e) => (
              <tr key={e.id} className={e.action.includes('failure') || e.action.includes('locked') ? 'bg-danger/5' : undefined}>
                <td className="whitespace-nowrap px-5 py-2 text-xs text-muted">{formatDateTime(e.createdAt)}</td>
                <td className="px-3 py-2 font-mono text-xs">{e.action}</td>
                <td className="hidden max-w-64 truncate px-3 py-2 text-xs text-muted sm:table-cell">{e.detail}</td>
                <td className="hidden px-5 py-2 font-mono text-xs text-muted md:table-cell">{e.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
