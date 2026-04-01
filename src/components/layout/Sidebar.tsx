import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowUpDown,
  GitCompare,
  Webhook,
  Zap,
  Terminal,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/payments', icon: ArrowUpDown, label: 'Payments' },
  { to: '/reconciliation', icon: GitCompare, label: 'Reconciliation' },
  { to: '/webhooks', icon: Webhook, label: 'Webhooks' },
  { to: '/automations', icon: Zap, label: 'Automations' },
  { to: '/playground', icon: Terminal, label: 'Playground' },
]

export function Sidebar() {
  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">D</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Devengo</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Ops Console</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Built by Eren Keleş
        </p>
        <p className="text-[10px] text-muted-foreground">
          Sandbox • v1.0.0
        </p>
      </div>
    </aside>
  )
}
