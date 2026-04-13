import { HTMLAttributes } from 'react'

interface NumeralProps extends HTMLAttributes<HTMLSpanElement> {
  pad?: number
  value: string | number
}

export function Numeral({ value, pad = 2, className = '', ...props }: NumeralProps) {
  const str = typeof value === 'number' ? String(value).padStart(pad, '0') : value
  return (
    <span className={`numeral ${className}`} {...props}>
      {str}
    </span>
  )
}
