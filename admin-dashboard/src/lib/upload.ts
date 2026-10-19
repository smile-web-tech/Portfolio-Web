import { api } from './api'
import type { MediaItem } from './types'

// Vercel functions reject request bodies over 4.5 MB; the API enforces 4 MB.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
const MAX_SIDE = 2400

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this image'))
    }
    img.src = url
  })
}

// Phone photos are routinely 5+ MB: shrink them in the browser so the upload fits the limit.
// The server re-encodes everything again regardless, so this is only about size.
async function shrink(file: File): Promise<File> {
  const raster = /^image\/(jpeg|png|webp|avif)$/.test(file.type)
  if (!raster || file.size <= MAX_UPLOAD_BYTES * 0.75) return file
  const img = await loadImage(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  if (!blob) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
}

export async function uploadFile(original: File): Promise<MediaItem> {
  const file = await shrink(original)
  if (file.size > MAX_UPLOAD_BYTES) {
    const what = file.type === 'application/pdf' ? 'PDF' : 'Image'
    throw new Error(`${what} is too large (max 4 MB). ${what === 'PDF' ? 'Host it elsewhere and paste the link instead.' : 'Use a smaller image.'}`)
  }
  return api.upload(file, file.name)
}
