import { useState, type KeyboardEvent } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import type { ExperienceDetail, LinkKind, ProjectLink } from '../lib/types'
import { replaceAt, swap, without } from '../lib/list'
import { Button, IconButton, Input, Select, Textarea } from './ui'

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  id?: string
  max?: number
}

/** Chips: Enter or comma adds, Backspace on an empty box removes the last one. */
export function TagInput({ value, onChange, placeholder, id, max = 30 }: TagInputProps) {
  const [text, setText] = useState('')

  const add = (raw: string) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) return
    const next = [...value]
    for (const p of parts) if (!next.includes(p) && next.length < max) next.push(p)
    onChange(next)
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(text)
    } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-bg p-2 focus-within:border-accent">
      {value.map((tag, i) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-surface-2 py-1 pl-2 pr-1 text-xs">
          {tag}
          <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(without(value, i))} className="rounded p-0.5 text-muted hover:text-danger">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(text)}
        placeholder={value.length === 0 ? placeholder : 'Add another…'}
        className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted/60"
      />
    </div>
  )
}

function RowControls({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (dir: -1 | 1) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 items-center">
      <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
        <ArrowUp size={14} />
      </IconButton>
      <IconButton label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
        <ArrowDown size={14} />
      </IconButton>
      <IconButton label="Remove" className="hover:text-danger" onClick={onRemove}>
        <Trash2 size={14} />
      </IconButton>
    </div>
  )
}

interface StringListProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  addLabel?: string
  rows?: number
}

export function StringListEditor({ value, onChange, placeholder, addLabel = 'Add item', rows = 2 }: StringListProps) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-1">
          <Textarea
            aria-label={`Item ${i + 1}`}
            value={item}
            rows={rows}
            placeholder={placeholder}
            className="min-h-0"
            onChange={(e) => onChange(replaceAt(value, i, e.target.value))}
          />
          <RowControls index={i} count={value.length} onMove={(d) => onChange(swap(value, i, i + d))} onRemove={() => onChange(without(value, i))} />
        </div>
      ))}
      <Button size="sm" onClick={() => onChange([...value, ''])}>
        <Plus size={14} aria-hidden /> {addLabel}
      </Button>
    </div>
  )
}

const LINK_KINDS: { value: LinkKind; label: string }[] = [
  { value: 'button', label: 'Button' },
  { value: 'highlight', label: 'Highlighted button' },
  { value: 'github', label: 'GitHub icon' },
]

export function LinksEditor({ value, onChange }: { value: ProjectLink[]; onChange: (value: ProjectLink[]) => void }) {
  const patch = (i: number, change: Partial<ProjectLink>) => onChange(replaceAt(value, i, { ...value[i], ...change }))
  return (
    <div className="space-y-3">
      {value.map((link, i) => (
        <div key={i} className="flex items-start gap-1 rounded-lg border border-border bg-bg/50 p-3">
          <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1.6fr_1fr]">
            <Input aria-label="Link label" placeholder="Label (e.g. Live Demo)" value={link.label} maxLength={40} onChange={(e) => patch(i, { label: e.target.value })} />
            <Input aria-label="Link URL" type="url" placeholder="https://…" value={link.url} onChange={(e) => patch(i, { url: e.target.value })} spellCheck={false} />
            <Select aria-label="Link style" value={link.kind} onChange={(e) => patch(i, { kind: e.target.value as LinkKind })}>
              {LINK_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </div>
          <RowControls index={i} count={value.length} onMove={(d) => onChange(swap(value, i, i + d))} onRemove={() => onChange(without(value, i))} />
        </div>
      ))}
      <Button size="sm" onClick={() => onChange([...value, { label: '', url: '', kind: 'button' }])} disabled={value.length >= 8}>
        <Plus size={14} aria-hidden /> Add link
      </Button>
    </div>
  )
}

export function DetailsEditor({ value, onChange }: { value: ExperienceDetail[]; onChange: (value: ExperienceDetail[]) => void }) {
  const patch = (i: number, change: Partial<ExperienceDetail>) => onChange(replaceAt(value, i, { ...value[i], ...change }))
  return (
    <div className="space-y-3">
      {value.map((block, i) => (
        <div key={i} className="rounded-lg border border-border bg-bg/50 p-3">
          <div className="mb-3 flex items-start gap-1">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <Input aria-label="Block title" placeholder="Project or section title (optional)" value={block.title ?? ''} onChange={(e) => patch(i, { title: e.target.value || null })} />
              <Input aria-label="Block link" type="url" placeholder="Link (optional) https://…" value={block.url ?? ''} onChange={(e) => patch(i, { url: e.target.value || null })} spellCheck={false} />
            </div>
            <RowControls index={i} count={value.length} onMove={(d) => onChange(swap(value, i, i + d))} onRemove={() => onChange(without(value, i))} />
          </div>
          <StringListEditor value={block.bullets} onChange={(bullets) => patch(i, { bullets })} placeholder="Describe what you did. Wrap key words in **double asterisks** to highlight them." addLabel="Add bullet" />
        </div>
      ))}
      <Button size="sm" onClick={() => onChange([...value, { title: null, url: null, bullets: [''] }])} disabled={value.length >= 10}>
        <Plus size={14} aria-hidden /> Add block
      </Button>
    </div>
  )
}
