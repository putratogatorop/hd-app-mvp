// Drop-in replacement for next/navigation's useRouter/usePathname/useSearchParams,
// backed by plain history.pushState instead of the Next.js router. Filter changes
// stay on the same static HTML file (pushState only); navigating to a different
// section does a real page load, matching this bundle's one-HTML-file-per-route layout.

import { useCallback, useSyncExternalStore } from 'react'
import { baseName, currentFile, fileToLogicalPath, logicalPathToFile } from './route-map'

type Listener = () => void
const listeners = new Set<Listener>()

function emitChange() {
  listeners.forEach((l) => l())
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  window.addEventListener('popstate', emitChange)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', emitChange)
  }
}

function buildDest(url: string): { dest: string; sameFile: boolean } {
  const [pathPart, queryPart = ''] = url.split('?')
  const logicalPath = pathPart || fileToLogicalPath(currentFile())
  const { file, idParam } = logicalPathToFile(logicalPath)
  const params = new URLSearchParams(queryPart)
  if (idParam) params.set('id', idParam)
  const qs = params.toString()
  const dest = qs ? `${file}?${qs}` : file
  const activeFile = currentFile() || 'index.html'
  return { dest, sameFile: baseName(file) === baseName(activeFile) }
}

export function useRouter() {
  const push = useCallback((url: string) => {
    const { dest, sameFile } = buildDest(url)
    if (sameFile) {
      try {
        window.history.pushState(null, '', dest)
      } catch {
        // pushState can throw under a file:// origin — degrade silently.
      }
      emitChange()
    } else {
      window.location.href = dest
    }
  }, [])

  const replace = useCallback((url: string) => {
    const { dest, sameFile } = buildDest(url)
    if (sameFile) {
      try {
        window.history.replaceState(null, '', dest)
      } catch {
        // ignore — same file:// caveat as push()
      }
      emitChange()
    } else {
      window.location.href = dest
    }
  }, [])

  // No server to refetch from in a static bundle — just nudge subscribers to re-render.
  const refresh = useCallback(() => emitChange(), [])

  return { push, replace, refresh }
}

export function usePathname(): string {
  return useSyncExternalStore(
    subscribe,
    () => fileToLogicalPath(currentFile()),
    () => '/analytics',
  )
}

export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => '')
  return new URLSearchParams(search)
}
