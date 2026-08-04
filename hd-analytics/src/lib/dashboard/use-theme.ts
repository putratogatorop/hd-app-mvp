// Theme toggle state, shared across all dashboard pages. Mirrors the
// module-level store pattern in src/shims/next-navigation.tsx: since this is
// a multi-page static bundle (no shared React tree between pages), state
// lives outside React and every consumer on a page re-renders together the
// instant toggleTheme() fires, rather than waiting for a reload.

import { useSyncExternalStore } from 'react'
import type { ThemeName } from './theme'

const STORAGE_KEY = 'hd-analytics-theme'
const listeners = new Set<() => void>()

function readInitial(): ThemeName {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'dark' || attr === 'light') return attr
  }
  return 'light'
}

let current: ThemeName = readInitial()

function apply(theme: ThemeName) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage can throw under a file:// origin or in private mode — ignore.
  }
}

export function toggleTheme() {
  current = current === 'light' ? 'dark' : 'light'
  apply(current)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme(): { theme: ThemeName; toggleTheme: () => void } {
  const theme = useSyncExternalStore(subscribe, () => current, (): ThemeName => 'light')
  return { theme, toggleTheme }
}
