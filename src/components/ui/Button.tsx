import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'ghost' | 'ink' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base =
  'inline-flex items-center justify-center gap-2 font-sans tracking-wide uppercase text-[0.7rem] font-medium transition-[transform,background,color,border] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] disabled:opacity-40 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-hd-burgundy text-hd-cream hover:bg-hd-burgundy-dark active:translate-y-[1px] border border-hd-burgundy',
  ghost:
    'bg-transparent text-hd-ink border border-hd-ink/30 hover:border-hd-ink hover:bg-hd-ink/5',
  ink: 'bg-hd-ink text-hd-cream hover:bg-hd-ink/90 active:translate-y-[1px] border border-hd-ink',
  gold: 'bg-hd-gold text-hd-ink hover:bg-[#a07f1f] active:translate-y-[1px] border border-hd-gold',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4',
  md: 'h-12 px-6',
  lg: 'h-14 px-8 text-xs',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
)
Button.displayName = 'Button'
