import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://svujoznxajtzlhzslenf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dWpvem54YWp0emxoenNsZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDI4MzcsImV4cCI6MjA4NDM3ODgzN30.WvaHrBfR0_0buRrGBhgDUcmnkoxV4jJ6KnQn7vdAIKM'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const WEBHOOK_URL = `${supabaseUrl}/functions/v1/devengo-webhook-receiver`
