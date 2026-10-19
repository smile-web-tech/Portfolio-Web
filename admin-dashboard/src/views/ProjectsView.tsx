import { ExternalLink, FolderKanban } from 'lucide-react'
import type { Project, ProjectLink } from '../lib/types'
import { ResourceManager } from '../components/ResourceManager'
import { Field, Input, Switch, Textarea } from '../components/ui'
import { ImageField } from '../components/ImageField'
import { LinksEditor, TagInput } from '../components/ListEditors'

interface Draft {
  title: string
  description: string
  techStack: string[]
  thumbnailUrl: string | null
  links: ProjectLink[]
  isPublished: boolean
}

export function ProjectsView() {
  return (
    <ResourceManager<Project, Draft>
      path="/admin/projects"
      title="Projects"
      description="Cards shown in the Projects section. New projects appear first; reorder with the arrows."
      singular="Project"
      wide
      blank={() => ({ title: '', description: '', techStack: [], thumbnailUrl: null, links: [], isPublished: true })}
      toDraft={(p) => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack,
        thumbnailUrl: p.thumbnailUrl,
        links: p.links,
        isPublished: p.isPublished,
      })}
      toPayload={(d) => ({ ...d, links: d.links.filter((l) => l.url.trim() || l.label.trim()) })}
      itemLabel={(p) => p.title}
      validate={(d) => (d.links.some((l) => !l.label.trim() || !l.url.trim()) ? 'Each link needs a label and a URL' : null)}
      renderRow={(p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-bg">
            {p.thumbnailUrl ? <img src={p.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" /> : <FolderKanban size={18} className="text-muted/50" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{p.title}</p>
            <p className="truncate text-xs text-muted">
              {p.techStack.slice(0, 4).join(' · ') || 'No tech listed'}
              {p.links.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <ExternalLink size={11} aria-hidden /> {p.links.length}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
      renderForm={({ draft, patch, error }) => (
        <>
          <Field label="Title" required error={error?.fieldError('title')}>
            {(id) => <Input id={id} required maxLength={120} value={draft.title} onChange={(e) => patch({ title: e.target.value })} />}
          </Field>
          <Field label="Description" required error={error?.fieldError('description')}>
            {(id) => <Textarea id={id} required rows={4} maxLength={2000} value={draft.description} onChange={(e) => patch({ description: e.target.value })} />}
          </Field>
          <Field label="Technologies" hint="Press Enter or comma after each one." error={error?.fieldError('techStack')}>
            {(id) => <TagInput id={id} value={draft.techStack} onChange={(techStack) => patch({ techStack })} placeholder="e.g. React, Kotlin, PostgreSQL" />}
          </Field>
          <ImageField label="Thumbnail" value={draft.thumbnailUrl} onChange={(thumbnailUrl) => patch({ thumbnailUrl })} error={error?.fieldError('thumbnailUrl')} />
          <Field label="Links" hint="The first non-GitHub link is also used for the thumbnail click." error={error?.issues.find((i) => i.path.startsWith('links'))?.message}>
            {() => <LinksEditor value={draft.links} onChange={(links) => patch({ links })} />}
          </Field>
          <Switch checked={draft.isPublished} onChange={(isPublished) => patch({ isPublished })} label="Published" description="Turn off to keep it as a draft that visitors can’t see." />
        </>
      )}
    />
  )
}
