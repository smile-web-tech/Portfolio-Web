import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

interface State<T> {
  data: T | null
  error: string | null
  /** The request key the data belongs to; differs from the current key while a refetch is in flight. */
  key: string | null
}

/**
 * GET a path on mount (and when the path changes or on reload). State is only set from the async
 * result, never synchronously in the effect. Previous data stays in place during a refetch, so
 * charts can keep their frame and dim instead of flashing a skeleton.
 */
export function useFetch<T>(path: string, enabled = true) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, key: null })
  const [nonce, setNonce] = useState(0)
  const key = `${path}#${nonce}`

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    api
      .get<T>(path)
      .then((data) => !cancelled && setState({ data, error: null, key }))
      .catch((err: Error) => !cancelled && setState((s) => ({ data: s.data, error: err.message, key })))
    return () => {
      cancelled = true
    }
  }, [path, enabled, key])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data: state.data, error: state.key === key ? state.error : null, loading: enabled && state.key !== key, reload }
}
