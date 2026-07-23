// Drop-in replacement for next/link — renders a plain <a> pointed at the
// mapped static HTML file instead of doing client-side route transitions.

import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { logicalPathToFile } from './route-map'

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children?: ReactNode
}

export default function Link({ href, children, ...rest }: LinkProps) {
  const [pathPart, queryPart = ''] = href.split('?')
  const { file, idParam } = logicalPathToFile(pathPart)
  const params = new URLSearchParams(queryPart)
  if (idParam) params.set('id', idParam)
  const qs = params.toString()
  const dest = qs ? `${file}?${qs}` : file
  return (
    <a href={dest} {...rest}>
      {children}
    </a>
  )
}
