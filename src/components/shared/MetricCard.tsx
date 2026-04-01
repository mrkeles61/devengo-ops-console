import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  mono?: boolean
}

export function MetricCard({ label, value, trend, trendLabel, icon, mono = true }: MetricCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={cn('text-3xl font-semibold tracking-tight', mono && 'font-mono')}>
              {value}
            </p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={cn(trend >= 0 ? 'text-success' : 'text-destructive')}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
                {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
              </div>
            )}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
