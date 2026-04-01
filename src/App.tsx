import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { DataModeProvider } from '@/contexts/DataModeContext'
import { Layout } from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Payments from '@/pages/Payments'
import Reconciliation from '@/pages/Reconciliation'
import Webhooks from '@/pages/Webhooks'
import Playground from '@/pages/Playground'
import Automations from '@/pages/Automations'
import SalesHub from '@/pages/SalesHub'
import ContentHub from '@/pages/ContentHub'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataModeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="payments" element={<Payments />} />
                <Route path="reconciliation" element={<Reconciliation />} />
                <Route path="webhooks" element={<Webhooks />} />
                <Route path="automations" element={<Automations />} />
                <Route path="sales" element={<SalesHub />} />
                <Route path="content" element={<ContentHub />} />
                <Route path="playground" element={<Playground />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster richColors />
        </TooltipProvider>
      </DataModeProvider>
    </QueryClientProvider>
  )
}

export default App
