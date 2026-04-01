import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function Layout() {
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    supabase
      .from('devengo_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('acknowledged', false)
      .then(({ count }) => setAlertCount(count || 0))

    const channel = supabase
      .channel('layout-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'devengo_alerts' }, () => {
        setAlertCount(prev => prev + 1)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devengo_alerts' }, () => {
        supabase
          .from('devengo_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('acknowledged', false)
          .then(({ count }) => setAlertCount(count || 0))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header alertCount={alertCount} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
