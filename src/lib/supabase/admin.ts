/**
 * Server-only Supabase admin client — uses the service role key to bypass RLS.
 * NEVER import this file in client components or expose SUPABASE_SERVICE_ROLE_KEY
 * to the browser. Safe to use only in Server Components and API routes.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY — add it to .env.local and Vercel env vars'
    )
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
