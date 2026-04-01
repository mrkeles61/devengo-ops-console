import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { BlogDraft, Testimonial, CompetitiveIntel, SalesLead, ContentCalendarItem } from '@/lib/types'

export function useAlerts() {
  const [alerts, setAlerts] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(async () => {
    const { data } = await supabase
      .from('devengo_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setAlerts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAlerts()
    const channel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'devengo_alerts' }, (payload) => {
        setAlerts(prev => [payload.new as Record<string, unknown>, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAlerts])

  const acknowledge = async (id: string) => {
    await supabase.from('devengo_alerts').update({ acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
  }

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length

  return { alerts, loading, acknowledge, unacknowledgedCount, refetch: fetchAlerts }
}

export function useRetryRules() {
  const [rules, setRules] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('devengo_retry_rules').select('*').order('error_code').then(({ data }) => {
      setRules(data || [])
      setLoading(false)
    })
  }, [])

  const updateRule = async (id: string, updates: Record<string, unknown>) => {
    await supabase.from('devengo_retry_rules').update(updates).eq('id', id)
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  return { rules, loading, updateRule }
}

export function useBalanceRules() {
  const [rules, setRules] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRules = useCallback(async () => {
    const { data } = await supabase.from('devengo_balance_rules').select('*').order('created_at', { ascending: false })
    setRules(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRules() }, [fetchRules])

  const addRule = async (rule: Record<string, unknown>) => {
    const { data } = await supabase.from('devengo_balance_rules').insert(rule).select().single()
    if (data) setRules(prev => [data, ...prev])
  }

  const toggleRule = async (id: string, isActive: boolean) => {
    await supabase.from('devengo_balance_rules').update({ is_active: isActive }).eq('id', id)
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: isActive } : r))
  }

  return { rules, loading, addRule, toggleRule, refetch: fetchRules }
}

export function useAutomationLog() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('devengo_automation_log').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => {
      setLogs(data || [])
      setLoading(false)
    })
    const channel = supabase
      .channel('log-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'devengo_automation_log' }, (payload) => {
        setLogs(prev => [payload.new as Record<string, unknown>, ...prev].slice(0, 100))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return { logs, loading }
}

export function useWebhookEvents() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    supabase.from('devengo_webhook_events').select('*').order('received_at', { ascending: false }).limit(50).then(({ data }) => {
      setEvents(data || [])
    })
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'devengo_webhook_events' }, (payload) => {
        setEvents(prev => [payload.new as Record<string, unknown>, ...prev].slice(0, 50))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return { events }
}

export function useReconciliation() {
  const [records, setRecords] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    const { data } = await supabase.from('devengo_reconciliation').select('*').order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRecords()
    const channel = supabase
      .channel('recon-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devengo_reconciliation' }, () => {
        fetchRecords()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchRecords])

  const addExpected = async (record: Record<string, unknown>) => {
    const { data } = await supabase.from('devengo_reconciliation').insert({ ...record, status: 'pending' }).select().single()
    if (data) setRecords(prev => [data, ...prev])
  }

  return { records, loading, addExpected, refetch: fetchRecords }
}

// Sales & Marketing Hub hooks

export function useBlogDrafts() {
  const [drafts, setDrafts] = useState<BlogDraft[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDrafts = useCallback(async () => {
    const { data } = await supabase
      .from('devengo_blog_drafts')
      .select('*')
      .order('created_at', { ascending: false })
    setDrafts((data as BlogDraft[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDrafts()
    const channel = supabase
      .channel('blog-drafts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devengo_blog_drafts' }, () => {
        fetchDrafts()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchDrafts])

  const updateStatus = async (id: string, status: string, reviewNotes?: string) => {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (reviewNotes !== undefined) updates.review_notes = reviewNotes
    await supabase.from('devengo_blog_drafts').update(updates).eq('id', id)
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...updates } as BlogDraft : d))
  }

  return { drafts, loading, updateStatus, refetch: fetchDrafts }
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTestimonials = useCallback(async () => {
    const { data } = await supabase
      .from('devengo_testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    setTestimonials((data as Testimonial[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTestimonials()
    const channel = supabase
      .channel('testimonials-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devengo_testimonials' }, () => {
        fetchTestimonials()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchTestimonials])

  const toggleApproved = async (id: string, isApproved: boolean) => {
    await supabase.from('devengo_testimonials').update({ is_approved: isApproved }).eq('id', id)
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, is_approved: isApproved } : t))
  }

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    await supabase.from('devengo_testimonials').update({ is_featured: isFeatured }).eq('id', id)
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, is_featured: isFeatured } : t))
  }

  return { testimonials, loading, toggleApproved, toggleFeatured, refetch: fetchTestimonials }
}

export function useCompetitiveIntel() {
  const [intel, setIntel] = useState<CompetitiveIntel[]>([])
  const [loading, setLoading] = useState(true)

  const fetchIntel = useCallback(async () => {
    const { data } = await supabase
      .from('devengo_competitive_intel')
      .select('*')
      .order('created_at', { ascending: false })
    setIntel((data as CompetitiveIntel[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchIntel()
    const channel = supabase
      .channel('intel-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devengo_competitive_intel' }, () => {
        fetchIntel()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchIntel])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('devengo_competitive_intel').update({ status }).eq('id', id)
    setIntel(prev => prev.map(i => i.id === id ? { ...i, status } as CompetitiveIntel : i))
  }

  return { intel, loading, updateStatus, refetch: fetchIntel }
}

export function useSalesLeads() {
  const [leads, setLeads] = useState<SalesLead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('devengo_sales_leads')
      .select('*')
      .order('lead_score', { ascending: false })
    setLeads((data as SalesLead[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devengo_sales_leads' }, () => {
        fetchLeads()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLeads])

  const updateStage = async (id: string, stage: string) => {
    await supabase.from('devengo_sales_leads').update({ stage }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
  }

  const addLead = async (lead: Partial<SalesLead>) => {
    const { data } = await supabase.from('devengo_sales_leads').insert(lead).select().single()
    if (data) setLeads(prev => [data as SalesLead, ...prev])
  }

  return { leads, loading, updateStage, addLead, refetch: fetchLeads }
}

export function useContentCalendar() {
  const [items, setItems] = useState<ContentCalendarItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('devengo_content_calendar')
      .select('*')
      .order('target_date', { ascending: true })
    setItems((data as ContentCalendarItem[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
    const channel = supabase
      .channel('calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devengo_content_calendar' }, () => {
        fetchItems()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchItems])

  const addItem = async (item: Partial<ContentCalendarItem>) => {
    const { data } = await supabase.from('devengo_content_calendar').insert(item).select().single()
    if (data) setItems(prev => [...prev, data as ContentCalendarItem].sort((a, b) => a.target_date.localeCompare(b.target_date)))
  }

  return { items, loading, addItem, refetch: fetchItems }
}
