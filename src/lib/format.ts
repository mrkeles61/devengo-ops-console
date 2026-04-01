import { format, formatDistanceToNow } from 'date-fns'

export function formatAmount(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatAmountCompact(cents: number): string {
  const value = cents / 100
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `€${(value / 1_000).toFixed(1)}K`
  return `€${value.toFixed(2)}`
}

export function formatIBAN(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}

export function maskIBAN(iban: string): string {
  if (iban.length < 10) return iban
  return `${iban.slice(0, 4)} •••• •••• ${iban.slice(-4)}`
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm')
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM, HH:mm')
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export function truncateId(id: string, chars = 8): string {
  if (id.length <= chars) return id
  return `${id.slice(0, chars)}…`
}
