// Devengo API Client with HMAC-SHA256 Authentication
// Docs: https://docs.devengo.com/reference/basics-authentication

const API_KEY_ID = import.meta.env.VITE_DEVENGO_API_KEY ?? ''
const API_SECRET = import.meta.env.VITE_DEVENGO_API_SECRET ?? ''
const BASE_URL = 'https://api.sandbox.devengo.com'

async function hmacSign(body: string | null): Promise<{
  'X-Devengo-Api-Key-Id': string
  'X-Devengo-Api-Key-Signature': string
  'X-Devengo-Api-Key-Nonce': string
  'X-Devengo-Api-Key-Timestamp': string
}> {
  const nonce = crypto.randomUUID()
  const timestamp = Math.floor(Date.now() / 1000).toString()

  // Build data to sign: Base64(body) + nonce + timestamp + apiKeyId
  const encodedBody = body ? btoa(body) : ''
  const dataToSign = `${encodedBody}${nonce}${timestamp}${API_KEY_ID}`

  // HMAC-SHA256 sign with the secret
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign))

  // Base64 encode the signature
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  return {
    'X-Devengo-Api-Key-Id': API_KEY_ID,
    'X-Devengo-Api-Key-Signature': signature,
    'X-Devengo-Api-Key-Nonce': nonce,
    'X-Devengo-Api-Key-Timestamp': timestamp,
  }
}

interface DevengoError {
  error: string
  message: string
  code?: string
  status?: number
}

async function request<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<{ data: T | null; error: DevengoError | null }> {
  if (!API_KEY_ID || !API_SECRET) {
    return { data: null, error: { error: 'no_credentials', message: 'Devengo API credentials not configured. Set VITE_DEVENGO_API_KEY and VITE_DEVENGO_API_SECRET.' } }
  }

  const bodyStr = body ? JSON.stringify(body) : null
  const authHeaders = await hmacSign(bodyStr)

  const headers: Record<string, string> = {
    ...authHeaders,
    'Accept': 'application/json',
  }
  if (bodyStr) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: bodyStr,
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        data: null,
        error: {
          error: json.error || 'api_error',
          message: json.message || `HTTP ${res.status}`,
          code: json.code,
          status: res.status,
        },
      }
    }

    return { data: json as T, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        error: 'network_error',
        message: String(err),
      },
    }
  }
}

// ─── Account Holders ───
export interface AccountHolderResponse {
  id: string
  name: string
  tax_id: string
  status: string
  created_at: string
}

export function listAccountHolders() {
  return request<{ account_holders: AccountHolderResponse[] }>('GET', '/v1/account_holders')
}

export function getAccountHolder(id: string) {
  return request<AccountHolderResponse>('GET', `/v1/account_holders/${id}`)
}

// ─── Accounts ───
export interface AccountResponse {
  id: string
  name: string
  status: string
  identifiers: { type: string; iban: string }[]
  currency: string
  balance: {
    total: { cents: number; currency: string }
    available: { cents: number; currency: string }
  }
  account_holder_id: string
  bank: { name: string; bic: string }
  created_at: string
}

export function listAccounts() {
  return request<{ accounts: AccountResponse[] }>('GET', '/v1/accounts')
}

export function getAccount(id: string) {
  return request<AccountResponse>('GET', `/v1/accounts/${id}`)
}

// Helper: get IBAN from account
export function getIban(account: AccountResponse): string {
  return account.identifiers?.find(i => i.type === 'iban')?.iban ?? ''
}

// ─── Payments ───
export interface PaymentResponse {
  id: string
  source_account_id: string
  destination_iban: string
  amount: { amount: string; currency: string }
  concept: string
  status: string
  error_code?: string
  created_at: string
  confirmed_at?: string
  failed_at?: string
  metadata?: Record<string, string>
}

export function listPayments(params?: { page?: number; per_page?: number }) {
  const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''
  return request<{ payments: PaymentResponse[] }>('GET', `/v1/payments${query}`)
}

export function getPayment(id: string) {
  return request<PaymentResponse>('GET', `/v1/payments/${id}`)
}

export function createPayment(data: {
  source_account_id: string
  destination_iban: string
  amount: { amount: string; currency: string }
  concept: string
  metadata?: Record<string, string>
}) {
  return request<PaymentResponse>('POST', '/v1/payments', data)
}

export function previewPayment(data: {
  source_account_id: string
  destination_iban: string
  amount: { amount: string; currency: string }
}) {
  return request<{ estimated_delivery_seconds: number; fee: { amount: string; currency: string } }>('POST', '/v1/payments/preview', data)
}

// ─── Incoming Payments ───
export interface IncomingPaymentResponse {
  id: string
  account_id: string
  source_iban: string
  amount: { amount: string; currency: string }
  concept: string
  status: string
  created_at: string
  confirmed_at?: string
}

export function listIncomingPayments() {
  return request<{ incoming_payments: IncomingPaymentResponse[] }>('GET', '/v1/incoming_payments')
}

// ─── Webhooks ───
export interface WebhookResponse {
  id: string
  url: string
  subscribed_events: string[]
  status: string
  created_at: string
}

export function listWebhooks() {
  return request<{ webhooks: WebhookResponse[] }>('GET', '/v1/webhooks')
}

export function createWebhook(data: { url: string; subscribed_events: string[] }) {
  return request<WebhookResponse>('POST', '/v1/webhooks', data)
}

export function getWebhookEvents(webhookId: string) {
  return request<{ items: unknown[] }>('GET', `/v1/webhooks/${webhookId}/events`)
}

export function getWebhookRequests(webhookId: string) {
  return request<{ items: unknown[] }>('GET', `/v1/webhooks/${webhookId}/requests`)
}

// ─── Utilities ───
export function isConfigured(): boolean {
  return !!API_KEY_ID && !!API_SECRET
}

export function getApiKeyId(): string {
  return API_KEY_ID
}

// Helper: convert Devengo amount object to cents
export function amountToCents(amount: { amount: string; currency: string }): number {
  return Math.round(parseFloat(amount.amount) * 100)
}

// Helper: cents to Devengo amount object
export function centsToAmount(cents: number, currency = 'EUR'): { amount: string; currency: string } {
  return { amount: (cents / 100).toFixed(2), currency }
}
