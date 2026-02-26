import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client for server-side usage (Server Components, API Routes, Middleware).
 * This follows the latest @supabase/ssr conventions for Next.js 15.
 */
export const createSupabaseServerClient = async () => {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    // Combine chunks for the auth cookie
                    if (name === "sb-freight-auth") {
                        const allCookies = cookieStore.getAll()
                        const chunks = allCookies
                            .filter(c => c.name.startsWith("sb-freight-auth."))
                            .sort((a, b) => {
                                const indexA = parseInt(a.name.split(".").pop() || "0")
                                const indexB = parseInt(b.name.split(".").pop() || "0")
                                return indexA - indexB
                            })

                        if (chunks.length > 0) {
                            return chunks.map(c => c.value).join("")
                        }
                    }
                    return cookieStore.get(name)?.value
                },
                set(name, value, options) {
                    try {
                        // The @supabase/ssr set handler already handles chunking if configured correctly,
                        // but we ensure compatibility with Next.js 15 cookies() API.
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // Ignore errors when called from Server Components
                    }
                },
                remove(name, options) {
                    try {
                        if (name === "sb-freight-auth") {
                            const allCookies = cookieStore.getAll()
                            allCookies
                                .filter(c => c.name.startsWith("sb-freight-auth"))
                                .forEach(c => cookieStore.delete({ name: c.name, ...options }))
                        } else {
                            cookieStore.delete({ name, ...options })
                        }
                    } catch (error) {
                        // Ignore errors when called from Server Components
                    }
                },
            },
            cookieOptions: {
                name: "sb-freight-auth",
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            }
        }
    )
}

export const createClient = createSupabaseServerClient;

/**
 * Creates a Supabase client that does not use cookies.
 * Suitable for use inside unstable_cache or other scopes where dynamic headers are forbidden.
 */
export const createStaticClient = () => {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
