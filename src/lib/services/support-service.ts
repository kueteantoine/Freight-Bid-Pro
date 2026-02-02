import { supabase } from '@/lib/supabase/client';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    display_order: number;
}

export interface SupportTicket {
    id: string;
    ticket_number: number;
    subject: string;
    description: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    created_at: string;
    attachments_json: string[];
}

export const supportService = {
    /**
     * Fetch all published FAQs
     */
    async fetchFAQs() {
        const { data, error } = await supabase
            .from('faq_content')
            .select('*')
            .eq('is_published', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data as FAQ[];
    },

    /**
     * Search FAQs
     */
    async searchFAQs(query: string) {
        const { data, error } = await supabase
            .from('faq_content')
            .select('*')
            .eq('is_published', true)
            .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data as FAQ[];
    },

    /**
     * Fetch support tickets for the current user
     */
    async fetchMyTickets() {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SupportTicket[];
    },

    /**
     * Create a new support ticket
     */
    async createTicket(payload: {
        subject: string;
        description: string;
        category: string;
        priority: TicketPriority;
        user_id: string;
        attachments?: string[];
    }) {
        const { data, error } = await supabase
            .from('support_tickets')
            .insert([{
                ...payload,
                attachments_json: payload.attachments || []
            }])
            .select()
            .single();

        if (error) throw error;
        return data as SupportTicket;
    },

    /**
     * Fetch a single ticket by ID
     */
    async fetchTicketById(id: string) {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as SupportTicket;
    }
};
