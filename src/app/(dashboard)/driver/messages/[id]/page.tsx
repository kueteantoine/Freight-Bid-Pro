import { SimplifiedChat } from '@/components/driver/communication/SimplifiedChat';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface ConversationPageProps {
    params: {
        id: string;
    };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Fetch shipment details to get shipper names etc. if needed
    const { data: shipment } = await supabase
        .from('shipments')
        .select(`
            *,
            shipper_profile:profiles!shipments_shipper_user_id_fkey(*)
        `)
        .eq('id', params.id)
        .single();

    return (
        <div className="h-[100dvh] flex flex-col pt-0">
            <SimplifiedChat
                shipmentId={params.id}
                currentUserId={user.id}
                recipientName={shipment?.shipper_profile?.first_name ? `${shipment.shipper_profile.first_name} (Shipper)` : 'Shipper'}
                recipientAvatar={shipment?.shipper_profile?.avatar_url}
            />
        </div>
    );
}
