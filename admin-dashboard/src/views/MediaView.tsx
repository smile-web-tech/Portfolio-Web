import { useRef, useState } from 'react'
import { Copy, FileText, Trash2, Upload } from 'lucide-react'
import type { MediaItem } from '../lib/types'
import { api, ApiError } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { uploadFile } from '../lib/upload'
import { formatBytes, timeAgo } from '../lib/format'
import { Button, Card, EmptyState, ErrorNote, IconButton, PageHeader, Spinner } from '../components/ui'
import { ConfirmDialog } from '../components/Modal'
import { useToast } from '../components/Toast'
import { cn } from '../lib/utils'

export function MediaView() {
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const { data: items, error, reload: load } = useFetch<MediaItem[]>('/admin/media')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [target, setTarget] = useState<MediaItem | null>(null)
  const [usages, setUsages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const upload = async (files: FileList | File[]) => {
    setUploading(true)
    let done = 0
    for (const file of files) {
      try {
        await uploadFile(file)
        done++
      } catch (err) {
        toast.error(`${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`)
      }
    }
    setUploading(false)
    if (done) toast.success(done === 1 ? 'Uploaded' : `${done} files uploaded`)
    load()
  }

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(new URL(url, window.location.origin).toString())
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  const close = () => {
    setTarget(null)
    setUsages([])
  }

  const remove = async (force: boolean) => {
    if (!target) return
    setBusy(true)
    try {
      await api.del(`/admin/media/${target.id}${force ? '?force=true' : ''}`)
      toast.success('Deleted')
      close()
      load()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setUsages(Array.isArray(err.extra.usages) ? (err.extra.usages as string[]) : [])
      else toast.error(err instanceof Error ? err.message : 'Could not delete')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Images and PDFs you’ve uploaded. Uploads are re-encoded and stripped of metadata."
        actions={
          <Button variant="primary" loading={uploading} onClick={() => input.current?.click()}>
            <Upload size={16} aria-hidden /> Upload
          </Button>
        }
      />
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,application/pdf"
        onChange={(e) => {
          if (e.target.files) void upload(e.target.files)
          e.target.value = ''
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files.length) void upload(e.dataTransfer.files)
        }}
        className={cn('rounded-xl border-2 border-dashed p-1 transition-colors', dragging ? 'border-accent bg-accent/5' : 'border-transparent')}
      >
        {error && <ErrorNote message={error} onRetry={load} />}
        {!items && !error && <Spinner />}
        {items && items.length === 0 && <EmptyState title="Nothing uploaded yet">Drop files here, or use Upload. Max 4 MB each.</EmptyState>}
        {items && items.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((m) => (
              <li key={m.id}>
                <Card className="overflow-hidden">
                  <div className="flex aspect-square items-center justify-center bg-[repeating-conic-gradient(#1a2330_0%_25%,#121820_0%_50%)] bg-[length:16px_16px]">
                    {m.mime.startsWith('image/') ? <img src={m.url} alt="" loading="lazy" className="h-full w-full object-contain" /> : <FileText size={40} className="text-accent" />}
                  </div>
                  <div className="flex items-center gap-1 p-2">
                    <div className="min-w-0 flex-1 px-1">
                      <p className="truncate text-xs font-medium" title={m.originalName}>
                        {m.originalName}
                      </p>
                      <p className="text-[11px] text-muted">
                        {formatBytes(m.size)}
                        {m.width && m.height ? ` · ${m.width}×${m.height}` : ''} · {timeAgo(m.createdAt)}
                      </p>
                    </div>
                    <IconButton label="Copy link" onClick={() => void copy(m.url)}>
                      <Copy size={14} />
                    </IconButton>
                    <IconButton label="Delete" className="hover:text-danger" onClick={() => setTarget(m)}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={target !== null}
        title={usages.length ? 'This file is in use' : 'Delete file?'}
        confirmLabel={usages.length ? 'Delete anyway' : 'Delete'}
        busy={busy}
        onCancel={close}
        onConfirm={() => void remove(usages.length > 0)}
        message={
          usages.length > 0 ? (
            <>
              <p>It is used by:</p>
              <ul className="my-2 list-disc pl-5 text-text">
                {usages.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              <p>Deleting it will leave broken images on the site.</p>
            </>
          ) : (
            <>“{target?.originalName}” will be removed permanently.</>
          )
        }
      />
    </div>
  )
}
