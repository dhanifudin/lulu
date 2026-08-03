import { createClient } from '@supabase/supabase-js'

// All lulu app data lives in the 'lulu' schema on the shared Supabase instance
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    db: { schema: 'lulu' },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // PKCE returns ?code=... (query string) instead of #access_token=...
      // (hash fragment), so it doesn't collide with Vue Router's hash history.
      flowType: 'pkce',
    },
  }
)

// Emails allowed to access this app
export const ALLOWED_EMAILS = ['ulfillah49@gmail.com', 'dhanifudin@gmail.com']
