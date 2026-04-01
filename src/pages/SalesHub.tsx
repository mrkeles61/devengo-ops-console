import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { MetricCard } from '@/components/shared/MetricCard'
import { useSalesLeads, useTestimonials, useCompetitiveIntel } from '@/hooks/useSupabase'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Users,
  TrendingUp,
  Flame,
  Phone,
  Plus,
  ExternalLink,
  Mail,
  User,
  ChevronDown,
  ChevronUp,
  Eye,
  XCircle,
  Quote,
  Star,
  ShieldAlert,
  Bell,
  Zap,
  CalendarPlus,
  MessageSquarePlus,
} from 'lucide-react'
import type { SalesLead } from '@/lib/types'

const COMPETITOR_COLORS: Record<string, string> = {
  stripe: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  gocardless: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  adyen: 'bg-green-500/15 text-green-400 border-green-500/30',
  mollie: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

const INTEL_TYPE_STYLES: Record<string, string> = {
  product_launch: 'bg-primary/15 text-primary border-primary/30',
  pricing_change: 'bg-warning/15 text-warning border-warning/30',
  funding: 'bg-success/15 text-success border-success/30',
  partnership: 'bg-info/15 text-info border-info/30',
  outage: 'bg-destructive/15 text-destructive border-destructive/30',
  hiring: 'bg-muted text-muted-foreground border-border',
  news: 'bg-muted text-muted-foreground border-border',
}

const INDUSTRIES = ['fintech', 'saas', 'e-commerce', 'marketplace', 'banking', 'insurance', 'logistics', 'hr-tech', 'prop-tech', 'other']
const SOURCES = ['linkedin', 'referral', 'inbound', 'conference', 'cold_outreach', 'partner', 'other']
const STAGES = ['new', 'enriched', 'contacted', 'meeting', 'proposal', 'won', 'lost']

function scoreColor(score: number) {
  if (score >= 70) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-destructive'
}

function scoreBarColor(score: number) {
  if (score >= 70) return 'bg-success'
  if (score >= 40) return 'bg-warning'
  return 'bg-destructive'
}

function getCompetitorStyle(provider: string | undefined) {
  if (!provider) return null
  const key = provider.toLowerCase().replace(/\s+/g, '')
  return COMPETITOR_COLORS[key] || null
}

// ---------- Leads Tab ----------

function LeadsTab() {
  const { leads, loading, updateStage, addLead } = useSalesLeads()
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null)
  const [stageFilter, setStageFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [newLead, setNewLead] = useState({ company_name: '', website: '', industry: '', country: '', source: '' })

  const filtered = leads.filter(l => {
    if (stageFilter !== 'all' && l.stage !== stageFilter) return false
    if (industryFilter !== 'all' && l.industry !== industryFilter) return false
    return true
  })

  const totalLeads = leads.length
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.lead_score, 0) / leads.length) : 0
  const hotLeads = leads.filter(l => l.lead_score >= 80).length
  const contacted = leads.filter(l => l.stage === 'contacted' || l.stage === 'meeting' || l.stage === 'proposal' || l.stage === 'won').length

  const handleAddLead = async () => {
    if (!newLead.company_name) return
    await addLead({ ...newLead, stage: 'new', lead_score: 0 })
    setNewLead({ company_name: '', website: '', industry: '', country: '', source: '' })
    setAddOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Leads" value={totalLeads} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Avg Score" value={avgScore} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Hot Leads" value={hotLeads} icon={<Flame className="h-5 w-5" />} />
        <MetricCard label="Contacted" value={contacted} icon={<Phone className="h-5 w-5" />} />
      </div>

      {/* Filters + Add */}
      <div className="flex items-center gap-3">
        <Select value={stageFilter} onValueChange={(v) => v && setStageFilter(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={industryFilter} onValueChange={(v) => v && setIndustryFilter(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Industry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map(i => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-2" />}>
            <Plus className="h-4 w-4" /> Add Lead
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Company Name *</label>
                <Input value={newLead.company_name} onChange={e => setNewLead(p => ({ ...p, company_name: e.target.value }))} placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Website</label>
                <Input value={newLead.website} onChange={e => setNewLead(p => ({ ...p, website: e.target.value }))} placeholder="https://acme.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Industry</label>
                <Select value={newLead.industry} onValueChange={v => v && setNewLead(p => ({ ...p, industry: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Country</label>
                <Input value={newLead.country} onChange={e => setNewLead(p => ({ ...p, country: e.target.value }))} placeholder="Spain" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Source</label>
                <Select value={newLead.source} onValueChange={v => v && setNewLead(p => ({ ...p, source: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAddLead} disabled={!newLead.company_name}>Create Lead</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leads table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs">Company</TableHead>
                <TableHead className="text-xs">Industry</TableHead>
                <TableHead className="text-xs">Country</TableHead>
                <TableHead className="text-xs">Employees</TableHead>
                <TableHead className="text-xs">Current Provider</TableHead>
                <TableHead className="text-xs">Lead Score</TableHead>
                <TableHead className="text-xs">Stage</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading leads...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No leads found</TableCell></TableRow>
              ) : (
                filtered.map(lead => {
                  const compStyle = getCompetitorStyle(lead.current_payment_provider)
                  return (
                    <TableRow
                      key={lead.id}
                      className="border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell className="font-medium text-sm">{lead.company_name}</TableCell>
                      <TableCell>
                        {lead.industry ? (
                          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs capitalize border bg-secondary/50">{lead.industry}</Badge>
                        ) : <span className="text-muted-foreground">--</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.country || '--'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.employee_count || '--'}</TableCell>
                      <TableCell>
                        {lead.current_payment_provider ? (
                          <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-xs capitalize border', compStyle || 'bg-secondary/50')}>
                            {lead.current_payment_provider}
                          </Badge>
                        ) : <span className="text-muted-foreground">--</span>}
                      </TableCell>
                      <TableCell>
                        <span className={cn('font-mono text-sm font-semibold', scoreColor(lead.lead_score))}>{lead.lead_score}</span>
                      </TableCell>
                      <TableCell><StatusBadge status={lead.stage} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.contact_name || '\u2014'}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead detail sheet */}
      <Sheet open={!!selectedLead} onOpenChange={open => { if (!open) setSelectedLead(null) }}>
        <SheetContent className="w-[440px] bg-card border-border overflow-y-auto">
          {selectedLead && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="text-xl">{selectedLead.company_name}</SheetTitle>
                {selectedLead.website && (
                  <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    {selectedLead.website} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </SheetHeader>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Industry</p>
                  <p className="capitalize">{selectedLead.industry || '--'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Country</p>
                  <p>{selectedLead.country || '--'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Employees</p>
                  <p>{selectedLead.employee_count || '--'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Current Provider</p>
                  {selectedLead.current_payment_provider ? (
                    <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-xs capitalize border', getCompetitorStyle(selectedLead.current_payment_provider) || 'bg-secondary/50')}>
                      {selectedLead.current_payment_provider}
                    </Badge>
                  ) : <p>--</p>}
                </div>
              </div>

              {/* Pain points */}
              {selectedLead.pain_points && selectedLead.pain_points.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Pain Points</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.pain_points.map((pp, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive border border-destructive/20">
                        {pp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Contact</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{selectedLead.contact_name || '--'}</span>
                    {selectedLead.contact_role && <span className="text-muted-foreground">({selectedLead.contact_role})</span>}
                  </div>
                  {selectedLead.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-primary">{selectedLead.contact_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead score bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Lead Score</p>
                  <span className={cn('font-mono text-lg font-semibold', scoreColor(selectedLead.lead_score))}>{selectedLead.lead_score}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', scoreBarColor(selectedLead.lead_score))} style={{ width: `${selectedLead.lead_score}%` }} />
                </div>
              </div>

              {/* Stage + notes */}
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Stage</p>
                <StatusBadge status={selectedLead.stage} />
              </div>

              {selectedLead.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-secondary/50 rounded-lg p-3 border border-border">{selectedLead.notes}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3 pt-2">
                <Button className="w-full gap-2" size="sm" onClick={() => updateStage(selectedLead.id, 'contacted')}>
                  <Phone className="h-4 w-4" /> Mark as Contacted
                </Button>
                <Button variant="outline" className="w-full gap-2" size="sm">
                  <CalendarPlus className="h-4 w-4" /> Schedule Meeting
                </Button>
                <div className="space-y-2">
                  <textarea
                    className="w-full rounded-lg border border-border bg-secondary/30 p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    rows={3}
                    placeholder="Add a note..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                  />
                  <Button variant="outline" className="w-full gap-2" size="sm" disabled={!noteText.trim()}>
                    <MessageSquarePlus className="h-4 w-4" /> Add Note
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ---------- Testimonials Tab ----------

function TestimonialsTab() {
  const { testimonials, loading, toggleApproved, toggleFeatured } = useTestimonials()
  const [filter, setFilter] = useState('all')

  const filtered = testimonials.filter(t => {
    if (filter === 'approved') return t.is_approved
    if (filter === 'unapproved') return !t.is_approved
    return true
  })

  const totalCollected = testimonials.length
  const approved = testimonials.filter(t => t.is_approved).length
  const featured = testimonials.filter(t => t.is_featured).length

  const sourceStyle = (source: string) => {
    switch (source) {
      case 'linkedin': return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
      case 'twitter': return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
      case 'case_study': return 'bg-primary/15 text-primary border-primary/30'
      case 'g2': return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const categoryStyle = (cat: string | undefined) => {
    switch (cat) {
      case 'speed': return 'bg-success/15 text-success border-success/30'
      case 'reliability': return 'bg-info/15 text-info border-info/30'
      case 'support': return 'bg-warning/15 text-warning border-warning/30'
      case 'cost': return 'bg-primary/15 text-primary border-primary/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Collected" value={totalCollected} icon={<Quote className="h-5 w-5" />} />
        <MetricCard label="Approved" value={approved} icon={<Star className="h-5 w-5" />} />
        <MetricCard label="Featured" value={featured} icon={<Zap className="h-5 w-5" />} />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Testimonials</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="unapproved">Unapproved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards grid */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading testimonials...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No testimonials found</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(t => (
            <Card key={t.id} className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                {/* Quote */}
                <div className="relative">
                  <span className="absolute -top-2 -left-1 text-4xl text-primary/20 font-serif select-none">&ldquo;</span>
                  <p className="italic text-sm leading-relaxed pl-6 pt-2">{t.quote}</p>
                </div>

                {/* Author */}
                <div>
                  <p className="font-semibold text-sm">{t.client_name}</p>
                  {(t.author_name || t.author_role) && (
                    <p className="text-xs text-muted-foreground">
                      {t.author_name}{t.author_role && ` \u00b7 ${t.author_role}`}
                    </p>
                  )}
                </div>

                {/* Tags row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-xs capitalize border', sourceStyle(t.source))}>{t.source.replace('_', ' ')}</Badge>
                  {t.category && (
                    <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-xs capitalize border', categoryStyle(t.category))}>{t.category}</Badge>
                  )}
                </div>

                {/* Sentiment bar */}
                {t.sentiment_score !== undefined && t.sentiment_score !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden w-24">
                      <div
                        className={cn('h-full rounded-full', t.sentiment_score >= 0.7 ? 'bg-success' : t.sentiment_score >= 0.4 ? 'bg-warning' : 'bg-destructive')}
                        style={{ width: `${(t.sentiment_score * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Toggles */}
                <div className="flex items-center gap-6 pt-2 border-t border-border">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={t.is_approved} onCheckedChange={v => toggleApproved(t.id, v)} />
                    Approve
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={t.is_featured} onCheckedChange={v => toggleFeatured(t.id, v)} />
                    Feature
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Competitive Intel Tab ----------

function CompetitiveIntelTab() {
  const { intel, loading, updateStatus } = useCompetitiveIntel()
  const [competitorFilter, setCompetitorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set())
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())

  const competitors = Array.from(new Set(intel.map(i => i.competitor))).sort()

  const filtered = intel.filter(i => {
    if (competitorFilter !== 'all' && i.competitor !== competitorFilter) return false
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    return true
  })

  const totalAlerts = intel.length
  const newAlerts = intel.filter(i => i.status === 'new').length
  const highRelevance = intel.filter(i => i.relevance_score >= 4).length

  const toggleSummary = (id: string) => {
    setExpandedSummaries(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAction = (id: string) => {
    setExpandedActions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Alerts" value={totalAlerts} icon={<ShieldAlert className="h-5 w-5" />} />
        <MetricCard label="New (Unreviewed)" value={newAlerts} icon={<Bell className="h-5 w-5" />} />
        <MetricCard label="High Relevance" value={highRelevance} icon={<Zap className="h-5 w-5" />} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={competitorFilter} onValueChange={(v) => v && setCompetitorFilter(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Competitor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Competitors</SelectItem>
            {competitors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="actioned">Actioned</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Intel feed */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading intel...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No intel found</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => {
            const isSummaryExpanded = expandedSummaries.has(item.id)
            const isActionExpanded = expandedActions.has(item.id)
            const typeStyle = INTEL_TYPE_STYLES[item.intel_type] || 'bg-muted text-muted-foreground border-border'

            return (
              <Card key={item.id} className="bg-card border-border">
                <CardContent className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{item.competitor}</span>
                      <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-xs capitalize border', typeStyle)}>
                        {item.intel_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelative(item.created_at)}</span>
                  </div>

                  {/* Title */}
                  <p className="font-medium text-sm">{item.title}</p>

                  {/* Summary (expandable) */}
                  <div>
                    <p className={cn('text-sm text-muted-foreground', !isSummaryExpanded && 'line-clamp-2')}>
                      {item.summary}
                    </p>
                    {item.summary.length > 150 && (
                      <button onClick={() => toggleSummary(item.id)} className="text-xs text-primary hover:underline mt-1">
                        {isSummaryExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>

                  {/* Relevance dots */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Relevance</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-2 w-2 rounded-full',
                            i < item.relevance_score ? 'bg-primary' : 'bg-secondary',
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action suggested (collapsible) */}
                  {item.action_suggested && (
                    <div>
                      <button
                        onClick={() => toggleAction(item.id)}
                        className="flex items-center gap-1.5 text-xs text-warning hover:underline"
                      >
                        {isActionExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        Suggested Action
                      </button>
                      {isActionExpanded && (
                        <div className="mt-2 bg-warning/5 border border-warning/20 rounded-lg p-3 text-sm">
                          {item.action_suggested}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status + actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <StatusBadge status={item.status} />
                    <div className="flex items-center gap-2">
                      {item.status === 'new' && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => updateStatus(item.id, 'reviewed')}>
                          <Eye className="h-3 w-3" /> Mark Reviewed
                        </Button>
                      )}
                      {item.status !== 'dismissed' && (
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-destructive" onClick={() => updateStatus(item.id, 'dismissed')}>
                          <XCircle className="h-3 w-3" /> Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------- Main Page ----------

export default function SalesHub() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="intel">Competitive Intel</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <LeadsTab />
        </TabsContent>

        <TabsContent value="testimonials">
          <TestimonialsTab />
        </TabsContent>

        <TabsContent value="intel">
          <CompetitiveIntelTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
