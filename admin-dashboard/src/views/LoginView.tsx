import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Button, Field, Input } from '../components/ui'

export function LoginView() {
  const { login, notice } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [needsCode, setNeedsCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password, needsCode ? code.trim() : undefined)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'totp_required') {
        // Password was right; ask for the second factor. A wrong code comes back with the same code.
        if (needsCode) setError(err.message)
        setNeedsCode(true)
        setCode('')
      } else {
        setError(err instanceof Error ? err.message : 'Sign-in failed')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-surface p-7 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Lock size={22} aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-semibold">Portfolio admin</h1>
            <p className="text-sm text-muted">{needsCode ? 'Enter your authentication code' : 'Sign in to manage your site'}</p>
          </div>
        </div>

        {(error || notice) && (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error ?? notice}
          </p>
        )}

        {!needsCode ? (
          <>
            <Field label="Email">
              {(id) => <Input id={id} type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <Field label="Password">
              {(id) => <Input id={id} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
            </Field>
          </>
        ) : (
          <Field label="6-digit code or recovery code" hint="From your authenticator app. Lost it? Use one of your recovery codes.">
            {(id) => (
              <Input
                id={id}
                inputMode="text"
                autoComplete="one-time-code"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center font-mono tracking-widest"
                maxLength={20}
              />
            )}
          </Field>
        )}

        <Button type="submit" variant="primary" loading={busy} className="w-full">
          {needsCode ? 'Verify' : 'Sign in'}
        </Button>
        {needsCode && (
          <button type="button" onClick={() => { setNeedsCode(false); setCode(''); setError(null) }} className="block w-full text-center text-xs text-muted hover:text-text">
            Back
          </button>
        )}
      </form>
    </main>
  )
}
