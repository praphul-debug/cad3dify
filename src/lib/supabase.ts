import { createClient } from '@supabase/supabase-js'

// Use demo values if environment variables are not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key'

// Create client with error handling for demo mode
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Demo-Mode': 'true'
    }
  }
})

// Check if Supabase is properly configured (not demo mode)
export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  return url && 
         key && 
         url !== 'https://demo.supabase.co' && 
         key !== 'demo-anon-key' &&
         url.includes('supabase.co') &&
         key.length > 20
}

// Demo mode check
export const isDemoMode = () => {
  return !isSupabaseConfigured()
}