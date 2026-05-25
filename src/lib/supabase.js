import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasCredentials = supabaseUrl && supabaseAnonKey

export const supabase = hasCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseReady = hasCredentials
