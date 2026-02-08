import { NextRequest, NextResponse } from 'next/server';
import { FlutterwaveProvider } from '@/lib/services/payments/flutterwave-provider';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    const signature = req.headers.get('verif-hash');
    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Try/catch for JSON parsing
    let payload;
    try {
        payload = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const provider = new FlutterwaveProvider({
        publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY!,
        secretKey: process.env.FLUTTERWAVE_SECRET_KEY!,
        encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY!,
        isTest: process.env.NODE_ENV !== 'production',
        webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET!
    });

    if (!await provider.verifyWebhook(payload, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { status, tx_ref, id } = payload;

    // Flutterwave sends "successful" for successful charges
    if (status === 'successful') {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // tx_ref from initiation should be our transaction UUID
        // id is the Flutterwave transaction ID

        const { data, error } = await supabase.rpc('confirm_shipment_payment', {
            p_transaction_id: tx_ref,
            p_aggregator_tx_id: id.toString()
        });

        if (error) {
            console.error('RPC Error:', error);
            // If the transaction ID is not found (maybe initiation failed to save?), 
            // we might want to log it for manual reconciliation.
            // Returning 500 triggers retry, which is good for transient errors.
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
}
