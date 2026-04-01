import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { isConfigured } from '@/lib/devengo'
import { toast } from 'sonner'

type DataMode = 'demo' | 'live'

interface DataModeContextValue {
  mode: DataMode
  setMode: (mode: DataMode) => void
  toggleMode: () => void
  isLive: boolean
  isDemo: boolean
}

const DataModeContext = createContext<DataModeContextValue>({
  mode: 'demo',
  setMode: () => {},
  toggleMode: () => {},
  isLive: false,
  isDemo: true,
})

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataMode>('demo')

  const setMode = useCallback((newMode: DataMode) => {
    if (newMode === 'live') {
      if (!isConfigured()) {
        toast.error('API keys not configured', {
          description: 'Set VITE_DEVENGO_API_KEY and VITE_DEVENGO_API_SECRET in .env to use Live mode.',
        })
        return
      }
      toast.success('Switched to Live mode', { description: 'Connected to Devengo Sandbox API' })
    } else {
      toast.info('Switched to Demo mode', { description: 'Using simulated data' })
    }
    setModeState(newMode)
  }, [])

  const toggleMode = useCallback(() => {
    setMode(mode === 'demo' ? 'live' : 'demo')
  }, [mode, setMode])

  return (
    <DataModeContext.Provider value={{ mode, setMode, toggleMode, isLive: mode === 'live', isDemo: mode === 'demo' }}>
      {children}
    </DataModeContext.Provider>
  )
}

export function useDataMode() {
  return useContext(DataModeContext)
}
