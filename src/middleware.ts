import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'fr'],

    // Used when no locale matches
    defaultLocale: 'fr',
    localePrefix: 'never' // Depending on the routing strategy. We'll start with 'never' if we want to avoid `/[locale]` folder structure, or 'always'/'as-needed' if we use the folder.
    // We'll use 'as-needed' which redirects /dashboard to /fr/dashboard since 'fr' is default.
    // Actually, 'as-needed' hides the default locale. So /fr/dashboard becomes /dashboard. Let's use 'as-needed'.
});

// Re-create the middleware using the config that fits our plan: We decided to use `[locale]` folder structure.
const routingMiddleware = createMiddleware({
    locales: ['en', 'fr'],
    defaultLocale: 'fr',
    localePrefix: 'as-needed' // The default locale 'fr' will not have a prefix, 'en' will have '/en'.
});


export async function middleware(req: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()

    const isAuthenticated = !!data?.user
    const { pathname, searchParams } = req.nextUrl

    // Strip the locale prefix for auth checks
    const pathnameWithoutLocale = pathname.replace(/^\/(en|fr)/, '') || '/';

    // Define route patterns against the non-localized pathname
    const isAuthPage = pathnameWithoutLocale === '/login' || pathnameWithoutLocale === '/register' || pathnameWithoutLocale === '/forgot-password'
    const isProtectedRoute = pathnameWithoutLocale.startsWith('/shipper') ||
        pathnameWithoutLocale.startsWith('/transporter') ||
        pathnameWithoutLocale.startsWith('/driver') ||
        pathnameWithoutLocale.startsWith('/broker') ||
        pathnameWithoutLocale.startsWith('/admin') ||
        pathnameWithoutLocale === '/settings' ||
        pathnameWithoutLocale === '/'

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthPage) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    if (!isAuthenticated && isProtectedRoute && pathnameWithoutLocale !== '/') {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Role-based redirection for root path
    if (isAuthenticated && pathnameWithoutLocale === '/') {
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

    // Finally run the intl middleware to handle the locale routing and redirects
    return routingMiddleware(req);
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}