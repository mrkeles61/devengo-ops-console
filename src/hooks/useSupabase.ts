import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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
