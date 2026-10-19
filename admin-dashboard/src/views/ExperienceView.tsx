import { Briefcase } from 'lucide-react'
import type { Experience, ExperienceDetail } from '../lib/types'
import { ResourceManager } from '../components/ResourceManager'
import { Field, Input, Switch } from '../components/ui'
import { ImageField } from '../components/ImageField'
import { DetailsEditor } from '../components/ListEditors'
import { formatRange, toInputDate } from '../lib/format'

interface Draft {
  company: string
  role: string
  location: string
  logoUrl: string | null
  startDate: string
  endDate: string
  details: ExperienceDetail[]
  showProgress: boolean
  isPublished: boolean
}

export function ExperienceView() {
  return (
    <ResourceManager<Experience, Draft>
      path="/admin/experience"
      title="Work Experience"
      description="Roles shown in the Work Experience section. Leave the end date empty for a current role."
      singular="Role"
      wide
      blank={() => ({ company: '', role: '', location: '', logoUrl: null, startDate: '', endDate: '', details: [{ title: null, url: null, bullets: [''] }], showProgress: false, isPublished: true })}
      toDraft={(e) => ({
        company: e.company,
        role: e.role,
        location: e.location ?? '',
        logoUrl: e.logoUrl,
        startDate: toInputDate(e.startDate),
        endDate: toInputDate(e.endDate),
        details: e.details,
        showProgress: e.showProgress,
        isPublished: e.isPublished,
      })}
      toPayload={(d) => ({
        ...d,
        location: d.location.trim() || null,
        endDate: d.endDate || null,
        details: d.details
          .map((b) => ({ title: b.title?.trim() || null, url: b.url?.trim() || null, bullets: b.bullets.map((x) => x.trim()).filter(Boolean) }))
          .filter((b) => b.title || b.url || b.bullets.length > 0),
      })}
      itemLabel={(e) => `${e.role} at ${e.company}`}
      renderRow={(e) => (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-bg">
            {e.logoUrl ? <img src={e.logoUrl} alt="" loading="lazy" className="h-full w-full object-contain" /> : <Briefcase size={18} className="text-muted/50" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{e.company}</p>
            <p className="truncate text-xs text-muted">
              {e.role} · {formatRange(e.startDate, e.endDate)}
            </p>
          </div>
        </div>
      )}
      renderForm={({ draft, patch, error }) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company / organization" required error={error?.fieldError('company')}>
              {(id) => <Input id={id} required maxLength={160} value={draft.company} onChange={(e) => patch({ company: e.target.value })} />}
            </Field>
            <Field label="Role" required error={error?.fieldError('role')}>
              {(id) => <Input id={id} required maxLength={160} value={draft.role} onChange={(e) => patch({ role: e.target.value })} />}
            </Field>
            <Field label="Location" error={error?.fieldError('location')}>
              {(id) => <Input id={id} maxLength={120} value={draft.location} onChange={(e) => patch({ location: e.target.value })} placeholder="City, Country" />}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" required error={error?.fieldError('startDate')}>
                {(id) => <Input id={id} type="date" required value={draft.startDate} onChange={(e) => patch({ startDate: e.target.value })} />}
              </Field>
              <Field label="End" hint="Empty = present" error={error?.fieldError('endDate')}>
                {(id) => <Input id={id} type="date" value={draft.endDate} onChange={(e) => patch({ endDate: e.target.value })} />}
              </Field>
            </div>
          </div>
          <ImageField label="Company logo" value={draft.logoUrl} onChange={(logoUrl) => patch({ logoUrl })} error={error?.fieldError('logoUrl')} />
          <Field label="What you did" hint="Optional titled blocks, each with bullet points. Use **double asterisks** to highlight words." error={error?.issues.find((i) => i.path.startsWith('details'))?.message}>
            {() => <DetailsEditor value={draft.details} onChange={(details) => patch({ details })} />}
          </Field>
          <Switch checked={draft.showProgress} onChange={(showProgress) => patch({ showProgress })} label="Show “in progress” bar" description="Adds the development-progress indicator under this role." />
          <Switch checked={draft.isPublished} onChange={(isPublished) => patch({ isPublished })} label="Published" />
        </>
      )}
    />
  )
}
