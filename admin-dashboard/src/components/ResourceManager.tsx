import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { swap } from '../lib/list'
import { Badge, Button, Card, EmptyState, ErrorNote, IconButton, PageHeader, Spinner } from './ui'
import { Modal, ConfirmDialog } from './Modal'
import { useToast } from './Toast'

interface Item {
  id: string
  isPublished: boolean
}

export interface FormProps<D> {
  draft: D
  patch: (change: Partial<D>) => void
  /** Server-side validation error from the last save attempt, for per-field messages. */
  error: ApiError | null
}

interface Props<T extends Item, D extends { isPublished: boolean }> {
  path: string
  title: string
  description: string
  singular: string
  blank: () => D
  toDraft: (item: T) => D
  toPayload: (draft: D) => unknown
  renderRow: (item: T) => ReactNode
  renderForm: (props: FormProps<D>) => ReactNode
  itemLabel: (item: T) => string
  /** Optional client-side check before sending; return a message to block the save. */
  validate?: (draft: D) => string | null
  groupBy?: (item: T) => string
  wide?: boolean
}

/**
 * One generic list + modal editor shared by projects, experience, education and skills:
 * create, edit, delete (with confirmation), publish/unpublish, and manual ordering.
 */
export function ResourceManager<T extends Item, D extends { isPublished: boolean }>(props: Props<T, D>) {
  const { path, title, description, singular, blank, toDraft, toPayload, renderRow, renderForm, itemLabel, validate, groupBy, wide } = props
  const toast = useToast()

  const [items, setItems] = useState<T[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string | null; draft: D } | null>(null)
  const [saveError, setSaveError] = useState<ApiError | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<T | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      setItems(await api.get<T[]>(path))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load')
    }
  }, [path])

  useEffect(() => {
    void load()
  }, [load])

  const closeForm = () => {
    setEditing(null)
    setSaveError(null)
  }

  const save = async () => {
    if (!editing) return
    const problem = validate?.(editing.draft)
    if (problem) {
      toast.error(problem)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const payload = toPayload(editing.draft)
      if (editing.id) await api.put(`${path}/${editing.id}`, payload)
      else await api.post(path, payload)
      toast.success(editing.id ? `${singular} saved` : `${singular} created`)
      closeForm()
      await load()
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err)
        const first = err.issues[0]
        toast.error(first ? `${first.path || 'Form'}: ${first.message}` : err.message)
      } else toast.error('Could not save')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.del(`${path}/${deleting.id}`)
      toast.success(`${singular} deleted`)
      setDeleting(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete')
    } finally {
      setDeleteBusy(false)
    }
  }

  const togglePublished = async (item: T) => {
    try {
      const draft = toDraft(item)
      await api.put(`${path}/${item.id}`, toPayload({ ...draft, isPublished: !item.isPublished }))
      toast.success(item.isPublished ? 'Hidden from the site' : 'Published')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update')
    }
  }

  // Moves within the item's group (or the whole list), then persists the full order.
  const move = async (item: T, dir: -1 | 1) => {
    if (!items) return
    const from = items.findIndex((i) => i.id === item.id)
    const key = groupBy?.(item)
    let to = from + dir
    while (to >= 0 && to < items.length && groupBy && groupBy(items[to]) !== key) to += dir
    if (to < 0 || to >= items.length) return
    const next = swap(items, from, to)
    setItems(next)
    try {
      await api.put(`${path}/reorder`, { ids: next.map((i) => i.id) })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reorder')
      await load()
    }
  }

  const groups = useMemo(() => {
    if (!items) return []
    if (!groupBy) return [{ name: '', items }]
    const map = new Map<string, T[]>()
    for (const item of items) map.set(groupBy(item), [...(map.get(groupBy(item)) ?? []), item])
    return [...map].map(([name, list]) => ({ name, items: list }))
  }, [items, groupBy])

  const renderItem = (item: T, index: number, list: T[]) => (
    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">{renderRow(item)}</div>
      {!item.isPublished && <Badge tone="warn">Hidden</Badge>}
      <div className="flex shrink-0 items-center">
        <IconButton label="Move up" disabled={index === 0} onClick={() => void move(item, -1)}>
          <ArrowUp size={15} />
        </IconButton>
        <IconButton label="Move down" disabled={index === list.length - 1} onClick={() => void move(item, 1)}>
          <ArrowDown size={15} />
        </IconButton>
        <IconButton label={item.isPublished ? 'Hide from site' : 'Publish'} onClick={() => void togglePublished(item)}>
          {item.isPublished ? <Eye size={15} /> : <EyeOff size={15} />}
        </IconButton>
        <IconButton label="Edit" onClick={() => setEditing({ id: item.id, draft: toDraft(item) })}>
          <Pencil size={15} />
        </IconButton>
        <IconButton label="Delete" className="hover:text-danger" onClick={() => setDeleting(item)}>
          <Trash2 size={15} />
        </IconButton>
      </div>
    </li>
  )

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button variant="primary" onClick={() => setEditing({ id: null, draft: blank() })}>
            <Plus size={16} aria-hidden /> Add {singular.toLowerCase()}
          </Button>
        }
      />

      {loadError && <ErrorNote message={loadError} onRetry={() => void load()} />}
      {!items && !loadError && <Spinner />}
      {items && items.length === 0 && (
        <EmptyState title={`No ${title.toLowerCase()} yet`}>Use “Add {singular.toLowerCase()}” to create the first one.</EmptyState>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.name}>
            {groupBy && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{group.name}</h3>}
            <Card>
              <ul className="divide-y divide-border">{group.items.map((item, i, list) => renderItem(item, i, list))}</ul>
            </Card>
          </div>
        ))}
      </div>

      <Modal
        open={editing !== null}
        onClose={closeForm}
        title={editing?.id ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}
        wide={wide}
        footer={
          <>
            <Button onClick={closeForm}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={() => void save()}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
            className="space-y-5"
          >
            {renderForm({ draft: editing.draft, patch: (change) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...change } } : e)), error: saveError })}
            <button type="submit" hidden />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${singular.toLowerCase()}?`}
        message={
          <>
            “{deleting ? itemLabel(deleting) : ''}” will be removed permanently. This can’t be undone. To hide it without deleting, use the eye icon instead.
          </>
        }
        busy={deleteBusy}
        onConfirm={() => void remove()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
