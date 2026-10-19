const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null

export function countryName(code: string | null): string {
  if (!code) return 'Unknown'
  try {
    return regionNames?.of(code) ?? code
  } catch {
    return code
  }
}

/** Regional-indicator pair, e.g. "HU" -> 🇭🇺. Empty for unknown. (Windows shows the letters instead.) */
export function flagEmoji(code: string | null): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) return '🌐'
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

export const compact = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
export const full = (n: number) => new Intl.NumberFormat('en').format(n)
