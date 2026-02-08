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

        // Determine payment type from tx_ref or metadata
        // For ad subscriptions, we use the subscription UUID as tx_ref
        // For shipments, we use 'tx-[random]' or specific reference

        // Try ad subscription first
        const isSubscription = tx_ref.length === 36; // Simple UUID check

        if (isSubscription) {
            const { data, error } = await supabase.rpc('confirm_ad_subscription_payment', {
                p_subscription_id: tx_ref,
                p_aggregator_tx_id: id.toString()
            });

            if (error) {
                console.error('Subscription Webhook Error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ received: true, type: 'subscription' });
        } else {
            // Shipment payment
            const { data, error } = await supabase.rpc('confirm_shipment_payment', {
                p_transaction_id: tx_ref,
                p_aggregator_tx_id: id.toString()
            });

            if (error) {
                console.error('Shipment Webhook Error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ received: true, type: 'shipment' });
        }
    }

    return NextResponse.json({ received: true });
}
