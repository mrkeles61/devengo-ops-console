import { useLocation, useNavigate } from 'react-router-dom'
import { Switch } from '@/components/ui/switch'
import { Bell } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/': 'Operations Dashboard',
  '/payments': 'Payments & Retry Monitor',
  '/reconciliation': 'Reconciliation Engine',
  '/webhooks': 'Webhook Health Monitor',
  '/automations': 'Automations & Alerts',
  '/playground': 'Agentic Payment Playground',
}

interface HeaderProps {
  useMockData: boolean
  onToggleMockData: (v: boolean) => void
  alertCount?: number
}

export function Header({ useMockData, onToggleMockData, alertCount = 0 }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] ?? 'Devengo Ops Console'

  return (
    <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
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
        <span className="text-xs text-muted-foreground">
          {useMockData ? 'Demo Data' : 'Live Data'}
        </span>
        <Switch
          checked={useMockData}
          onCheckedChange={onToggleMockData}
          className="data-[state=checked]:bg-primary"
        />
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">Sandbox</span>
        </div>
      </div>
    </header>
  )
}
