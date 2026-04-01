// Simulates live webhook events in Demo Mode
import type { WebhookEvent } from './types'

const EVENT_TYPES = [
  'outgoing_payment.confirmed',
  'outgoing_payment.created',
  'outgoing_payment.processing',
  'incoming_payment.confirmed',
  'outgoing_payment.rejected',
]

function randomIBAN(): string {
  const digits = Array.from({ length: 22 }, () => Math.floor(Math.random() * 10)).join('')
  return `ES${digits}`
}

export function generateDemoEvent(): WebhookEvent {
  const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)]
  const isFailed = eventType.includes('rejected')
  const errorCodes = ['AC04', 'AB10', 'MS03', 'AC06']

  return {
    id: `evt_demo_${crypto.randomUUID().slice(0, 8)}`,
    event_type: eventType,
    payload: {},
    payment_id: `pyo_demo_${crypto.randomUUID().slice(0, 8)}`,
    amount_cents: Math.floor(Math.random() * 500000) + 1000,
    status: isFailed ? 'rejected' : eventType.split('.')[1],
    error_code: isFailed ? errorCodes[Math.floor(Math.random() * errorCodes.length)] : undefined,
    source_iban: randomIBAN(),
    destination_iban: randomIBAN(),
    received_at: new Date().toISOString(),
    processed: true,
  }
}

// Demo alerts
export const demoAlerts = [
  { id: 'da1', alert_type: 'terminal_failure', severity: 'critical', title: 'Payment pyo_8f3k permanently failed', description: 'Error AC04: Closed Account. Manual review required.', payment_id: 'pyo_8f3k', error_code: 'AC04', acknowledged: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'da2', alert_type: 'terminal_failure', severity: 'critical', title: 'Payment pyo_2m9x permanently failed', description: 'Error MD07: Account holder is deceased. Non-retryable.', payment_id: 'pyo_2m9x', error_code: 'MD07', acknowledged: false, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'da3', alert_type: 'retry_scheduled', severity: 'warning', title: 'Retry scheduled for pyo_4k1n', description: 'Error AB10: CSM connectivity issue. Attempt 2/5. Next retry in 120s.', payment_id: 'pyo_4k1n', error_code: 'AB10', acknowledged: false, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'da4', alert_type: 'retry_scheduled', severity: 'warning', title: 'Retry scheduled for pyo_7j2p', description: 'Error AC06: Blocked account. Attempt 1/3. Next retry in 60s.', payment_id: 'pyo_7j2p', error_code: 'AC06', acknowledged: false, created_at: new Date(Date.now() - 900000).toISOString() },
  { id: 'da5', alert_type: 'reconciliation_mismatch', severity: 'warning', title: 'Amount mismatch for INV-2024-089', description: 'Expected 15000 cents, received 14850 cents (1% difference).', acknowledged: false, created_at: new Date(Date.now() - 5400000).toISOString() },
  { id: 'da6', alert_type: 'low_balance', severity: 'info', title: 'Low balance on Operating Account', description: 'Balance €4,850.00 is below threshold €5,000.00.', acknowledged: false, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 'da7', alert_type: 'auto_sweep', severity: 'info', title: 'Auto-sweep executed on Main Account', description: 'Balance €52,300.00 exceeds threshold €50,000.00. Swept €2,300.00.', acknowledged: true, created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 'da8', alert_type: 'orphaned_payment', severity: 'info', title: 'Unmatched incoming payment', description: 'Received €1,250.00 from DE89370400440532013000 with no matching expected record.', acknowledged: false, created_at: new Date(Date.now() - 18000000).toISOString() },
  { id: 'da9', alert_type: 'retry_scheduled', severity: 'info', title: 'Retry successful for pyo_3n8k', description: 'Error MS03 resolved on attempt 2/3. Payment confirmed.', acknowledged: true, created_at: new Date(Date.now() - 21600000).toISOString() },
  { id: 'da10', alert_type: 'auto_sweep', severity: 'info', title: 'Auto-sweep executed on Treasury', description: 'Swept €5,000.00 to savings IBAN.', acknowledged: true, created_at: new Date(Date.now() - 43200000).toISOString() },
]

// Demo automation log entries
export const demoAutomationLog = [
  { id: 'dl1', automation_name: 'webhook_receiver', status: 'success', duration_ms: 45, output_data: { event_id: 'evt_abc123' }, created_at: new Date(Date.now() - 60000).toISOString() },
  { id: 'dl2', automation_name: 'auto_reconcile', status: 'success', duration_ms: 120, output_data: { matched_record: 'INV-2024-088', match_type: 'exact' }, created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'dl3', automation_name: 'webhook_receiver', status: 'success', duration_ms: 38, output_data: { event_id: 'evt_def456' }, created_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'dl4', automation_name: 'balance_watchdog', status: 'success', duration_ms: 890, output_data: { rules_checked: 3, triggered: 1 }, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'dl5', automation_name: 'webhook_receiver', status: 'error', duration_ms: 12, error_message: 'Invalid payload format', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'dl6', automation_name: 'daily_digest', status: 'success', duration_ms: 2100, output_data: { total_payments: 47, success_rate: 97.8 }, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'dl7', automation_name: 'auto_reconcile', status: 'success', duration_ms: 95, output_data: { matched_record: 'INV-2024-087', match_type: 'fuzzy' }, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 'dl8', automation_name: 'webhook_receiver', status: 'success', duration_ms: 52, output_data: { event_id: 'evt_ghi789' }, created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 'dl9', automation_name: 'balance_watchdog', status: 'success', duration_ms: 750, output_data: { rules_checked: 3, triggered: 0 }, created_at: new Date(Date.now() - 18000000).toISOString() },
  { id: 'dl10', automation_name: 'webhook_receiver', status: 'success', duration_ms: 41, output_data: { event_id: 'evt_jkl012' }, created_at: new Date(Date.now() - 21600000).toISOString() },
]
