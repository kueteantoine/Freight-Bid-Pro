import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const events = body?.events;

        if (!Array.isArray(events) || events.length === 0) {
            return NextResponse.json({ error: 'No events provided' }, { status: 400 });
        }

        if (events.length > 100) {
            return NextResponse.json({ error: 'Too many events (max 100)' }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Stamp each event with the authenticated user_id (override client-sent value for security)
        const stampedEvents = events.map((e: Record<string, unknown>) => ({
            ...e,
            user_id: user?.id || null,
        }));

        const { data, error } = await supabase.rpc('record_platform_events', {
            p_events: stampedEvents,
        });

        if (error) {
            console.error('[Analytics API] RPC error:', error.message);
            return NextResponse.json({ error: 'Failed to record events' }, { status: 500 });
        }

        return NextResponse.json({ recorded: data });
    } catch (err) {
        console.error('[Analytics API] Unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
