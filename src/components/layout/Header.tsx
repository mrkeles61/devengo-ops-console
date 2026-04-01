import { useLocation, useNavigate } from 'react-router-dom'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { useDataMode } from '@/contexts/DataModeContext'
import { isConfigured } from '@/lib/devengo'

const pageTitles: Record<string, string> = {
  '/': 'Operations Dashboard',
  '/payments': 'Payments & Retry Monitor',
  '/reconciliation': 'Reconciliation Engine',
  '/webhooks': 'Webhook Health Monitor',
  '/automations': 'Automations & Alerts',
  '/sales': 'Sales Hub',
  '/content': 'Content Hub',
  '/playground': 'Agentic Payment Playground',
}

interface HeaderProps {
  alertCount?: number
}

export function Header({ alertCount = 0 }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleMode, isLive } = useDataMode()
  const title = pageTitles[location.pathname] ?? 'Devengo Ops Console'

  return (
    <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Alert bell */}
        <button
          onClick={() => navigate('/automations')}
          className="relative p-1.5 rounded-md hover:bg-secondary transition-colors"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>
        <div className="h-6 w-px bg-border" />

        {/* Data mode toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isLive ? 'Live' : 'Demo'}
          </span>
          <Switch
            checked={isLive}
            onCheckedChange={toggleMode}
          />
          <Badge
            variant="outline"
            className={isLive
              ? 'bg-success/10 text-success border-success/30 text-[10px]'
              : 'bg-warning/10 text-warning border-warning/30 text-[10px]'
            }
          >
            {isLive ? (isConfigured() ? 'Sandbox' : 'No Keys') : 'Demo Data'}
          </Badge>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isLive && isConfigured() ? 'bg-success animate-pulse' : isLive ? 'bg-destructive' : 'bg-warning'}`} />
          <span className="text-xs text-muted-foreground">
            {isLive && isConfigured() ? 'Connected' : isLive ? 'Not Connected' : 'Sandbox'}
          </span>
        </div>
      </div>
    </header>
  )
}
