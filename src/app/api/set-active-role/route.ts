import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse and validate request body
    let body
    try {
        body = await request.json()
    } catch (e) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { role } = body

    if (!role) {
        return NextResponse.json({ error: "Role is required" }, { status: 400 })
    }

    const validRoles = ['shipper', 'transporter', 'driver', 'broker', 'admin']
    if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role type" }, { status: 400 })
    }

    // 3. Verify user owns the requested role
    const { data: roleOwnership, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role_type', role)
        .single()

    if (roleError || !roleOwnership) {
        return NextResponse.json({ error: "Unauthorized role access" }, { status: 403 })
    }

    // 4. Update last_active_role in user_preferences
    const { error: prefError } = await supabase
        .from('user_preferences')
        .update({ last_active_role: role })
        .eq('user_id', user.id)

    if (prefError) {
        console.error("Error updating last_active_role:", prefError)
        return NextResponse.json({ error: "Failed to update active role" }, { status: 500 })
    }

    return NextResponse.json({ success: true, role })
}
