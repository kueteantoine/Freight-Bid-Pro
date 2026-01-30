import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()

    // 1. Sign out from Supabase with local scope to clear session
    await supabase.auth.signOut({ scope: 'local' })

    // 2. Create JSON response for client-side cleanup
    const response = NextResponse.json({
        success: true,
        message: "Successfully signed out"
    })

    // 3. Explicitly clear all sb-freight-auth cookie variants to ensure no residue
    // Clear base cookie
    response.cookies.set("sb-freight-auth", "", {
        path: "/",
        maxAge: 0,
    })

    // Clear chunked cookie variants (used for large sessions)
    response.cookies.set("sb-freight-auth.0", "", {
        path: "/",
        maxAge: 0,
    })

    response.cookies.set("sb-freight-auth.1", "", {
        path: "/",
        maxAge: 0,
    })

    return response
}
