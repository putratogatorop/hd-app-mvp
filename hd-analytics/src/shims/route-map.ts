// Maps the Next.js logical routes the ported components still reference
// (e.g. '/analytics/gift') to the actual static HTML files in this bundle.
// Matching is done by basename (extension-agnostic) so this still works if a
// static host serves "clean URLs" (e.g. /gift instead of /gift.html).

const FILE_BY_LOGICAL: Record<string, string> = {
  '/analytics': 'index.html',
  '/analytics/gift': 'gift.html',
  '/analytics/transactional': 'transactional.html',
  '/analytics/rfm': 'rfm.html',
  '/analytics/campaigns': 'campaigns.html',
  '/analytics/campaigns/new': 'campaigns-new.html',
}

const LOGICAL_BY_BASENAME: Record<string, string> = {
  '': '/analytics',
  'index': '/analytics',
  'gift': '/analytics/gift',
  'transactional': '/analytics/transactional',
  'rfm': '/analytics/rfm',
  'campaigns': '/analytics/campaigns',
  'campaigns-new': '/analytics/campaigns/new',
}

/** Strips a trailing ".html" so "gift.html" and "gift" (clean-URL hosting) compare equal. */
export function baseName(file: string): string {
  return file.replace(/\.html$/, '')
}

/** Basename of the currently-loaded static HTML file, e.g. "gift" or "gift.html". */
export function currentFile(): string {
  const seg = window.location.pathname.split('/').filter(Boolean).pop() ?? ''
  return seg
}

/** Given the current static file (+ its query string for campaign-detail's ?id=), derive the logical Next.js path. */
export function fileToLogicalPath(file: string): string {
  const base = baseName(file)
  if (base === 'campaign-detail') {
    const id = new URLSearchParams(window.location.search).get('id') ?? ''
    return `/analytics/campaigns/${id}`
  }
  return LOGICAL_BY_BASENAME[base] ?? '/analytics'
}

/** Given a logical Next.js path (e.g. '/analytics/campaigns/abc123'), resolve which static file it maps to. */
export function logicalPathToFile(path: string): { file: string; idParam?: string } {
  if (path.startsWith('/analytics/campaigns/')) {
    const rest = path.slice('/analytics/campaigns/'.length)
    if (rest && rest !== 'new') return { file: 'campaign-detail.html', idParam: rest }
  }
  return { file: FILE_BY_LOGICAL[path] ?? 'index.html' }
}
