import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  confirmed: 'bg-success/15 text-success border-success/30',
  matched: 'bg-success/15 text-success border-success/30',
  active: 'bg-success/15 text-success border-success/30',
  validated: 'bg-success/15 text-success border-success/30',
  processing: 'bg-warning/15 text-warning border-warning/30',
  created: 'bg-warning/15 text-warning border-warning/30',
  pending: 'bg-warning/15 text-warning border-warning/30',
  failed: 'bg-destructive/15 text-destructive border-destructive/30',
  rejected: 'bg-destructive/15 text-destructive border-destructive/30',
  mismatched: 'bg-destructive/15 text-destructive border-destructive/30',
  orphaned: 'bg-info/15 text-info border-info/30',
  inactive: 'bg-muted text-muted-foreground border-border',
  deactivated: 'bg-muted text-muted-foreground border-border',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border',
        statusStyles[status] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {status}
    </Badge>
  )
}
