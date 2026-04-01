import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Payments from '@/pages/Payments'
import Reconciliation from '@/pages/Reconciliation'
import Webhooks from '@/pages/Webhooks'
import Playground from '@/pages/Playground'
import Automations from '@/pages/Automations'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reconciliation" element={<Reconciliation />} />
              <Route path="webhooks" element={<Webhooks />} />
              <Route path="automations" element={<Automations />} />
              <Route path="playground" element={<Playground />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
