import { useRef, useState } from 'react'
import { FileText, ImageIcon, Library, Upload, X } from 'lucide-react'
import { useFetch } from '../hooks/useFetch'
import { uploadFile } from '../lib/upload'
import type { MediaItem } from '../lib/types'
import { cn } from '../lib/utils'
import { Button, ErrorNote, Field, Input, Spinner } from './ui'
import { Modal } from './Modal'
import { useToast } from './Toast'

export type AssetKind = 'image' | 'document'

const ACCEPT: Record<AssetKind, string> = {
  image: 'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml',
  document: 'application/pdf',
}

const isImageUrl = (url: string) => !/\.pdf($|\?)/i.test(url)

interface Props {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  kind?: AssetKind
  error?: string
  hint?: string
  className?: string
}

export function ImageField({ label, value, onChange, kind = 'image', error, hint, className }: Props) {
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null)
  const broken = brokenUrl !== null && brokenUrl === value

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const media = await uploadFile(file)
      onChange(media.url)
      toast.success('Uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(id) => (
        <div className="flex gap-3">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg">
            {value && kind === 'image' && isImageUrl(value) && !broken ? (
              <img src={value} alt="" onError={() => setBrokenUrl(value)} className="h-full w-full object-contain" />
            ) : kind === 'document' ? (
              <FileText size={24} className={value ? 'text-accent' : 'text-muted/50'} />
            ) : (
              <ImageIcon size={24} className="text-muted/50" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              id={id}
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value || null)}
              placeholder={kind === 'image' ? 'Upload, pick, or paste https://… or /pictures/…' : 'Upload, pick, or paste a link'}
              spellCheck={false}
              autoComplete="off"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" loading={busy} onClick={() => fileInput.current?.click()}>
                <Upload size={14} aria-hidden /> Upload
              </Button>
              <Button size="sm" onClick={() => setPickerOpen(true)}>
                <Library size={14} aria-hidden /> Library
              </Button>
              {value && (
                <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
                  <X size={14} aria-hidden /> Clear
                </Button>
              )}
            </div>
            <input ref={fileInput} type="file" hidden accept={ACCEPT[kind]} onChange={(e) => void handleFile(e.target.files?.[0])} />
          </div>
          <MediaPicker
            open={pickerOpen}
            kind={kind}
            onClose={() => setPickerOpen(false)}
            onPick={(item) => {
              onChange(item.url)
              setPickerOpen(false)
            }}
          />
        </div>
      )}
    </Field>
  )
}

function MediaPicker({ open, kind, onClose, onPick }: { open: boolean; kind: AssetKind; onClose: () => void; onPick: (item: MediaItem) => void }) {
  return (
    <Modal open={open} onClose={onClose} title={kind === 'image' ? 'Choose an image' : 'Choose a document'} wide>
      <PickerBody kind={kind} onPick={onPick} />
    </Modal>
  )
}

// Mounted only while the dialog is open, so it fetches fresh each time.
function PickerBody({ kind, onPick }: { kind: AssetKind; onPick: (item: MediaItem) => void }) {
  const { data: items, error, reload } = useFetch<MediaItem[]>('/admin/media')
  const visible = items?.filter((m) => (kind === 'document' ? m.mime === 'application/pdf' : m.mime.startsWith('image/')))

  return (
    <>
      {error && <ErrorNote message={error} onRetry={reload} />}
      {!items && !error && <Spinner />}
      {visible && visible.length === 0 && <p className="py-8 text-center text-sm text-muted">Nothing uploaded yet. Close this and use Upload.</p>}
      {visible && visible.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {visible.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onPick(m)}
                className={cn('group w-full overflow-hidden rounded-lg border border-border bg-bg text-left transition-colors hover:border-accent')}
              >
                <div className="flex aspect-square items-center justify-center bg-[repeating-conic-gradient(#1a2330_0%_25%,#121820_0%_50%)] bg-[length:16px_16px]">
                  {kind === 'image' ? <img src={m.url} alt="" loading="lazy" className="h-full w-full object-contain" /> : <FileText size={32} className="text-accent" />}
                </div>
                <p className="truncate px-2 py-1.5 text-xs text-muted group-hover:text-text">{m.originalName}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
