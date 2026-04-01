import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { MetricCard } from '@/components/shared/MetricCard'
import { useBlogDrafts, useContentCalendar } from '@/hooks/useSupabase'
import type { ContentCalendarItem } from '@/lib/types'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import Markdown from 'react-markdown'
import {
  FileText, MessageSquare, Hash, Mail, BookOpen,
  ChevronDown, ChevronUp, CheckCircle, XCircle,
  Plus, Calendar, Eye,
} from 'lucide-react'
import { format } from 'date-fns'

const categoryColors: Record<string, string> = {
  product_update: 'bg-primary/15 text-primary border-primary/30',
  industry_news: 'bg-info/15 text-info border-info/30',
  tutorial: 'bg-success/15 text-success border-success/30',
  case_study: 'bg-warning/15 text-warning border-warning/30',
  thought_leadership: 'bg-muted text-muted-foreground border-border',
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  blog_post: <FileText className="h-4 w-4" />,
  linkedin_post: <MessageSquare className="h-4 w-4" />,
  twitter_thread: <Hash className="h-4 w-4" />,
  newsletter: <Mail className="h-4 w-4" />,
  case_study: <BookOpen className="h-4 w-4" />,
}

const statusBorderColors: Record<string, string> = {
  planned: 'border-l-muted',
  in_progress: 'border-l-primary',
  review: 'border-l-warning',
  scheduled: 'border-l-success',
  published: 'border-l-success',
}

export default function ContentHub() {
  const { drafts, loading: draftsLoading, updateStatus } = useBlogDrafts()
  const { items: calendarItems, loading: calendarLoading, addItem } = useContentCalendar()
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedDrafts, setExpandedDrafts] = useState<Set<string>>(new Set())

  // New content form state
  const [newContentType, setNewContentType] = useState('blog_post')
  const [newTitle, setNewTitle] = useState('')
  const [newTargetDate, setNewTargetDate] = useState('')
  const [newChannel, setNewChannel] = useState('blog')
  const [newDescription, setNewDescription] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredDrafts = statusFilter === 'all'
    ? drafts
    : drafts.filter(d => d.status === statusFilter)

  const totalDrafts = drafts.length
  const pendingReview = drafts.filter(d => d.status === 'draft').length
  const approvedCount = drafts.filter(d => d.status === 'approved').length

  const toggleExpand = (id: string) => {
    setExpandedDrafts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Group calendar items by month
  const groupedCalendar = calendarItems.reduce<Record<string, ContentCalendarItem[]>>((acc, item) => {
    const monthKey = format(new Date(item.target_date), 'MMMM yyyy')
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey].push(item)
    return acc
  }, {})

  const handleAddContent = async () => {
    if (!newTitle || !newTargetDate) return
    await addItem({
      content_type: newContentType,
      title: newTitle,
      target_date: newTargetDate,
      channel: newChannel,
      description: newDescription || undefined,
      status: 'planned',
    })
    setNewTitle('')
    setNewTargetDate('')
    setNewDescription('')
    setNewContentType('blog_post')
    setNewChannel('blog')
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="drafts" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="drafts">Blog Drafts</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
        </TabsList>

        {/* Blog Drafts Tab */}
        <TabsContent value="drafts">
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                label="Total Drafts"
                value={totalDrafts}
                icon={<FileText className="h-5 w-5" />}
              />
              <MetricCard
                label="Pending Review"
                value={pendingReview}
                icon={<Eye className="h-5 w-5" />}
              />
              <MetricCard
                label="Approved"
                value={approvedCount}
                icon={<CheckCircle className="h-5 w-5" />}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Filter:</span>
              <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                <SelectTrigger className="w-40 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Drafts List */}
            {draftsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-12">Loading drafts...</p>
            ) : filteredDrafts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No drafts found.</p>
            ) : (
              <div className="space-y-4">
                {filteredDrafts.map(draft => {
                  const isExpanded = expandedDrafts.has(draft.id)
                  return (
                    <Card key={draft.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold">{draft.title}</h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs capitalize shrink-0',
                              categoryColors[draft.category] ?? 'bg-muted text-muted-foreground border-border',
                            )}
                          >
                            {draft.category.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        {/* Second Row */}
                        <div className="flex items-center gap-3 mt-2">
                          {draft.target_audience && (
                            <Badge variant="outline" className="text-xs">
                              {draft.target_audience}
                            </Badge>
                          )}
                          {draft.word_count != null && (
                            <span className="text-xs text-muted-foreground">
                              {draft.word_count.toLocaleString()} words
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatRelative(draft.created_at)}
                          </span>
                        </div>

                        {/* Tags */}
                        {draft.tags && draft.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {draft.tags.map(tag => (
                              <span
                                key={tag}
                                className="bg-secondary text-xs px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Preview */}
                        {draft.draft_body && !isExpanded && (
                          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                            {draft.draft_body.slice(0, 200)}
                            {draft.draft_body.length > 200 ? '...' : ''}
                          </p>
                        )}

                        {/* Source */}
                        {draft.source_title && (
                          <p className="text-xs text-muted-foreground italic mt-2">
                            Source: {draft.source_title}
                          </p>
                        )}

                        {/* Expand Button */}
                        {draft.draft_body && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-3 gap-1.5 text-xs"
                            onClick={() => toggleExpand(draft.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Collapse
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Read Full Draft
                              </>
                            )}
                          </Button>
                        )}

                        {/* Expanded Content */}
                        {isExpanded && draft.draft_body && (
                          <div className="border-t border-border pt-4 mt-4">
                            <div className="prose prose-sm prose-invert max-w-none">
                              <Markdown>{draft.draft_body}</Markdown>
                            </div>
                          </div>
                        )}

                        {/* Review Notes */}
                        {draft.review_notes && (
                          <div className="mt-4 p-3 rounded-lg bg-info/5 border border-info/20">
                            <p className="text-xs font-medium text-info mb-1">Review Notes</p>
                            <p className="text-sm text-muted-foreground">{draft.review_notes}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                          {draft.status !== 'approved' && draft.status !== 'published' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs bg-success/10 text-success border-success/30 hover:bg-success/20"
                              onClick={() => updateStatus(draft.id, 'approved')}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                          )}
                          {draft.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                              onClick={() => updateStatus(draft.id, 'rejected')}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          )}
                          <div className="ml-auto">
                            <StatusBadge status={draft.status} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Content Calendar Tab */}
        <TabsContent value="calendar">
          <div className="space-y-6">
            {/* Add Content Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                {calendarItems.length} content items planned
              </h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
                  <Plus className="h-3.5 w-3.5" /> Add Content
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Add Content Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Content Type</label>
                      <Select value={newContentType} onValueChange={(v) => v && setNewContentType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blog_post">Blog Post</SelectItem>
                          <SelectItem value="linkedin_post">LinkedIn Post</SelectItem>
                          <SelectItem value="twitter_thread">Twitter Thread</SelectItem>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="case_study">Case Study</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Title</label>
                      <Input
                        placeholder="Content title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Target Date</label>
                      <Input
                        type="date"
                        value={newTargetDate}
                        onChange={(e) => setNewTargetDate(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Channel</label>
                      <Select value={newChannel} onValueChange={(v) => v && setNewChannel(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blog">Blog</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Description (optional)</label>
                      <textarea
                        className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-none"
                        placeholder="Brief description..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleAddContent}>
                      Add to Calendar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Calendar Timeline */}
            {calendarLoading ? (
              <p className="text-sm text-muted-foreground text-center py-12">Loading calendar...</p>
            ) : Object.keys(groupedCalendar).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No content items scheduled. Add one to get started.
              </p>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedCalendar).map(([month, items]) => (
                  <div key={month}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {month}
                    </h3>
                    <div className="space-y-2">
                      {items.map(item => {
                        const date = new Date(item.target_date)
                        return (
                          <Card
                            key={item.id}
                            className={cn(
                              'bg-card border-border border-l-4',
                              statusBorderColors[item.status] ?? 'border-l-muted',
                            )}
                          >
                            <CardContent className="p-4 flex items-center gap-4">
                              {/* Date */}
                              <div className="text-center shrink-0 w-12">
                                <p className="text-2xl font-semibold font-mono leading-none">
                                  {format(date, 'd')}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase mt-0.5">
                                  {format(date, 'MMM')}
                                </p>
                              </div>

                              {/* Content Type Icon */}
                              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-muted-foreground">
                                {contentTypeIcons[item.content_type] ?? <FileText className="h-4 w-4" />}
                              </div>

                              {/* Title & Details */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.title}</p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              {/* Status & Channel */}
                              <div className="flex items-center gap-2 shrink-0">
                                <StatusBadge status={item.status} />
                                {item.channel && (
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {item.channel}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
