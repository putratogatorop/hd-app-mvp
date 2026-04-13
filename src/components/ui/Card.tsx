import { HTMLAttributes } from 'react'

type Variant = 'paper' | 'ink' | 'cream' | 'bare'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  paper: 'bg-hd-paper border border-hd-ink/10 shadow-paper',
  cream: 'bg-hd-cream-deep border border-hd-ink/10',
  ink: 'bg-hd-ink text-hd-cream border border-hd-ink',
  bare: 'bg-transparent border border-hd-ink/15',
}

export function Card({ className = '', variant = 'paper', ...props }: CardProps) {
  return <div className={`relative ${variants[variant]} ${className}`} {...props} />
}
