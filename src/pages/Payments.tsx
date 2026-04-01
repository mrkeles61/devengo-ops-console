import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { ErrorCodeBadge } from '@/components/shared/ErrorCodeBadge'
import { IBANDisplay } from '@/components/shared/IBANDisplay'
import { PaymentTimeline } from '@/components/shared/PaymentTimeline'
import { mockPayments, mockAccounts, mockRetryLog, mockRetryRules } from '@/lib/mock-data'
import { truncateId, maskIBAN, formatDateShort, formatDuration } from '@/lib/format'
import { getErrorInfo } from '@/lib/errors'
import { Plus, Search, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Payment } from '@/lib/types'
import { useAccounts, useSendPayment } from '@/hooks/useDevengo'
import { useDataMode } from '@/contexts/DataModeContext'
import { toast } from 'sonner'

export default function Payments() {
  const { isLive } = useDataMode()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [demoPayments, setDemoPayments] = useState<Payment[]>([])
  const { accounts: realAccounts } = useAccounts()
  const { send, sending, result: sendResult } = useSendPayment()
  const [newPayment, setNewPayment] = useState({ account_id: '', iban: '', recipient: '', description: '', amount: '' })
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const allPayments = [...demoPayments, ...mockPayments]

  const filtered = allPayments.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search && !p.id.includes(search) && !p.destination_iban.includes(search.replace(/\s/g, ''))) return false
    return true
  })

  const validate = (): string[] => {
    const errors: string[] = []
    if (!newPayment.account_id) errors.push('Select a source account')
    if (!newPayment.iban || newPayment.iban.replace(/\s/g, '').length < 15) errors.push('Enter a valid IBAN (min 15 characters)')
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) errors.push('Amount must be greater than 0')
    if (!newPayment.recipient) errors.push('Recipient name is required')
    if (!newPayment.description) errors.push('Description is required')
    return errors
  }

  const handleSendPayment = async () => {
    const errors = validate()
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])

    if (isLive) {
      // Real API call
      await send({
        account_id: newPayment.account_id,
        destination_iban: newPayment.iban.replace(/\s/g, ''),
        recipient: newPayment.recipient,
        description: newPayment.description,
        amount_cents: Math.round(parseFloat(newPayment.amount) * 100),
      })
      // Result will show via sendResult state
      toast.success('Payment sent to Devengo API')
    } else {
      // Demo mode — simulate
      const demoId = `pyo_demo_${crypto.randomUUID().slice(0, 8)}`
      const amountCents = Math.round(parseFloat(newPayment.amount) * 100)
      const newDemoPayment: Payment = {
        id: demoId,
        source_account_id: newPayment.account_id,
        source_iban: mockAccounts.find(a => a.id === newPayment.account_id)?.iban ?? 'ES0000000000000000000000',
        destination_iban: newPayment.iban.replace(/\s/g, ''),
        amount_cents: amountCents,
        currency: 'EUR',
        concept: newPayment.description,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        confirmed_at: new Date(Date.now() + 8000).toISOString(),
        delivery_time_seconds: 8,
      }
      setDemoPayments(prev => [newDemoPayment, ...prev])
      toast.success('Payment created (demo)', { description: `${demoId} — confirmed in 8s` })
      setDialogOpen(false)
      setNewPayment({ account_id: '', iban: '', recipient: '', description: '', amount: '' })
    }
  }

  const accounts = isLive && realAccounts.length > 0 ? realAccounts : mockAccounts

  // Retry stats
  const retryStats = mockRetryRules.map(rule => {
    const retries = mockRetryLog.filter(r => r.error_code === rule.error_code)
    const successes = retries.filter(r => r.result === 'success').length
    return { code: rule.error_code, info: getErrorInfo(rule.error_code), total: retries.length, successRate: retries.length > 0 ? Math.round((successes / retries.length) * 100) : 0, ...rule }
  })

  const retryChartData = Array.from({ length: 14 }, (_, i) => ({ day: `D-${14 - i}`, rate: 35 + Math.floor(Math.random() * 35) }))

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-secondary">
            <TabsTrigger value="all">All Payments</TabsTrigger>
            <TabsTrigger value="retry">Retry Monitor</TabsTrigger>
          </TabsList>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-2" />}>
              <Plus className="h-4 w-4" /> New Payment
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create Payment</DialogTitle>
                <DialogDescription>{isLive ? 'Send a real payment through Devengo Sandbox.' : 'Simulate a payment in Demo Mode.'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Source Account</label>
                  <Select value={newPayment.account_id} onValueChange={(v) => v && setNewPayment(p => ({ ...p, account_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.filter((a: { status: string }) => a.status === 'active').map((a: { id: string; iban?: string; identifiers?: { iban: string }[] }) => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="font-mono text-xs">{maskIBAN(a.iban || a.identifiers?.[0]?.iban || a.id)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Destination IBAN</label>
                  <Input placeholder="ES6369409999010000000002" className="font-mono" value={newPayment.iban} onChange={(e) => setNewPayment(p => ({ ...p, iban: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Recipient Name</label>
                  <Input placeholder="Acme Corp SL" value={newPayment.recipient} onChange={(e) => setNewPayment(p => ({ ...p, recipient: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Amount (EUR)</label>
                    <Input type="number" placeholder="0.00" step="0.01" className="font-mono" value={newPayment.amount} onChange={(e) => setNewPayment(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Description</label>
                    <Input placeholder="Invoice payment" value={newPayment.description} onChange={(e) => setNewPayment(p => ({ ...p, description: e.target.value }))} />
                  </div>
                </div>

                {/* Validation errors */}
                {validationErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1">
                    {validationErrors.map((e, i) => (
                      <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3 shrink-0" /> {e}
                      </p>
                    ))}
                  </div>
                )}

                {/* Success result */}
                {sendResult?.success && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    <p className="text-sm text-success">Payment created: <span className="font-mono">{sendResult.payment?.id}</span></p>
                  </div>
                )}
                {sendResult?.error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{sendResult.error}</p>
                  </div>
                )}

                <Button className="w-full" disabled={sending} onClick={handleSendPayment}>
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</> : isLive ? 'Send Payment' : 'Create Payment (Demo)'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by ID or IBAN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs">Payment ID</TableHead>
                    <TableHead className="text-xs">From</TableHead>
                    <TableHead className="text-xs">To IBAN</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Error</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="text-xs">Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No payments yet — create one to get started</TableCell></TableRow>
                  ) : filtered.slice(0, 50).map((p) => (
                    <TableRow key={p.id} className="border-border cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => setSelectedPayment(p)}>
                      <TableCell className="font-mono text-xs">{truncateId(p.id)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{maskIBAN(p.source_iban)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{maskIBAN(p.destination_iban)}</TableCell>
                      <TableCell className="text-right"><AmountDisplay cents={p.amount_cents} className="text-sm" /></TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>{p.error_code ? <ErrorCodeBadge code={p.error_code} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{formatDateShort(p.created_at)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.delivery_time_seconds ? formatDuration(p.delivery_time_seconds) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{filtered.length} payments</p>
        </TabsContent>

        <TabsContent value="retry" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Retry Rules</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs">Error Code</TableHead>
                    <TableHead className="text-xs">Label</TableHead>
                    <TableHead className="text-xs">Retryable</TableHead>
                    <TableHead className="text-xs">Max Retries</TableHead>
                    <TableHead className="text-xs">Backoff</TableHead>
                    <TableHead className="text-xs">Success Rate</TableHead>
                    <TableHead className="text-xs">Total Retries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retryStats.map(r => (
                    <TableRow key={r.code} className="border-border">
                      <TableCell><ErrorCodeBadge code={r.code} /></TableCell>
                      <TableCell className="text-sm">{r.info.label}</TableCell>
                      <TableCell><Badge variant="outline" className={r.info.retryable ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive border-destructive/30'}>{r.info.retryable ? 'Yes' : 'No'}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{r.max_retries}</TableCell>
                      <TableCell className="text-sm capitalize">{r.backoff_type}</TableCell>
                      <TableCell className="font-mono text-sm">{r.successRate}%</TableCell>
                      <TableCell className="font-mono text-sm">{r.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Retry Success Rate (14 days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={retryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#71717a' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }} />
                  <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment detail sheet */}
      <Sheet open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <SheetContent className="bg-card border-border w-[440px] overflow-y-auto">
          {selectedPayment && (
            <>
              <SheetHeader><SheetTitle className="font-mono text-sm">{selectedPayment.id}</SheetTitle></SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="flex items-center gap-3">
                  <AmountDisplay cents={selectedPayment.amount_cents} className="text-2xl font-semibold" />
                  <StatusBadge status={selectedPayment.status} />
                </div>
                <div className="space-y-3">
                  <div><p className="text-xs text-muted-foreground mb-1">From</p><IBANDisplay iban={selectedPayment.source_iban} copyable /></div>
                  <div><p className="text-xs text-muted-foreground mb-1">To</p><IBANDisplay iban={selectedPayment.destination_iban} copyable /></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Concept</p><p className="text-sm">{selectedPayment.concept}</p></div>
                </div>
                {selectedPayment.error_code && (
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ErrorCodeBadge code={selectedPayment.error_code} />
                        <span className="text-sm font-medium">{getErrorInfo(selectedPayment.error_code).label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{getErrorInfo(selectedPayment.error_code).description}</p>
                      {getErrorInfo(selectedPayment.error_code).retryable && (
                        <Button size="sm" className="mt-3 w-full" onClick={() => toast.info('Retry scheduled', { description: `${selectedPayment.id} will be retried` })}>Retry Payment</Button>
                      )}
                    </CardContent>
                  </Card>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Timeline</p>
                  <PaymentTimeline steps={[
                    { label: 'Created', timestamp: selectedPayment.created_at, status: 'completed' },
                    { label: 'Processing', status: selectedPayment.status === 'processing' ? 'current' : selectedPayment.status === 'created' ? 'pending' : 'completed' },
                    ...(selectedPayment.status === 'confirmed'
                      ? [{ label: 'Confirmed', timestamp: selectedPayment.confirmed_at, status: 'completed' as const }]
                      : selectedPayment.status === 'failed'
                        ? [{ label: 'Failed', timestamp: selectedPayment.failed_at, status: 'failed' as const }]
                        : [{ label: 'Awaiting', status: 'pending' as const }]),
                  ]} />
                </div>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => toast.info('Receipt downloaded')}>
                  <Download className="h-4 w-4" /> Download Receipt
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
