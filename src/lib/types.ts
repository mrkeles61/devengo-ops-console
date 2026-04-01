export interface AccountHolder {
  id: string
  name: string
  tax_id: string
  status: 'validated' | 'pending' | 'rejected'
  created_at: string
}

export interface Account {
  id: string
  iban: string
  account_holder_id: string
  status: 'active' | 'inactive' | 'deactivated'
  balance_cents: number
  currency: string
  created_at: string
}

export interface Payment {
  id: string
  source_account_id: string
  source_iban: string
  destination_iban: string
  amount_cents: number
  currency: string
  concept: string
  status: PaymentStatus
  error_code?: string
  created_at: string
  confirmed_at?: string
  failed_at?: string
  delivery_time_seconds?: number
  metadata?: Record<string, string>
}

export type PaymentStatus = 'created' | 'processing' | 'confirmed' | 'failed' | 'rejected'

export interface IncomingPayment {
  id: string
  account_id: string
  source_iban: string
  amount_cents: number
  currency: string
  concept: string
  status: 'created' | 'confirmed'
  created_at: string
  confirmed_at?: string
}

export interface Webhook {
  id: string
  url: string
  subscribed_events: string[]
  status: 'active' | 'inactive'
  created_at: string
}

export interface WebhookEvent {
  id: string
  event_type: string
  payload: Record<string, unknown>
  payment_id?: string
  amount_cents?: number
  status?: string
  error_code?: string
  source_iban?: string
  destination_iban?: string
  received_at: string
  processed: boolean
}

export interface WebhookRequest {
  id: string
  webhook_id: string
  event_type: string
  http_status: number
  response_time_ms: number
  payload_size_bytes: number
  created_at: string
  payload?: Record<string, unknown>
}

export interface ReconciliationRecord {
  id: string
  payment_id?: string
  business_reference: string
  expected_amount_cents: number
  actual_amount_cents?: number
  status: 'pending' | 'matched' | 'mismatched' | 'orphaned'
  matched_at?: string
  notes?: string
  created_at: string
}

export interface RetryRecord {
  id: string
  payment_id: string
  attempt_number: number
  error_code: string
  retried_at: string
  result: 'success' | 'failed_again' | 'abandoned'
  next_retry_at?: string
}

export interface PaymentPreview {
  estimated_delivery_seconds: number
  fee_cents: number
  route: string
}

export interface RetryRule {
  error_code: string
  max_retries: number
  backoff_type: 'exponential' | 'linear'
  intervals_seconds: number[]
  enabled: boolean
}

export interface MetricData {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
}
