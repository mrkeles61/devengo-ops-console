import { useState, useEffect } from 'react'
import * as api from '@/lib/devengo'
import { supabase } from '@/lib/supabase'

export function useAccounts() {
  const [accounts, setAccounts] = useState<api.AccountResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!api.isConfigured()) { setLoading(false); return }
    api.listAccounts().then(({ data, error: err }) => {
      if (data?.accounts) setAccounts(data.accounts)
      if (err) setError(err.message)
      setLoading(false)
    })
  }, [])

  return { accounts, loading, error }
}

export function usePayments() {
  const [payments, setPayments] = useState<api.PaymentResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!api.isConfigured()) { setLoading(false); return }
    api.listPayments().then(({ data }) => {
      if (data?.payments) setPayments(data.payments)
      setLoading(false)
    })
  }, [])

  return { payments, loading }
}

export function useLiveEvents() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    // Fetch existing events
    supabase
      .from('devengo_webhook_events')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setEvents(data)
      })

    // Subscribe to new events
    const channel = supabase
      .channel('live-events-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'devengo_webhook_events' }, (payload) => {
        setEvents(prev => [payload.new, ...prev].slice(0, 50))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { events }
}

export function useSendPayment() {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; payment?: api.PaymentResponse; error?: string } | null>(null)

  const send = async (data: {
    account_id: string
    destination_iban: string
    recipient: string
    description: string
    amount_cents: number
  }) => {
    setSending(true)
    setResult(null)
    const { data: res, error } = await api.createPayment({
      account_id: data.account_id,
      destination: { iban: data.destination_iban },
      recipient: data.recipient,
      description: data.description,
      amount: { cents: data.amount_cents, currency: 'EUR' },
    })
    if (error) {
      setResult({ success: false, error: error.message })
    } else if (res?.payment) {
      setResult({ success: true, payment: res.payment })
    }
    setSending(false)
  }

  return { send, sending, result }
}
