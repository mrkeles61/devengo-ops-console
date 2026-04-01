import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getErrorInfo } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface ErrorCodeBadgeProps {
  code: string
  className?: string
}

export function ErrorCodeBadge({ code, className }: ErrorCodeBadgeProps) {
  const info = getErrorInfo(code)

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant="outline"
          className={cn(
            'rounded font-mono text-xs cursor-help border',
            info.retryable
              ? 'bg-warning/10 text-warning border-warning/30'
              : 'bg-destructive/10 text-destructive border-destructive/30',
            className,
          )}
        >
          {code}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-semibold">{info.label}</p>
        <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
        <p className="text-xs mt-1">
          {info.retryable ? 'Retryable' : 'Not retryable'}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
