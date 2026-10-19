import { useEffect, useState } from 'react';

// Same-origin /api by default (Vercel). Set VITE_API_URL when the API lives elsewhere (e.g. Docker dev).
const API_BASE = import.meta.env.VITE_API_URL ?? '';
const CACHE_KEY = 'portfolio:data:v1';

// Files uploaded in local dev are served by the API; everything else is already absolute or a static path.
export const assetUrl = (url) => (url && url.startsWith('/uploads/') ? `${API_BASE}${url}` : url);

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable (private mode, quota) */
  }
}

// Stale-while-revalidate: returning visitors see the last copy immediately, and still see
// something if the API is briefly unreachable. Fresh data replaces it as soon as it arrives.
export function usePortfolioApi() {
  const [state, setState] = useState(() => {
    const cached = readCache();
    return { data: cached, loading: !cached, error: null };
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/public/portfolio`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        writeCache(data);
        setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.error('Failed to fetch portfolio data:', error);
        setState((s) => ({ ...s, loading: false, error }));
      });
    return () => controller.abort();
  }, []);

  return state;
}

// Reports one visit per browser tab session to our own API (see backend/routes/public.js).
// Only path, referrer and language are sent; IP, location and device are read server-side.
// Fire-and-forget: it can never affect the page, and it honours Do Not Track.
export function trackVisit() {
  try {
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
    if (sessionStorage.getItem('portfolio:visit') === '1') return;
    sessionStorage.setItem('portfolio:visit', '1');
    fetch(`${API_BASE}/api/public/visit`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer || undefined,
        language: navigator.language || undefined,
      }),
    }).catch(() => {});
  } catch {
    /* storage or fetch unavailable */
  }
}
