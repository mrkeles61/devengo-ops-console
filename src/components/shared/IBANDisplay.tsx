import { cn } from '@/lib/utils'
import { formatIBAN, maskIBAN } from '@/lib/format'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface IBANDisplayProps {
  iban: string
  masked?: boolean
  copyable?: boolean
  className?: string
}

export function IBANDisplay({ iban, masked = false, copyable = false, className }: IBANDisplayProps) {
  const [copied, setCopied] = useState(false)

  const display = masked ? maskIBAN(iban) : formatIBAN(iban)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(iban)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-sm', className)}>
      {display}
      {copyable && (
        <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </span>
  )
}
