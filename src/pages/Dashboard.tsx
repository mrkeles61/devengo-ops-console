import { MetricCard } from '@/components/shared/MetricCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { ErrorCodeBadge } from '@/components/shared/ErrorCodeBadge'
import { LiveEventFeed } from '@/components/shared/LiveEventFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet, ArrowUpDown, CheckCircle, Clock, Webhook, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getStats, getPaymentsByHour, getErrorDistribution, mockPayments, mockWebhookEvents } from '@/lib/mock-data'
import { truncateId, maskIBAN, formatDateShort, formatAmount } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import { useAccounts } from '@/hooks/useDevengo'
import { useLiveEvents } from '@/hooks/useDevengo'
import { isConfigured } from '@/lib/devengo'
import type { WebhookEvent } from '@/lib/types'

const COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#06b6d4', '#a855f7']

export default function Dashboard() {
  const stats = getStats()
  const hourlyData = getPaymentsByHour()
  const errorDist = getErrorDistribution()
  const recentPayments = mockPayments.slice(0, 10)
  const navigate = useNavigate()
  const { accounts } = useAccounts()
  const { events: liveEvents } = useLiveEvents()

  // Merge real account data into stats
  const realBalance = accounts.reduce((s, a) => s + (a.balance?.available?.cents || 0), 0)
  const realAccountCount = accounts.filter(a => a.status === 'active').length

  // Convert Supabase events to WebhookEvent format for LiveEventFeed
  const realWebhookEvents: WebhookEvent[] = liveEvents.map(e => ({
    id: e.id as string,
    event_type: e.event_type as string,
    payload: (e.payload as Record<string, unknown>) || {},
    payment_id: e.payment_id as string | undefined,
    amount_cents: e.amount_cents as number | undefined,
    status: e.status as string | undefined,
    error_code: e.error_code as string | undefined,
    source_iban: e.source_iban as string | undefined,
    destination_iban: e.destination_iban as string | undefined,
    received_at: e.received_at as string,
    processed: e.processed as boolean,
  }))

  // Use real events if available, otherwise mock
  const feedEvents = realWebhookEvents.length > 0 ? realWebhookEvents : mockWebhookEvents

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Total Accounts" value={isConfigured() && realAccountCount > 0 ? realAccountCount : stats.totalAccounts} icon={<Wallet className="h-5 w-5" />} trend={0} trendLabel={isConfigured() && realBalance > 0 ? formatAmount(realBalance) : 'active'} />
        <MetricCard label="Payments Today" value={isConfigured() ? liveEvents.filter(e => (e.event_type as string)?.includes('confirmed')).length : stats.paymentsToday} icon={<ArrowUpDown className="h-5 w-5" />} trend={12} trendLabel="vs yesterday" />
        <MetricCard label="Success Rate" value={`${stats.successRate}%`} icon={<CheckCircle className="h-5 w-5" />} trend={2.1} trendLabel="vs last week" />
        <MetricCard label="Avg Delivery" value={`${stats.avgDeliveryTime}s`} icon={<Clock className="h-5 w-5" />} trend={-5} trendLabel="faster" />
        <MetricCard label="Active Webhooks" value={stats.activeWebhooks} icon={<Webhook className="h-5 w-5" />} />
        <MetricCard label="Pending Recon" value={stats.pendingReconciliation} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      {/* Charts + Live feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Charts */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payment Activity (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#71717a' }} interval={3} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Area type="monotone" dataKey="confirmed" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="pending" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="failed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Error Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={errorDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {errorDist.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {errorDist.map((item, i) => (
                    <div key={item.code} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-mono text-xs">{item.code}</span>
                      <span className="text-muted-foreground">({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live feed */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border h-full">
            <CardContent className="p-4">
              <LiveEventFeed events={feedEvents} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent payments table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs">Payment ID</TableHead>
                <TableHead className="text-xs">From</TableHead>
                <TableHead className="text-xs">To</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Error</TableHead>
                <TableHead className="text-xs">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((p) => (
                <TableRow
                  key={p.id}
                  className="border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => navigate('/payments')}
                >
                  <TableCell className="font-mono text-xs">{truncateId(p.id)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{maskIBAN(p.source_iban)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{maskIBAN(p.destination_iban)}</TableCell>
                  <TableCell className="text-right"><AmountDisplay cents={p.amount_cents} className="text-sm" /></TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell>{p.error_code ? <ErrorCodeBadge code={p.error_code} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDateShort(p.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
