import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorCodeBadge } from '@/components/shared/ErrorCodeBadge'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { useAlerts, useRetryRules, useBalanceRules, useAutomationLog } from '@/hooks/useSupabase'
import { WEBHOOK_URL } from '@/lib/supabase'
import { formatDateShort, formatRelative } from '@/lib/format'
import { getErrorInfo } from '@/lib/errors'
import { cn } from '@/lib/utils'
import {
  Webhook, RefreshCw, GitCompare, Gauge, FileText,
  Bell, CheckCircle, AlertTriangle, AlertCircle, Info,
  Copy, Check, Plus,
} from 'lucide-react'

const severityIcons: Record<string, React.ReactNode> = {
  critical: <AlertCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  info: <Info className="h-4 w-4 text-info" />,
}

const severityColors: Record<string, string> = {
  critical: 'bg-destructive/10 border-destructive/30 text-destructive',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  info: 'bg-info/10 border-info/30 text-info',
}

const N8N_WORKFLOWS = [
  { name: 'Client Onboarding Pipeline', file: 'client-onboarding.json', trigger: 'Webhook', icon: '🚀', nodes: 11, description: 'Automates account holder creation, KYB verification, IBAN setup, and test payment — 60 seconds from form to live account.' },
  { name: 'Daily Sales Report', file: 'daily-sales-report.json', trigger: 'Cron 08:00', icon: '📊', nodes: 8, description: 'Generates branded HTML report with payment stats, error breakdown, reconciliation summary, and balance overview.' },
  { name: 'Payment Failure Alerting', file: 'failure-alerts.json', trigger: 'Webhook', icon: '🚨', nodes: 9, description: 'Classifies errors by severity, routes critical failures to email, logs all alerts to Supabase for the dashboard.' },
  { name: 'Invoice Auto-Reconciliation', file: 'invoice-reconciliation.json', trigger: 'Webhook', icon: '🔄', nodes: 8, description: 'Matches incoming payments to expected records — exact match, fuzzy match (±5%), or orphan detection.' },
  { name: 'Bulk Payment Processor', file: 'bulk-payment-processor.json', trigger: 'Webhook', icon: '📦', nodes: 10, description: 'Processes payment batches with validation, rate limiting (10/batch), error handling, and completion reporting.' },
  { name: 'Competitive Rate Monitor', file: 'rate-monitor.json', trigger: 'Cron Mon 09:00', icon: '📈', nodes: 4, description: 'Weekly competitive briefing with internal success rates vs competitor landscape analysis.' },
  { name: 'Balance Sweep Automation', file: 'balance-sweep.json', trigger: 'Cron 30min', icon: '💰', nodes: 9, description: 'Monitors account balances against configurable rules — auto-sweeps excess funds, alerts on low balances.' },
]

export default function Automations() {
  const { alerts, acknowledge, unacknowledgedCount } = useAlerts()
  const { rules: retryRules, updateRule } = useRetryRules()
  const { rules: balanceRules, addRule: addBalanceRule, toggleRule: toggleBalanceRule } = useBalanceRules()
  const { logs } = useAutomationLog()
  const [alertFilter, setAlertFilter] = useState('all')
  const [copied, setCopied] = useState(false)
  const [logFilter, setLogFilter] = useState('all')

  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === 'all') return !a.acknowledged
    if (alertFilter === 'acknowledged') return a.acknowledged
    return a.severity === alertFilter && !a.acknowledged
  })

  const filteredLogs = logFilter === 'all' ? logs : logs.filter(l => l.automation_name === logFilter)

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(WEBHOOK_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Automation Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Webhook className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Webhook Receiver</span>
              <div className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <p className="text-lg font-mono font-semibold">
              {alerts.filter(a => a.alert_type === 'webhook_received').length || '0'}
            </p>
            <p className="text-[10px] text-muted-foreground">events received</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <GitCompare className="h-4 w-4 text-success" />
              <span className="text-xs font-medium">Auto-Reconciler</span>
              <div className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <p className="text-lg font-mono font-semibold">
              {logs.filter(l => l.automation_name === 'auto_reconcile' && l.status === 'success').length}
            </p>
            <p className="text-[10px] text-muted-foreground">matched today</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 text-warning" />
              <span className="text-xs font-medium">Failure Handler</span>
              <div className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <p className="text-lg font-mono font-semibold">
              {alerts.filter(a => a.alert_type === 'retry_scheduled').length}
            </p>
            <p className="text-[10px] text-muted-foreground">retries scheduled</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="h-4 w-4 text-info" />
              <span className="text-xs font-medium">Balance Watchdog</span>
              <div className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <p className="text-lg font-mono font-semibold">{balanceRules.filter(r => r.is_active).length}</p>
            <p className="text-[10px] text-muted-foreground">active rules</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Daily Digest</span>
              <div className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <p className="text-lg font-mono font-semibold">
              {logs.filter(l => l.automation_name === 'daily_digest').length}
            </p>
            <p className="text-[10px] text-muted-foreground">digests generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Webhook URL Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <Webhook className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Webhook Receiver URL — register this in your Devengo control panel</p>
            <p className="text-sm font-mono truncate">{WEBHOOK_URL}</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleCopyUrl} className="gap-1.5 shrink-0">
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </CardContent>
      </Card>

      {/* Alerts Feed */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts
              {unacknowledgedCount > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                  {unacknowledgedCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-1">
              {['all', 'critical', 'warning', 'info', 'acknowledged'].map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={alertFilter === f ? 'default' : 'ghost'}
                  className="h-7 text-xs capitalize"
                  onClick={() => setAlertFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            {filteredAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No alerts</p>
            ) : (
              <div className="space-y-2">
                {filteredAlerts.map(alert => (
                  <div
                    key={alert.id as string}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                      alert.acknowledged ? 'bg-secondary/20 border-border opacity-60' : 'bg-secondary/40 border-border',
                    )}
                  >
                    {severityIcons[alert.severity as string] || severityIcons.info}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title as string}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.description as string}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formatRelative(alert.created_at as string)}
                        </span>
                        {(alert.error_code as string) ? <ErrorCodeBadge code={alert.error_code as string} /> : null}
                        <Badge variant="outline" className={cn('text-[10px]', severityColors[alert.severity as string])}>
                          {alert.severity as string}
                        </Badge>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs shrink-0"
                        onClick={() => acknowledge(alert.id as string)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Ack
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Configuration Panels */}
      <Tabs defaultValue="retry" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="n8n">n8n Workflows</TabsTrigger>
          <TabsTrigger value="retry">Retry Rules</TabsTrigger>
          <TabsTrigger value="balance">Balance Rules</TabsTrigger>
          <TabsTrigger value="log">Automation Log</TabsTrigger>
        </TabsList>

        {/* n8n Workflows */}
        <TabsContent value="n8n">
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">n8n Workflow Automations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  7 ready-to-import n8n workflows. Install n8n (<code className="text-[11px] bg-secondary px-1.5 py-0.5 rounded">npx n8n</code>), import the JSON files, configure Devengo API credentials, and they start running.
                </p>
                <div className="space-y-3">
                  {N8N_WORKFLOWS.map(wf => (
                    <div key={wf.file} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-lg">{wf.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{wf.name}</p>
                          <Badge variant="outline" className={cn(
                            'text-[10px]',
                            wf.trigger === 'Webhook' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-info/10 text-info border-info/30',
                          )}>
                            {wf.trigger}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{wf.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          <span className="font-mono">{wf.file}</span> · {wf.nodes} nodes
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => {
                            const a = document.createElement('a')
                            a.href = `/n8n-workflows/${wf.file}`
                            a.download = wf.file
                            a.click()
                          }}
                        >
                          Download JSON
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quick Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">1</span>
                    <span className="text-muted-foreground">Install n8n: <code className="text-[11px] bg-secondary px-1.5 py-0.5 rounded font-mono">npx n8n</code> or use n8n.cloud</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">2</span>
                    <span className="text-muted-foreground">Import workflow JSON files from the download buttons above</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">3</span>
                    <span className="text-muted-foreground">Configure Devengo API credentials (HMAC key + secret) in n8n</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">4</span>
                    <span className="text-muted-foreground">Set webhook URLs in the Devengo control panel</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">5</span>
                    <span className="text-muted-foreground">Workflows start running automatically on their triggers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Retry Rules */}
        <TabsContent value="retry">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs">Error Code</TableHead>
                    <TableHead className="text-xs">Label</TableHead>
                    <TableHead className="text-xs">Retryable</TableHead>
                    <TableHead className="text-xs">Max Retries</TableHead>
                    <TableHead className="text-xs">Backoff</TableHead>
                    <TableHead className="text-xs">Base Delay</TableHead>
                    <TableHead className="text-xs">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retryRules.map(rule => (
                    <TableRow key={rule.id as string} className="border-border">
                      <TableCell><ErrorCodeBadge code={rule.error_code as string} /></TableCell>
                      <TableCell className="text-sm">{getErrorInfo(rule.error_code as string).label}</TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.retryable as boolean}
                          onCheckedChange={(v) => updateRule(rule.id as string, { retryable: v })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={rule.max_retries as number}
                          onChange={(e) => updateRule(rule.id as string, { max_retries: parseInt(e.target.value) || 0 })}
                          className="w-16 h-8 font-mono text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={rule.backoff_strategy as string}
                          onValueChange={(v) => v && updateRule(rule.id as string, { backoff_strategy: v })}
                        >
                          <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exponential">Exponential</SelectItem>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={rule.base_delay_seconds as number}
                            onChange={(e) => updateRule(rule.id as string, { base_delay_seconds: parseInt(e.target.value) || 0 })}
                            className="w-16 h-8 font-mono text-sm"
                          />
                          <span className="text-xs text-muted-foreground">s</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.is_active as boolean}
                          onCheckedChange={(v) => updateRule(rule.id as string, { is_active: v })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Rules */}
        <TabsContent value="balance">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Balance Monitoring Rules</CardTitle>
                <Dialog>
                  <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
                    <Plus className="h-3.5 w-3.5" /> Add Rule
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Add Balance Rule</DialogTitle>
                    </DialogHeader>
                    <BalanceRuleForm onSubmit={addBalanceRule} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {balanceRules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No balance rules configured. Add one to start monitoring account balances.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs">Account</TableHead>
                      <TableHead className="text-xs">Rule Type</TableHead>
                      <TableHead className="text-xs">Threshold</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs">Active</TableHead>
                      <TableHead className="text-xs">Triggers</TableHead>
                      <TableHead className="text-xs">Last Triggered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceRules.map(rule => (
                      <TableRow key={rule.id as string} className="border-border">
                        <TableCell className="text-sm">{(rule.account_label as string) || (rule.account_id as string)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            'text-[10px]',
                            rule.rule_type === 'low_balance' ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info',
                          )}>
                            {rule.rule_type as string}
                          </Badge>
                        </TableCell>
                        <TableCell><AmountDisplay cents={rule.threshold_cents as number} className="text-sm" /></TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{rule.action_type as string}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.is_active as boolean}
                            onCheckedChange={(v) => toggleBalanceRule(rule.id as string, v)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{rule.trigger_count as number}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {rule.last_triggered_at ? formatRelative(rule.last_triggered_at as string) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Log */}
        <TabsContent value="log">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Automation Audit Log</CardTitle>
                <Select value={logFilter} onValueChange={(v) => v && setLogFilter(v)}>
                  <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Automations</SelectItem>
                    <SelectItem value="webhook_receiver">Webhook Receiver</SelectItem>
                    <SelectItem value="auto_reconcile">Auto-Reconcile</SelectItem>
                    <SelectItem value="balance_watchdog">Balance Watchdog</SelectItem>
                    <SelectItem value="daily_digest">Daily Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Automation</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Duration</TableHead>
                    <TableHead className="text-xs">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No automation runs yet. Send a test webhook to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.slice(0, 50).map(log => (
                      <TableRow key={log.id as string} className="border-border">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatDateShort(log.created_at as string)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {(log.automation_name as string).replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status as string} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.duration_ms ? `${log.duration_ms}ms` : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.error_message
                            ? (log.error_message as string)
                            : log.output_data
                              ? JSON.stringify(log.output_data).slice(0, 60)
                              : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BalanceRuleForm({ onSubmit }: { onSubmit: (rule: Record<string, unknown>) => Promise<void> }) {
  const [accountLabel, setAccountLabel] = useState('')
  const [ruleType, setRuleType] = useState('low_balance')
  const [threshold, setThreshold] = useState('')
  const [actionType, setActionType] = useState('alert')

  const handleSubmit = async () => {
    if (!accountLabel || !threshold) return
    await onSubmit({
      account_id: accountLabel.toLowerCase().replace(/\s/g, '_'),
      account_label: accountLabel,
      rule_type: ruleType,
      threshold_cents: Math.round(parseFloat(threshold) * 100),
      action_type: actionType,
      action_config: {},
      is_active: true,
    })
    setAccountLabel('')
    setThreshold('')
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Account Label</label>
        <Input placeholder="Main Operating Account" value={accountLabel} onChange={(e) => setAccountLabel(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Rule Type</label>
        <Select value={ruleType} onValueChange={(v) => v && setRuleType(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low_balance">Low Balance Alert</SelectItem>
            <SelectItem value="high_balance_sweep">High Balance Sweep</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Threshold (EUR)</label>
        <Input type="number" placeholder="5000.00" step="0.01" className="font-mono" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Action</label>
        <Select value={actionType} onValueChange={(v) => v && setActionType(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alert">Alert Only</SelectItem>
            <SelectItem value="auto_payment">Auto-Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={handleSubmit}>Create Rule</Button>
    </div>
  )
}
