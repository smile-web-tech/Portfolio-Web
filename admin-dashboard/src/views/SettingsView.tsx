import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import type { Settings } from '../lib/types'
import { api, ApiError } from '../lib/api'
import { Button, Card, ErrorNote, Field, Input, PageHeader, Spinner, Textarea } from '../components/ui'
import { ImageField } from '../components/ImageField'
import { useToast } from '../components/Toast'

const TEXT_KEYS = ['name', 'jobTitle', 'bio', 'email', 'phone', 'githubUrl', 'linkedinUrl', 'twitterUrl', 'footerCredit'] as const
const IMAGE_KEYS = ['profilePicUrl', 'heroBackgroundUrl', 'aboutImageUrl', 'resumeUrl'] as const

type Form = Record<(typeof TEXT_KEYS)[number], string> & Record<(typeof IMAGE_KEYS)[number], string | null>

const fromServer = (s: Settings | null): Form => ({
  ...(Object.fromEntries(TEXT_KEYS.map((k) => [k, s?.[k] ?? ''])) as Record<(typeof TEXT_KEYS)[number], string>),
  ...(Object.fromEntries(IMAGE_KEYS.map((k) => [k, s?.[k] ?? null])) as Record<(typeof IMAGE_KEYS)[number], string | null>),
})

// Empty strings become null so cleared fields are really cleared on the server.
const toPayload = (f: Form) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || null : v]))

export function SettingsView() {
  const toast = useToast()
  const [saved, setSaved] = useState<Form | null>(null)
  const [form, setForm] = useState<Form>(() => fromServer(null))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const load = () => {
    setLoadError(null)
    api
      .get<Settings | null>('/admin/settings')
      .then((s) => {
        const f = fromServer(s)
        setSaved(f)
        setForm(f)
      })
      .catch((err: Error) => setLoadError(err.message))
  }
  useEffect(load, [])

  const dirty = useMemo(() => saved !== null && JSON.stringify(saved) !== JSON.stringify(form), [saved, form])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))
  const text = (key: keyof Form) => ({
    value: (form[key] as string | null) ?? '',
    onChange: (e: { target: { value: string } }) => set(key, e.target.value as never),
  })

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await api.put<Settings>('/admin/settings', toPayload(form))
      const f = fromServer(result)
      setSaved(f)
      setForm(f)
      toast.success('Settings saved')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err)
        const first = err.issues[0]
        toast.error(first ? `${first.path}: ${first.message}` : err.message)
      } else toast.error('Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loadError) return <ErrorNote message={loadError} onRetry={load} />
  if (!saved) return <Spinner />

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
      className="pb-24"
    >
      <PageHeader title="Profile & Settings" description="Your name, bio, contact details, social links and the main images on the site." />

      <div className="space-y-6">
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold">Basics</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={error?.fieldError('name')}>
              {(id) => <Input id={id} required maxLength={100} {...text('name')} />}
            </Field>
            <Field label="Job title" required error={error?.fieldError('jobTitle')}>
              {(id) => <Input id={id} required maxLength={150} {...text('jobTitle')} />}
            </Field>
          </div>
          <Field label="About me" hint="Shown in the About section." error={error?.fieldError('bio')}>
            {(id) => <Textarea id={id} rows={6} maxLength={3000} {...text('bio')} />}
          </Field>
        </Card>

        <Card className="space-y-4 p-5">
          <h3 className="font-semibold">Contact & links</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={error?.fieldError('email')}>
              {(id) => <Input id={id} type="email" maxLength={254} {...text('email')} />}
            </Field>
            <Field label="Phone" error={error?.fieldError('phone')}>
              {(id) => <Input id={id} type="tel" maxLength={25} placeholder="+36 20 123 4567" {...text('phone')} />}
            </Field>
            <Field label="GitHub" error={error?.fieldError('githubUrl')}>
              {(id) => <Input id={id} type="url" placeholder="https://github.com/…" spellCheck={false} {...text('githubUrl')} />}
            </Field>
            <Field label="LinkedIn" error={error?.fieldError('linkedinUrl')}>
              {(id) => <Input id={id} type="url" placeholder="https://linkedin.com/in/…" spellCheck={false} {...text('linkedinUrl')} />}
            </Field>
            <Field label="X / Twitter" error={error?.fieldError('twitterUrl')}>
              {(id) => <Input id={id} type="url" placeholder="https://x.com/…" spellCheck={false} {...text('twitterUrl')} />}
            </Field>
            <Field label="Footer credit" hint="Shown after “Design by:”. Empty hides the line." error={error?.fieldError('footerCredit')}>
              {(id) => <Input id={id} maxLength={200} {...text('footerCredit')} />}
            </Field>
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <h3 className="font-semibold">Images & CV</h3>
          <div className="grid gap-5 lg:grid-cols-2">
            <ImageField label="Hero photo (foreground)" value={form.profilePicUrl} onChange={(v) => set('profilePicUrl', v)} error={error?.fieldError('profilePicUrl')} />
            <ImageField label="Hero background" value={form.heroBackgroundUrl} onChange={(v) => set('heroBackgroundUrl', v)} error={error?.fieldError('heroBackgroundUrl')} />
            <ImageField label="About photo" value={form.aboutImageUrl} onChange={(v) => set('aboutImageUrl', v)} error={error?.fieldError('aboutImageUrl')} />
            <ImageField label="CV / resume (PDF)" kind="document" value={form.resumeUrl} onChange={(v) => set('resumeUrl', v)} error={error?.fieldError('resumeUrl')} hint="Powers the Download CV button." />
          </div>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="text-sm text-muted">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
          <div className="flex gap-2">
            <Button disabled={!dirty} onClick={() => saved && setForm(saved)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
              <Save size={16} aria-hidden /> Save changes
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
