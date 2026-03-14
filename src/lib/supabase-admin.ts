import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side admin client — bypasses RLS.
// Use ONLY in API routes (api/webhook, api/cron, api/notify, etc.)
// Never import this in client-side code.

let _admin: SupabaseClient | null = null;

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_admin) {
      _admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    return (_admin as any)[prop];
  },
});
