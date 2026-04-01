import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusBadge } from './StatusBadge'
import { AmountDisplay } from './AmountDisplay'
import { formatDateShort } from '@/lib/format'
import type { WebhookEvent } from '@/lib/types'
import { Activity } from 'lucide-react'

interface LiveEventFeedProps {
  events: WebhookEvent[]
  maxItems?: number
}

export function LiveEventFeed({ events, maxItems = 50 }: LiveEventFeedProps) {
  const items = events.slice(0, maxItems)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Activity className="h-4 w-4 text-success" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success animate-pulse" />
        </div>
        <h3 className="text-sm font-medium">Live Events</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <ScrollArea className="h-[420px]">
        <div className="space-y-1">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events yet. Create a test payment to see events flow.
            </p>
          ) : (
            items.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <span className="text-xs font-mono text-muted-foreground w-[90px] shrink-0">
                  {formatDateShort(evt.received_at)}
                </span>
                <StatusBadge status={evt.event_type.split('.')[1] ?? evt.event_type} />
                {evt.amount_cents && (
                  <AmountDisplay cents={evt.amount_cents} className="text-sm ml-auto" />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
