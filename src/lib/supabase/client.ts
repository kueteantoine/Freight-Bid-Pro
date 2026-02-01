import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        },
        cookieOptions: {
            name: "sb-freight-auth",
        }
    }
)

// Export function for consistency with server client naming
export const createSupabaseBrowserClient = () => supabase;

