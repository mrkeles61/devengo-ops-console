import type { Payment, Account, Webhook, WebhookEvent, WebhookRequest, ReconciliationRecord, RetryRecord, IncomingPayment, RetryRule } from './types'

function randomId(): string {
  return crypto.randomUUID()
}

function randomIBAN(country = 'ES'): string {
  const digits = Array.from({ length: 22 }, () => Math.floor(Math.random() * 10)).join('')
  return `${country}${digits}`
}

function randomAmount(min = 1000, max = 5000000): number {
  const mu = Math.log(50000)
  const sigma = 1.5
  const value = Math.exp(mu + sigma * (Math.random() + Math.random() + Math.random() - 1.5))
  return Math.max(min, Math.min(max, Math.round(value)))
}

function randomDate(daysAgo: number): string {
  const now = Date.now()
  const ms = now - Math.random() * daysAgo * 86400000
  return new Date(ms).toISOString()
}

function weightedRandom<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [item, weight] of items) {
    r -= weight
    if (r <= 0) return item
  }
  return items[0][0]
}

const ERROR_CODES: [string, number][] = [
  ['AC04', 40], ['AB10', 25], ['MS03', 15], ['AG01', 10],
  ['AC06', 5], ['AM05', 3], ['FOCR', 2],
]

const CONCEPTS = [
  'Invoice payment', 'Salary transfer', 'Supplier payment', 'Service fee',
  'Rent payment', 'Insurance claim', 'Refund', 'Commission payout',
  'Subscription renewal', 'Vendor settlement', 'Tax payment', 'Dividend payout',
]

// Accounts
export const mockAccounts: Account[] = [
  { id: 'acc_001', iban: 'ES9121000418450200051332', account_holder_id: 'ah_001', status: 'active', balance_cents: 15000000, currency: 'EUR', created_at: '2025-06-15T10:00:00Z' },
  { id: 'acc_002', iban: 'ES7620770024003102575766', account_holder_id: 'ah_001', status: 'active', balance_cents: 4500000, currency: 'EUR', created_at: '2025-07-20T14:30:00Z' },
  { id: 'acc_003', iban: 'ES1000492352082414205416', account_holder_id: 'ah_002', status: 'active', balance_cents: 890000, currency: 'EUR', created_at: '2025-09-01T09:00:00Z' },
  { id: 'acc_004', iban: 'ES8023100001180000012345', account_holder_id: 'ah_002', status: 'inactive', balance_cents: 0, currency: 'EUR', created_at: '2025-03-10T16:00:00Z' },
]

// Generate 30 days of payments
function generatePayments(count: number): Payment[] {
  const payments: Payment[] = []
  for (let i = 0; i < count; i++) {
    const status = weightedRandom<Payment['status']>([
      ['confirmed', 85], ['processing', 5], ['failed', 8], ['rejected', 2],
    ])
    const createdAt = randomDate(30)
    const errorCode = (status === 'failed' || status === 'rejected')
      ? weightedRandom(ERROR_CODES)
      : undefined
    const deliveryTime = status === 'confirmed'
      ? Math.floor(Math.random() * 180) + 5
      : undefined

    payments.push({
      id: `pay_${randomId().slice(0, 12)}`,
      source_account_id: mockAccounts[Math.floor(Math.random() * 3)].id,
      source_iban: mockAccounts[Math.floor(Math.random() * 3)].iban,
      destination_iban: randomIBAN(),
      amount_cents: randomAmount(),
      currency: 'EUR',
      concept: CONCEPTS[Math.floor(Math.random() * CONCEPTS.length)],
      status,
      error_code: errorCode,
      created_at: createdAt,
      confirmed_at: status === 'confirmed'
        ? new Date(new Date(createdAt).getTime() + (deliveryTime! * 1000)).toISOString()
        : undefined,
      failed_at: status === 'failed'
        ? new Date(new Date(createdAt).getTime() + 30000).toISOString()
        : undefined,
      delivery_time_seconds: deliveryTime,
    })
  }
  return payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export const mockPayments: Payment[] = generatePayments(200)

// Incoming payments
export const mockIncomingPayments: IncomingPayment[] = Array.from({ length: 30 }, () => ({
  id: `inc_${randomId().slice(0, 12)}`,
  account_id: mockAccounts[Math.floor(Math.random() * 3)].id,
  source_iban: randomIBAN('DE'),
  amount_cents: randomAmount(5000, 2000000),
  currency: 'EUR',
  concept: CONCEPTS[Math.floor(Math.random() * CONCEPTS.length)],
  status: 'confirmed' as const,
  created_at: randomDate(15),
  confirmed_at: randomDate(14),
})).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

// Webhooks
export const mockWebhooks: Webhook[] = [
  { id: 'wh_001', url: 'https://api.barkibu.com/webhooks/devengo', subscribed_events: ['payment.confirmed', 'payment.failed', 'incoming_payment.confirmed'], status: 'active', created_at: '2025-08-01T10:00:00Z' },
  { id: 'wh_002', url: 'https://hooks.reveni.io/devengo', subscribed_events: ['payment.created', 'payment.confirmed', 'payment.failed', 'payment.rejected'], status: 'active', created_at: '2025-09-15T14:00:00Z' },
  { id: 'wh_003', url: 'https://payflow.internal/webhooks', subscribed_events: ['payment.confirmed', 'incoming_payment.created', 'incoming_payment.confirmed'], status: 'active', created_at: '2025-10-01T09:00:00Z' },
]

// Webhook events
const EVENT_TYPES = [
  'payment.created', 'payment.confirmed', 'payment.failed',
  'incoming_payment.created', 'incoming_payment.confirmed',
  'account.activated',
]

export const mockWebhookEvents: WebhookEvent[] = Array.from({ length: 100 }, (_, i) => {
  const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)]
  const payment = mockPayments[Math.floor(Math.random() * mockPayments.length)]
  return {
    id: `evt_${randomId().slice(0, 12)}`,
    event_type: eventType,
    payload: { payment_id: payment.id, amount: payment.amount_cents, status: payment.status },
    payment_id: payment.id,
    amount_cents: payment.amount_cents,
    status: payment.status,
    error_code: payment.error_code,
    source_iban: payment.source_iban,
    destination_iban: payment.destination_iban,
    received_at: randomDate(7),
    processed: i < 90,
  }
}).sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())

// Webhook requests (delivery attempts)
export const mockWebhookRequests: WebhookRequest[] = mockWebhookEvents.slice(0, 60).map(evt => ({
  id: `req_${randomId().slice(0, 12)}`,
  webhook_id: mockWebhooks[Math.floor(Math.random() * mockWebhooks.length)].id,
  event_type: evt.event_type,
  http_status: weightedRandom<number>([[200, 90], [500, 5], [408, 3], [404, 2]]),
  response_time_ms: Math.floor(Math.random() * 500) + 20,
  payload_size_bytes: Math.floor(Math.random() * 2000) + 200,
  created_at: evt.received_at,
  payload: evt.payload,
}))

// Reconciliation
export const mockReconciliation: ReconciliationRecord[] = [
  ...Array.from({ length: 15 }, () => {
    const payment = mockIncomingPayments[Math.floor(Math.random() * mockIncomingPayments.length)]
    return {
      id: randomId(),
      payment_id: payment.id,
      business_reference: `INV-${2024000 + Math.floor(Math.random() * 1000)}`,
      expected_amount_cents: payment.amount_cents,
      actual_amount_cents: payment.amount_cents,
      status: 'matched' as const,
      matched_at: randomDate(5),
      created_at: randomDate(10),
    }
  }),
  ...Array.from({ length: 5 }, () => ({
    id: randomId(),
    business_reference: `INV-${2024000 + Math.floor(Math.random() * 1000)}`,
    expected_amount_cents: randomAmount(10000, 500000),
    status: 'pending' as const,
    created_at: randomDate(3),
  })),
  ...Array.from({ length: 3 }, () => {
    const expected = randomAmount(10000, 500000)
    return {
      id: randomId(),
      payment_id: `inc_${randomId().slice(0, 12)}`,
      business_reference: `INV-${2024000 + Math.floor(Math.random() * 1000)}`,
      expected_amount_cents: expected,
      actual_amount_cents: expected + (Math.random() > 0.5 ? 1 : -1) * Math.floor(expected * 0.03),
      status: 'mismatched' as const,
      matched_at: randomDate(2),
      created_at: randomDate(7),
    }
  }),
]

// Retry log
export const mockRetryLog: RetryRecord[] = mockPayments
  .filter(p => p.status === 'failed' && p.error_code)
  .slice(0, 20)
  .map(p => ({
    id: randomId(),
    payment_id: p.id,
    attempt_number: Math.floor(Math.random() * 3) + 1,
    error_code: p.error_code!,
    retried_at: randomDate(5),
    result: weightedRandom<RetryRecord['result']>([['success', 40], ['failed_again', 45], ['abandoned', 15]]),
    next_retry_at: Math.random() > 0.5 ? randomDate(-1) : undefined,
  }))

// Retry rules
export const mockRetryRules: RetryRule[] = [
  { error_code: 'AC06', max_retries: 3, backoff_type: 'exponential', intervals_seconds: [30, 120, 600], enabled: true },
  { error_code: 'AB10', max_retries: 5, backoff_type: 'linear', intervals_seconds: [60, 60, 60, 60, 60], enabled: true },
  { error_code: 'MS03', max_retries: 3, backoff_type: 'exponential', intervals_seconds: [60, 300, 900], enabled: true },
  { error_code: 'AC04', max_retries: 0, backoff_type: 'linear', intervals_seconds: [], enabled: false },
]

// Chart data helpers
export function getPaymentsByHour(): { hour: string; confirmed: number; pending: number; failed: number }[] {
  const hours: Record<string, { confirmed: number; pending: number; failed: number }> = {}
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3600000)
    const key = `${h.getHours().toString().padStart(2, '0')}:00`
    hours[key] = { confirmed: 0, pending: 0, failed: 0 }
  }
  mockPayments.forEach(p => {
    const d = new Date(p.created_at)
    if (now.getTime() - d.getTime() > 86400000) return
    const key = `${d.getHours().toString().padStart(2, '0')}:00`
    if (!(key in hours)) return
    if (p.status === 'confirmed') hours[key].confirmed++
    else if (p.status === 'processing' || p.status === 'created') hours[key].pending++
    else hours[key].failed++
  })
  return Object.entries(hours).map(([hour, data]) => ({ hour, ...data }))
}

export function getErrorDistribution(): { name: string; value: number; code: string }[] {
  const counts: Record<string, number> = {}
  mockPayments.filter(p => p.error_code).forEach(p => {
    counts[p.error_code!] = (counts[p.error_code!] || 0) + 1
  })
  return Object.entries(counts)
    .map(([code, value]) => ({ code, name: code, value }))
    .sort((a, b) => b.value - a.value)
}

export function getStats() {
  const total = mockPayments.length
  const confirmed = mockPayments.filter(p => p.status === 'confirmed').length
  const failed = mockPayments.filter(p => p.status === 'failed' || p.status === 'rejected').length
  const today = mockPayments.filter(p => {
    const d = new Date(p.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length
  const avgDelivery = Math.round(
    mockPayments
      .filter(p => p.delivery_time_seconds)
      .reduce((s, p) => s + p.delivery_time_seconds!, 0) /
    (confirmed || 1)
  )
  const pendingRecon = mockReconciliation.filter(r => r.status === 'pending').length

  return {
    totalAccounts: mockAccounts.filter(a => a.status === 'active').length,
    paymentsToday: today,
    successRate: total > 0 ? Math.round((confirmed / total) * 10000) / 100 : 0,
    avgDeliveryTime: avgDelivery,
    activeWebhooks: mockWebhooks.filter(w => w.status === 'active').length,
    pendingReconciliation: pendingRecon,
    totalPayments: total,
    confirmedPayments: confirmed,
    failedPayments: failed,
  }
}
