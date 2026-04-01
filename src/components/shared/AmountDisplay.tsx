import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/format'

interface AmountDisplayProps {
  cents: number
  currency?: string
  className?: string
}

export function AmountDisplay({ cents, currency = 'EUR', className }: AmountDisplayProps) {
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {formatAmount(cents, currency)}
    </span>
  )
}
