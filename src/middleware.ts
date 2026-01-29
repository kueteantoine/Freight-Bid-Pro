import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    // We need to await the client creation because our server client implementation awaits cookies()
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.getUser()

    console.log('[Middleware] User:', data?.user?.id || 'NONE')

    if (!data?.user) {
        console.log('[Middleware] No session cookie found')
        return res
    }

    console.log('[Middleware] Authenticated:', data.user.email)
    return res
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}