import { supabase } from '@/lib/supabase/client';
import { Message, MessageType, ConversationType } from '@/lib/types/database';

export const messageService = {
    /**
     * Send a new message
     */
    async sendMessage(payload: {
        conversation_type: ConversationType;
        related_shipment_id?: string;
        related_bid_id?: string;
        sender_user_id: string;
        receiver_user_id?: string;
        message_content: string;
        message_type?: MessageType;
        attachment_url?: string;
    }) {
        const { data, error } = await supabase
            .from('messages')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data as Message;
    },

    /**
     * Fetch messages for a specific shipment or bid
     */
    async fetchMessages(params: {
        shipment_id?: string;
        bid_id?: string;
        limit?: number;
    }) {
        let query = supabase
            .from('messages')
            .select('*, sender_profile:profiles(*)');

        if (params.shipment_id) {
            query = query.eq('related_shipment_id', params.shipment_id);
        } else if (params.bid_id) {
            query = query.eq('related_bid_id', params.bid_id);
        }

        const { data, error } = await query
            .order('sent_at', { ascending: true })
            .limit(params.limit || 100);

        if (error) throw error;
        return data as (Message & { sender_profile: any })[];
    },

    /**
     * Fetch all shipments that have conversations for the user
     */
    async fetchConversations() {
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                related_shipment_id,
                shipments (
                    id,
                    shipment_number,
                    pickup_location,
                    delivery_location,
                    status
                )
            `)
            .not('related_shipment_id', 'is', null)
            .order('sent_at', { ascending: false });

        if (error) throw error;

        const shipmentsMap = new Map();
        messages?.forEach((msg: any) => {
            if (msg.related_shipment_id && msg.shipments && !shipmentsMap.has(msg.related_shipment_id)) {
                shipmentsMap.set(msg.related_shipment_id, msg.shipments);
            }
        });

        return Array.from(shipmentsMap.values());
    },

    /**
     * Upload an audio message to storage
     */
    async uploadAudio(file: Blob, userId: string) {
        const fileName = `${userId}/${Date.now()}.webm`;
        const { data, error } = await supabase.storage
            .from('message-attachments')
            .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(data.path);

        return publicUrl;
    },

    /**
     * Mark messages as read
     */
    async markAsRead(messageIds: string[]) {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', messageIds);

        if (error) throw error;
    },

    /**
     * Subscribe to messages for a specific shipment/bid
     */
    subscribeToMessages(entityId: string, callback: (message: Message) => void) {
        return supabase
            .channel(`shipment-messages-${entityId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `related_shipment_id=eq.${entityId}`,
                },
                async (payload) => {
                    // Fetch the profile for the new message
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', payload.new.sender_user_id)
                        .single();

                    callback({
                        ...payload.new as Message,
                        sender_profile: profile
                    });
                }
            )
            .subscribe();
    }
};
