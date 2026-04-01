export interface ErrorCodeInfo {
  label: string
  description: string
  retryable: boolean
}

export const DEVENGO_ERROR_CODES: Record<string, ErrorCodeInfo> = {
  'AC01': { label: 'Incorrect IBAN', description: 'The destination IBAN is invalid or malformed', retryable: false },
  'AC04': { label: 'Closed Account', description: 'The beneficiary account has been closed', retryable: false },
  'AC06': { label: 'Blocked Account', description: 'The beneficiary account is blocked for credits', retryable: true },
  'AG01': { label: 'Transaction Forbidden', description: 'Payment type not allowed for this account', retryable: false },
  'AM05': { label: 'Duplicate', description: 'This payment was already processed (use idempotency keys)', retryable: false },
  'AB10': { label: 'CSM Error', description: 'Connectivity issue between banks — usually temporary', retryable: true },
  'MS03': { label: 'Not Specified', description: 'Generic rejection from beneficiary bank', retryable: true },
  'FOCR': { label: 'Cancellation', description: 'Payment was recalled by the originating bank', retryable: false },
  'MD07': { label: 'Deceased', description: 'Account holder is deceased', retryable: false },
  'DNOR': { label: 'Debtor Not Found', description: 'No account found for the given debtor reference', retryable: false },
  'CNOR': { label: 'Creditor Not Found', description: 'No account found for the given creditor reference', retryable: false },
}

export function getErrorInfo(code: string): ErrorCodeInfo {
  return DEVENGO_ERROR_CODES[code] ?? {
    label: 'Unknown',
    description: `Unrecognized error code: ${code}`,
    retryable: false,
  }
}
