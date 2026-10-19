export const without = <T,>(list: T[], index: number) => list.filter((_, i) => i !== index)

export const replaceAt = <T,>(list: T[], index: number, value: T) => list.map((item, i) => (i === index ? value : item))

export function swap<T>(list: T[], a: number, b: number): T[] {
  if (a < 0 || b < 0 || a >= list.length || b >= list.length) return list
  const copy = [...list]
  ;[copy[a], copy[b]] = [copy[b], copy[a]]
  return copy
}
