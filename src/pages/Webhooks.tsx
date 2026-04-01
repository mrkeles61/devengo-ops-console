import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { mockWebhooks, mockWebhookRequests } from '@/lib/mock-data'
import { WEBHOOK_URL } from '@/lib/supabase'
import { formatDateShort } from '@/lib/format'
import { Plus, Send, Copy, Check, Webhook } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'
import { useDataMode } from '@/contexts/DataModeContext'
import { toast } from 'sonner'

export default function Webhooks() {
  const { isDemo } = useDataMode()
  const [urlCopied, setUrlCopied] = useState(false)

  const totalRequests = mockWebhookRequests.length
  const successRequests = mockWebhookRequests.filter(r => r.http_status === 200).length
  const successRate = Math.round((successRequests / totalRequests) * 100)
  const radialData = [{ name: 'Success', value: successRate, fill: '#22c55e' }]

  const sorted = [...mockWebhookRequests].sort((a, b) => a.response_time_ms - b.response_time_ms)
  const p50 = sorted[Math.floor(totalRequests * 0.5)]?.response_time_ms ?? 0
  const p90 = sorted[Math.floor(totalRequests * 0.9)]?.response_time_ms ?? 0
  const p99 = sorted[Math.floor(totalRequests * 0.99)]?.response_time_ms ?? 0
  const latencyData = [{ name: 'p50', value: p50 }, { name: 'p90', value: p90 }, { name: 'p99', value: p99 }]

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(WEBHOOK_URL)
    setUrlCopied(true)
    toast.success('Webhook URL copied to clipboard')
    setTimeout(() => setUrlCopied(false), 2000)
  }

  const handleTest = () => {
    toast.info('Test event simulated', { description: 'A mock outgoing_payment.confirmed event was injected into the event log.' })
  }

  return (
    <div className="space-y-6">
      {/* Webhook Receiver URL */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Webhook className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Your Webhook Receiver — register this URL in Devengo's control panel</p>
              <p className="text-sm font-mono truncate">{WEBHOOK_URL}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleCopyUrl} className="gap-1.5 shrink-0">
              {urlCopied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {urlCopied ? 'Copied' : 'Copy URL'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registered webhooks */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Registered Webhooks</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleTest}>
                <Send className="h-3.5 w-3.5" /> Test
              </Button>
              <Dialog>
                <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
                  <Plus className="h-3.5 w-3.5" /> Register
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Register Webhook</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Endpoint URL</label>
                      <Input placeholder="https://api.example.com/webhooks" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Events</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['payment.created', 'payment.confirmed', 'payment.failed', 'payment.rejected', 'incoming_payment.created', 'incoming_payment.confirmed'].map(evt => (
                          <label key={evt} className="flex items-center gap-2 text-xs">
                            <input type="checkbox" defaultChecked className="rounded" />
                            {evt}
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => toast.success('Webhook registered (demo)')}>Register Webhook</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs">URL</TableHead>
                <TableHead className="text-xs">Events</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockWebhooks.map(w => (
                <TableRow key={w.id} className="border-border">
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">
                      {w.url}
                      {isDemo && <Badge variant="outline" className="ml-2 text-[9px] text-muted-foreground">demo</Badge>}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {w.subscribed_events.map(e => (<Badge key={e} variant="outline" className="text-[10px] font-mono">{e}</Badge>))}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={w.status} /></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDateShort(w.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delivery health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Delivery Success Rate</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={200} height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={radialData}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#27272a' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-mono font-semibold">{successRate}%</p>
                  <p className="text-xs text-muted-foreground">success</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Response Time (ms)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Delivery log */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Delivery Log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Event</TableHead>
                <TableHead className="text-xs">HTTP Status</TableHead>
                <TableHead className="text-xs">Response Time</TableHead>
                <TableHead className="text-xs">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockWebhookRequests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No webhook events yet — events appear when payments are processed</TableCell></TableRow>
              ) : mockWebhookRequests.slice(0, 20).map(r => (
                <TableRow key={r.id} className="border-border hover:bg-secondary/50 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDateShort(r.created_at)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-mono">{r.event_type}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('font-mono text-xs',
                      r.http_status === 200 ? 'bg-success/10 text-success border-success/30' :
                      r.http_status >= 500 ? 'bg-destructive/10 text-destructive border-destructive/30' :
                      'bg-warning/10 text-warning border-warning/30'
                    )}>{r.http_status}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.response_time_ms}ms</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.payload_size_bytes}B</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
