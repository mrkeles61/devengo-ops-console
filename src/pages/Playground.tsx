import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Play, Zap, ArrowRight, Send, Eye, Lock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_ENDPOINTS = [
  { method: 'GET', path: '/v1/accounts', label: 'List Accounts' },
  { method: 'GET', path: '/v1/payments', label: 'List Payments' },
  { method: 'POST', path: '/v1/payments', label: 'Create Payment' },
  { method: 'POST', path: '/v1/payments/preview', label: 'Preview Payment' },
  { method: 'GET', path: '/v1/webhooks', label: 'List Webhooks' },
  { method: 'GET', path: '/v1/incoming_payments', label: 'List Incoming Payments' },
]

const EXAMPLE_RULES = [
  {
    name: 'Auto-sweep',
    trigger: 'When main account exceeds €50,000',
    action: 'Distribute €25,000 to savings IBAN',
    schedule: 'Check every 5 minutes',
    icon: '💰',
    active: true,
  },
  {
    name: 'Low balance alert',
    trigger: 'When operating account drops below €5,000',
    action: 'Send notification to ops team',
    schedule: 'Check every 1 hour',
    icon: '⚠️',
    active: true,
  },
  {
    name: 'Scheduled disbursement',
    trigger: 'Every day at 9:00 CET',
    action: 'Pay pending invoices from queue',
    schedule: 'Daily at 09:00',
    icon: '📅',
    active: false,
  },
]

const FLOW_NODES = [
  { id: 'payer', label: 'Payer', description: 'Initiates payment via Devengo API', x: 0 },
  { id: 'devengo', label: 'Devengo API', description: 'Validates, signs, and routes the payment', x: 1 },
  { id: 'iberpay', label: 'Iberpay (CSM)', description: 'Spanish Clearing & Settlement Mechanism', x: 2 },
  { id: 'bank', label: 'Beneficiary Bank', description: 'Receives and credits the payment', x: 3 },
  { id: 'beneficiary', label: 'Beneficiary', description: 'Funds available in account', x: 4 },
]

export default function Playground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0])
  const [response, setResponse] = useState<string>('')
  const [activeNode, setActiveNode] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSendRequest = () => {
    const mockResponse = {
      status: 200,
      data: selectedEndpoint.method === 'GET'
        ? { items: [], total: 0, page: 1 }
        : { id: 'pay_' + crypto.randomUUID().slice(0, 8), status: 'created' },
      headers: { 'X-Request-Id': crypto.randomUUID().slice(0, 8) },
    }
    setResponse(JSON.stringify(mockResponse, null, 2))
  }

  const animateFlow = () => {
    setIsAnimating(true)
    setActiveNode(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step >= FLOW_NODES.length) {
        clearInterval(interval)
        setTimeout(() => {
          setIsAnimating(false)
          setActiveNode(null)
        }, 1000)
      } else {
        setActiveNode(step)
      }
    }, 800)
  }

  // Generate a mock HMAC signature display
  const hmacDisplay = `HMAC-SHA256(
  key: "sk_sandbox_•••••••••",
  data: "${selectedEndpoint.method} ${selectedEndpoint.path}\\n" +
        "host: api.sandbox.devengo.com\\n" +
        "date: ${new Date().toUTCString()}\\n" +
        "content-type: application/json"
)
→ signature: "dG9rZW5fc2FuZGJveF8...${btoa(Date.now().toString()).slice(0, 16)}"`

  return (
    <div className="space-y-6">
      <Tabs defaultValue="explorer" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="explorer">API Explorer</TabsTrigger>
          <TabsTrigger value="rules">Payment Rules</TabsTrigger>
          <TabsTrigger value="flow">Payment Flow</TabsTrigger>
        </TabsList>

        {/* API Explorer */}
        <TabsContent value="explorer" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select
                    value={selectedEndpoint.path}
                    onValueChange={(v) => setSelectedEndpoint(API_ENDPOINTS.find(e => e.path === v)!)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {API_ENDPOINTS.map(e => (
                        <SelectItem key={e.path} value={e.path}>
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className={cn(
                              'text-[10px] font-mono',
                              e.method === 'GET' ? 'text-success border-success/30' : 'text-primary border-primary/30',
                            )}>
                              {e.method}
                            </Badge>
                            <span className="font-mono text-xs">{e.path}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSendRequest} className="gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Send
                  </Button>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> HMAC-SHA256 Signature
                  </p>
                  <pre className="text-[11px] font-mono bg-secondary/50 p-3 rounded-lg overflow-x-auto text-muted-foreground leading-relaxed">
                    {hmacDisplay}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Response</CardTitle>
              </CardHeader>
              <CardContent>
                {response ? (
                  <pre className="text-xs font-mono bg-secondary/50 p-3 rounded-lg overflow-x-auto max-h-[300px] text-success">
                    {response}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    Send a request to see the response
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Rules */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {EXAMPLE_RULES.map(rule => (
              <Card key={rule.name} className={cn('bg-card border-border', rule.active && 'border-primary/30')}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{rule.icon}</span>
                    <Badge variant="outline" className={rule.active ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground'}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{rule.name}</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Eye className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{rule.trigger}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{rule.action}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Play className="h-3.5 w-3.5 text-info mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{rule.schedule}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">Simulate</Button>
                    <Button size="sm" className="flex-1 text-xs" disabled={!rule.active}>Execute</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Create Custom Rule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">When</label>
                  <Select defaultValue="exceeds">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exceeds">Balance exceeds</SelectItem>
                      <SelectItem value="drops">Balance drops below</SelectItem>
                      <SelectItem value="payment">Payment received</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="€50,000" className="font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Then</label>
                  <Select defaultValue="send">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send">Send payment</SelectItem>
                      <SelectItem value="alert">Send alert</SelectItem>
                      <SelectItem value="log">Log event</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="ES00 0000 0000 0000 0000 0000" className="font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Check every</label>
                  <Select defaultValue="5m">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5m">5 minutes</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full mt-2">Create Rule</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Flow */}
        <TabsContent value="flow" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">SEPA Instant Payment Flow</CardTitle>
                <Button size="sm" onClick={animateFlow} disabled={isAnimating} className="gap-1.5">
                  <Play className="h-3.5 w-3.5" /> Animate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-8 px-4">
                {FLOW_NODES.map((node, i) => (
                  <div key={node.id} className="flex items-center">
                    <div
                      className={cn(
                        'flex flex-col items-center gap-2 cursor-pointer transition-all duration-300',
                        activeNode !== null && activeNode >= i ? 'scale-110' : '',
                      )}
                      onClick={() => setActiveNode(activeNode === i ? null : i)}
                    >
                      <div className={cn(
                        'h-14 w-14 rounded-xl flex items-center justify-center border-2 transition-all duration-300',
                        activeNode !== null && activeNode >= i
                          ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20'
                          : activeNode !== null && activeNode === i - 1
                            ? 'bg-warning/20 border-warning text-warning'
                            : 'bg-secondary border-border text-muted-foreground',
                      )}>
                        {activeNode !== null && activeNode > i ? (
                          <CheckCircle className="h-6 w-6 text-success" />
                        ) : (
                          <span className="text-lg font-semibold">{i + 1}</span>
                        )}
                      </div>
                      <div className="text-center max-w-[100px]">
                        <p className="text-xs font-medium">{node.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{node.description}</p>
                      </div>
                    </div>
                    {i < FLOW_NODES.length - 1 && (
                      <ArrowRight className={cn(
                        'h-5 w-5 mx-3 transition-colors duration-300',
                        activeNode !== null && activeNode > i ? 'text-success' : 'text-border',
                      )} />
                    )}
                  </div>
                ))}
              </div>

              {activeNode !== null && (
                <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-sm font-medium">{FLOW_NODES[activeNode].label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{FLOW_NODES[activeNode].description}</p>
                  {activeNode === 2 && (
                    <p className="text-xs text-warning mt-2">
                      Error codes AB10, MS03 typically originate here — connectivity issues between banks.
                    </p>
                  )}
                  {activeNode === 3 && (
                    <p className="text-xs text-warning mt-2">
                      Error codes AC04, AC06 come from the beneficiary bank — closed or blocked accounts.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
