import { HTMLAttributes } from 'react'

interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  number?: string | number
}

export function Eyebrow({ number, className = '', children, ...props }: EyebrowProps) {
  return (
    <span
      className={`inline-flex items-center gap-3 eyebrow ${className}`}
      {...props}
    >
      {number !== undefined && (
        <span className="numeral text-hd-ink/60 text-[0.6875rem]">
          {typeof number === 'number' ? String(number).padStart(2, '0') : number}
        </span>
      )}
      <span className="h-px w-6 bg-hd-burgundy/60" aria-hidden />
      <span>{children}</span>
    </span>
  )
}
