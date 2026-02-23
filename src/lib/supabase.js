import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize as null initially to prevent library crash on missing keys
export const supabase = (supabaseUrl && supabaseUrl !== 'your_supabase_project_url' && supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

if (!supabase) {
    console.warn('Supabase credentials missing or invalid. App is running in Local Mode.')
}
