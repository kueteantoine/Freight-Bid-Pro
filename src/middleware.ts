import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function middleware(req: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()

    const isAuthenticated = !!data?.user
    const { pathname, searchParams } = req.nextUrl

    // Define route patterns
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password'
    const isProtectedRoute = pathname.startsWith('/shipper') ||
        pathname.startsWith('/transporter') ||
        pathname.startsWith('/driver') ||
        pathname.startsWith('/broker') ||
        pathname.startsWith('/admin') ||
        pathname === '/settings' ||
        pathname === '/'

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthPage) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    // Redirect unauthenticated users to login from protected routes
    if (!isAuthenticated && isProtectedRoute && pathname !== '/') {
        // Allow landing page if we had one, but strict redirect for now
        // if pathname IS '/', we handle it below (or let it stay if it's public, but here it's protected)
    }

    if (!isAuthenticated && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Role-based redirection for root path
    if (isAuthenticated && pathname === '/') {
        try {
            // Fetch user preference to know which dashboard to show
            const { data: pref } = await supabase
                .from('user_preferences')
                .select('last_active_role')
                .eq('user_id', data.user.id)
                .single()

            const role = pref?.last_active_role || 'shipper' // Default fallback

            // Validate role to be safe
            const validRoles = ['shipper', 'transporter', 'driver', 'broker', 'admin']
            const targetRole = validRoles.includes(role) ? role : 'shipper'

            return NextResponse.redirect(new URL(`/${targetRole}/dashboard`, req.url))
        } catch (e) {
            console.error("Middleware role fetch error:", e)
            // Fallback to shipper dashboard on error
            return NextResponse.redirect(new URL('/shipper/dashboard', req.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}