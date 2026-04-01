import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { IBANDisplay } from '@/components/shared/IBANDisplay'
import { mockReconciliation, mockIncomingPayments } from '@/lib/mock-data'
import { formatDateShort, formatAmount } from '@/lib/format'
import { Plus, Check, X, AlertTriangle, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Reconciliation() {
  const pending = mockReconciliation.filter(r => r.status === 'pending')
  const matched = mockReconciliation.filter(r => r.status === 'matched')
  const mismatched = mockReconciliation.filter(r => r.status === 'mismatched')
  const unmatched = mockIncomingPayments.slice(0, 4)

  const chartData = [
    { name: 'Week 1', matched: 42, mismatched: 3, orphaned: 1 },
    { name: 'Week 2', matched: 38, mismatched: 5, orphaned: 2 },
    { name: 'Week 3', matched: 51, mismatched: 2, orphaned: 0 },
    { name: 'Week 4', matched: 45, mismatched: 4, orphaned: 1 },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-mono font-semibold">{pending.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-mono font-semibold text-success">{matched.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Matched</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-mono font-semibold text-destructive">{mismatched.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Mismatched</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-mono font-semibold text-info">{unmatched.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Orphaned</p>
          </CardContent>
        </Card>
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expected Payments */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Expected Payments</CardTitle>
              <Dialog>
                <DialogTrigger render={<Button size="sm" variant="outline" className="h-7 gap-1" />}>
                  <Plus className="h-3 w-3" /> Add
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Add Expected Payment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Business Reference</label>
                      <Input placeholder="INV-2024001" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Expected Amount (EUR)</label>
                      <Input type="number" placeholder="0.00" step="0.01" className="font-mono" />
                    </div>
                    <Button className="w-full">Add Expected Payment</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {r.business_reference}
                  </span>
                  <StatusBadge status="pending" />
                </div>
                <AmountDisplay cents={r.expected_amount_cents} className="text-sm" />
                <p className="text-xs text-muted-foreground">{formatDateShort(r.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Incoming Payments */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Incoming Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unmatched.map(p => (
              <div key={p.id} className="p-3 rounded-lg bg-warning/5 border border-warning/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">{p.id.slice(0, 12)}</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                </div>
                <AmountDisplay cents={p.amount_cents} className="text-sm" />
                <IBANDisplay iban={p.source_iban} masked className="text-xs text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{formatDateShort(p.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Matched / Mismatched */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Matched & Mismatched</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {matched.slice(0, 3).map(r => (
              <div key={r.id} className="p-3 rounded-lg bg-success/5 border border-success/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.business_reference}</span>
                  <Check className="h-4 w-4 text-success" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Expected:</span>
                  <AmountDisplay cents={r.expected_amount_cents} className="text-xs" />
                  <span className="text-success">=</span>
                  <AmountDisplay cents={r.actual_amount_cents!} className="text-xs" />
                </div>
              </div>
            ))}
            {mismatched.map(r => (
              <div key={r.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.business_reference}</span>
                  <X className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Expected:</span>
                  <AmountDisplay cents={r.expected_amount_cents} className="text-xs" />
                  <span className="text-destructive">≠</span>
                  <AmountDisplay cents={r.actual_amount_cents!} className="text-xs" />
                </div>
                <p className="text-xs text-destructive">
                  Δ {formatAmount(Math.abs(r.expected_amount_cents - (r.actual_amount_cents ?? 0)))}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Reconciliation History</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="matched" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mismatched" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orphaned" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
