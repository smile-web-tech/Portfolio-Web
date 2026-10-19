import { GraduationCap } from 'lucide-react'
import type { Education } from '../lib/types'
import { ResourceManager } from '../components/ResourceManager'
import { Field, Input, Switch } from '../components/ui'
import { ImageField } from '../components/ImageField'
import { StringListEditor } from '../components/ListEditors'
import { formatRange, toInputDate } from '../lib/format'

interface Draft {
  institution: string
  degree: string
  location: string
  logoUrl: string | null
  startDate: string
  endDate: string
  gpa: string
  bullets: string[]
  isPublished: boolean
}

export function EducationView() {
  return (
    <ResourceManager<Education, Draft>
      path="/admin/education"
      title="Education"
      description="Schools, courses and certifications. Leave the end date empty if it’s ongoing."
      singular="Education"
      blank={() => ({ institution: '', degree: '', location: '', logoUrl: null, startDate: '', endDate: '', gpa: '', bullets: [], isPublished: true })}
      toDraft={(e) => ({
        institution: e.institution,
        degree: e.degree ?? '',
        location: e.location ?? '',
        logoUrl: e.logoUrl,
        startDate: toInputDate(e.startDate),
        endDate: toInputDate(e.endDate),
        gpa: e.gpa ?? '',
        bullets: e.bullets,
        isPublished: e.isPublished,
      })}
      toPayload={(d) => ({
        ...d,
        degree: d.degree.trim() || null,
        location: d.location.trim() || null,
        gpa: d.gpa.trim() || null,
        endDate: d.endDate || null,
        bullets: d.bullets.map((b) => b.trim()).filter(Boolean),
      })}
      itemLabel={(e) => e.institution}
      renderRow={(e) => (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-bg">
            {e.logoUrl ? <img src={e.logoUrl} alt="" loading="lazy" className="h-full w-full object-contain" /> : <GraduationCap size={18} className="text-muted/50" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{e.institution}</p>
            <p className="truncate text-xs text-muted">
              {[e.degree, formatRange(e.startDate, e.endDate)].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      )}
      renderForm={({ draft, patch, error }) => (
        <>
          <Field label="Institution" required error={error?.fieldError('institution')}>
            {(id) => <Input id={id} required maxLength={160} value={draft.institution} onChange={(e) => patch({ institution: e.target.value })} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Degree / program" error={error?.fieldError('degree')}>
              {(id) => <Input id={id} maxLength={200} value={draft.degree} onChange={(e) => patch({ degree: e.target.value })} />}
            </Field>
            <Field label="Location" error={error?.fieldError('location')}>
              {(id) => <Input id={id} maxLength={120} value={draft.location} onChange={(e) => patch({ location: e.target.value })} />}
            </Field>
            <Field label="Start" required error={error?.fieldError('startDate')}>
              {(id) => <Input id={id} type="date" required value={draft.startDate} onChange={(e) => patch({ startDate: e.target.value })} />}
            </Field>
            <Field label="End" hint="Empty = present" error={error?.fieldError('endDate')}>
              {(id) => <Input id={id} type="date" value={draft.endDate} onChange={(e) => patch({ endDate: e.target.value })} />}
            </Field>
            <Field label="GPA / grade" error={error?.fieldError('gpa')}>
              {(id) => <Input id={id} maxLength={20} value={draft.gpa} onChange={(e) => patch({ gpa: e.target.value })} />}
            </Field>
          </div>
          <ImageField label="Logo" value={draft.logoUrl} onChange={(logoUrl) => patch({ logoUrl })} error={error?.fieldError('logoUrl')} />
          <Field label="Details" hint="Short lines shown under the institution." error={error?.issues.find((i) => i.path.startsWith('bullets'))?.message}>
            {() => <StringListEditor value={draft.bullets} onChange={(bullets) => patch({ bullets })} rows={1} addLabel="Add line" />}
          </Field>
          <Switch checked={draft.isPublished} onChange={(isPublished) => patch({ isPublished })} label="Published" />
        </>
      )}
    />
  )
}
