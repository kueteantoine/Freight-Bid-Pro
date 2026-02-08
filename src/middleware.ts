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

            let role = pref?.last_active_role

            if (!role) {
                // Check if user has admin role specifically
                const { data: adminRole } = await supabase
                    .from('user_roles')
                    .select('role_type')
                    .eq('user_id', data.user.id)
                    .eq('role_type', 'admin')
                    .eq('is_active', true)
                    .maybeSingle()

                if (adminRole) {
                    role = 'admin'
                } else {
                    // Fallback to first available role or shipper
                    const { data: firstRole } = await supabase
                        .from('user_roles')
                        .select('role_type')
                        .eq('user_id', data.user.id)
                        .eq('is_active', true)
                        .limit(1)
                        .maybeSingle()

                    role = firstRole?.role_type || 'shipper'
                }
            }

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