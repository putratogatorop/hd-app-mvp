interface RuleProps {
  variant?: 'thin' | 'thick'
  className?: string
}

export function Rule({ variant = 'thin', className = '' }: RuleProps) {
  return (
    <hr
      className={`${variant === 'thick' ? 'rule-editorial-thick' : 'rule-editorial'} ${className}`}
    />
  )
}
