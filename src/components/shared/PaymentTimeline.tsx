import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { Check, Clock, X, Loader2 } from 'lucide-react'

interface TimelineStep {
  label: string
  timestamp?: string
  status: 'completed' | 'current' | 'pending' | 'failed'
}

interface PaymentTimelineProps {
  steps: TimelineStep[]
}

const iconMap = {
  completed: <Check className="h-4 w-4" />,
  current: <Loader2 className="h-4 w-4 animate-spin" />,
  pending: <Clock className="h-4 w-4" />,
  failed: <X className="h-4 w-4" />,
}

const colorMap = {
  completed: 'bg-success text-white',
  current: 'bg-primary text-primary-foreground',
  pending: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive text-white',
}

export function PaymentTimeline({ steps }: PaymentTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', colorMap[step.status])}>
              {iconMap[step.status]}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-px flex-1 min-h-[32px]', step.status === 'completed' ? 'bg-success' : 'bg-border')} />
            )}
          </div>
          <div className="pb-6">
            <p className="text-sm font-medium">{step.label}</p>
            {step.timestamp && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {formatDate(step.timestamp)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
