import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars missing — check .env.local')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

/**
 * Ensure a valid session before calling Edge Functions.
 * Refreshes token if expired.
 */
export async function ensureSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) {
    const { error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) throw new Error('Session expired — please log in again')
  }
}
