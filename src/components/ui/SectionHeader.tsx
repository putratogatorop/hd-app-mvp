import { ReactNode } from 'react'
import { Eyebrow } from './Eyebrow'

interface SectionHeaderProps {
  eyebrow?: string
  number?: string | number
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  eyebrow,
  number,
  title,
  description,
  align = 'left',
  className = '',
}: SectionHeaderProps) {
  return (
    <header
      className={`flex flex-col gap-5 ${align === 'center' ? 'items-center text-center' : ''} ${className}`}
    >
      {eyebrow && <Eyebrow number={number}>{eyebrow}</Eyebrow>}
      <h2 className="font-display text-display-md text-hd-ink">{title}</h2>
      {description && (
        <p className="max-w-xl text-[0.95rem] leading-relaxed text-hd-ink/70">
          {description}
        </p>
      )}
    </header>
  )
}
