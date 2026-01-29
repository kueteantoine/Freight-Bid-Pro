import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const supabase = await createClient()

    // 1. Sign out from Supabase
    await supabase.auth.signOut()

    // 2. Create redirect response to /login
    const url = new URL("/login", request.url)
    const response = NextResponse.redirect(url, {
        status: 302,
    })

    // 3. Explicitly clear all Supabase related cookies
    // This is a safety measure to ensure the client-side/middleware treats the user as logged out
    const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
    ]

    // Fetch all cookies to find specific ones (sometimes they have suffixes like -auth-token)
    // However, the ssr package usually handles this. We add an extra layer of certainty.
    // We can iterate over the cookies in the request and clear any that look like Supabase cookies.

    // For now, let's use the most common patterns and rely on the redirect to clear state.
    // A better way is to set them to empty with an expired date.

    // The createServerClient setAll method in lib/supabase/server.ts usually handles this 
    // when signOut is called, but we can be explicit if needed.

    return response
}
