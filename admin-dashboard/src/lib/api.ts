import type { MediaItem } from './types'

// Same-origin by default (/api on the same Vercel project). VITE_API_URL is for split deployments.
const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`

export interface FieldIssue {
  path: string
  message: string
}

export class ApiError extends Error {
  status: number
  code?: string
  issues: FieldIssue[]
  extra: Record<string, unknown>

  constructor(status: number, message: string, body: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.code = typeof body.code === 'string' ? body.code : undefined
    this.issues = Array.isArray(body.issues) ? (body.issues as FieldIssue[]) : []
    this.extra = body
  }

  /** First message for a form field, if the server flagged it. */
  fieldError(path: string): string | undefined {
    return this.issues.find((i) => i.path === path)?.message
  }
}

let csrfToken = ''
let onUnauthorized: () => void = () => {}

export const setCsrfToken = (token: string) => {
  csrfToken = token
}
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn
}

async function send<T>(method: string, path: string, body?: BodyInit | null, json = true): Promise<T> {
  const headers: Record<string, string> = {}
  if (json && body) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body, credentials: 'same-origin', cache: 'no-store' })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection.')
  }

  let data: Record<string, unknown> = {}
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    // A 401 on anything but the login call means the session ended.
    if (res.status === 401 && path !== '/auth/login') onUnauthorized()
    throw new ApiError(res.status, typeof data.error === 'string' ? data.error : `Request failed (${res.status})`, data)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => send<T>('GET', path),
  post: <T>(path: string, body?: unknown) => send<T>('POST', path, body === undefined ? undefined : JSON.stringify(body)),
  put: <T>(path: string, body?: unknown) => send<T>('PUT', path, body === undefined ? undefined : JSON.stringify(body)),
  del: <T>(path: string) => send<T>('DELETE', path),
  upload(file: File | Blob, name?: string) {
    const form = new FormData()
    form.append('file', file, name ?? (file instanceof File ? file.name : 'upload'))
    return send<MediaItem>('POST', '/admin/media', form, false)
  },
}
