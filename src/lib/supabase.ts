import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) console.warn('Supabase env vars missing — check .env.local')
  throw new Error('Supabase configuration incomplete')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Ensure a valid session before calling Edge Functions.
 * Refreshes token if expired. Throws if refresh also fails.
 */
export async function ensureSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (session && !error) return

  const { data: { session: refreshedSession }, error: refreshError } =
    await supabase.auth.refreshSession()
  if (refreshError || !refreshedSession) {
    throw new Error('Session expired — please log in again')
  }
}
