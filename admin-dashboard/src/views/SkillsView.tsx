import { Code2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Skill } from '../lib/types'
import { api } from '../lib/api'
import { ResourceManager } from '../components/ResourceManager'
import { Field, Input, Switch } from '../components/ui'
import { ImageField } from '../components/ImageField'

interface Draft {
  category: string
  name: string
  proficiency: string
  iconUrl: string | null
  isPublished: boolean
}

export function SkillsView() {
  // Existing categories feed the autocomplete so new skills land in the right group.
  const [categories, setCategories] = useState<string[]>([])
  useEffect(() => {
    api
      .get<Skill[]>('/admin/skills')
      .then((skills) => setCategories([...new Set(skills.map((s) => s.category))]))
      .catch(() => {})
  }, [])

  return (
    <ResourceManager<Skill, Draft>
      path="/admin/skills"
      title="Skills"
      description="Grouped by category. Arrows reorder within a group; the group order follows its first skill."
      singular="Skill"
      groupBy={(s) => s.category}
      blank={() => ({ category: categories[0] ?? '', name: '', proficiency: '', iconUrl: null, isPublished: true })}
      toDraft={(s) => ({ category: s.category, name: s.name, proficiency: s.proficiency ?? '', iconUrl: s.iconUrl, isPublished: s.isPublished })}
      toPayload={(d) => ({ ...d, proficiency: d.proficiency.trim() || null })}
      itemLabel={(s) => s.name}
      renderRow={(s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-bg p-1">
            {s.iconUrl ? <img src={s.iconUrl} alt="" loading="lazy" className="h-full w-full object-contain" /> : <Code2 size={16} className="text-muted/50" />}
          </div>
          <p className="truncate font-medium">{s.name}</p>
          {s.proficiency && <span className="text-xs text-muted">{s.proficiency}</span>}
        </div>
      )}
      renderForm={({ draft, patch, error }) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={error?.fieldError('name')}>
              {(id) => <Input id={id} required maxLength={60} value={draft.name} onChange={(e) => patch({ name: e.target.value })} />}
            </Field>
            <Field label="Category" required hint="Pick an existing group or type a new one." error={error?.fieldError('category')}>
              {(id) => (
                <>
                  <Input id={id} required maxLength={60} list={`${id}-cats`} value={draft.category} onChange={(e) => patch({ category: e.target.value })} />
                  <datalist id={`${id}-cats`}>
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
            <Field label="Proficiency" hint="Optional, e.g. Advanced" error={error?.fieldError('proficiency')}>
              {(id) => <Input id={id} maxLength={40} value={draft.proficiency} onChange={(e) => patch({ proficiency: e.target.value })} />}
            </Field>
          </div>
          <ImageField label="Icon" value={draft.iconUrl} onChange={(iconUrl) => patch({ iconUrl })} error={error?.fieldError('iconUrl')} hint="SVGs are converted to PNG on upload." />
          <Switch checked={draft.isPublished} onChange={(isPublished) => patch({ isPublished })} label="Published" />
        </>
      )}
    />
  )
}
