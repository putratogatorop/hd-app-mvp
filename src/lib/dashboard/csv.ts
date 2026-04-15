// Tiny client-side CSV export. Good enough for dashboard tables.
// Handles commas, quotes, newlines per RFC 4180.

function escape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'number' || typeof v === 'boolean' ? String(v) : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export interface CSVColumn<T> {
  header: string
  /** Either a key on T, or a function deriving the cell value. */
  value: keyof T | ((row: T) => unknown)
}

export function toCSV<T>(rows: T[], columns: CSVColumn<T>[]): string {
  const head = columns.map((c) => escape(c.header)).join(',')
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = typeof c.value === 'function' ? c.value(r) : r[c.value]
      return escape(v)
    }).join(',')
  )
  return [head, ...body].join('\r\n')
}

/** Trigger a browser download for the given CSV text. */
export function downloadCSV<T>(
  filename: string,
  rows: T[],
  columns: CSVColumn<T>[],
): void {
  const csv = toCSV(rows, columns)
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
