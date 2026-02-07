"use server";

import { createClient } from "@/lib/supabase/server";

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportTicket {
    id: string;
    ticket_number: number;
    user_id: string;
    user_email: string;
    subject: string;
    description: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    assigned_to_admin_id: string | null;
    assigned_admin_email: string | null;
    attachments_json: string[];
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    age_hours: number;
}

export interface SupportTicketDetails extends Omit<SupportTicket, 'age_hours'> { }

/**
 * Get all support tickets with optional filters
 */
export async function getAllTickets(params?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ data: SupportTicket[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("get_all_support_tickets", {
            filter_status: params?.status || null,
            filter_priority: params?.priority || null,
            filter_category: params?.category || null,
            search_query: params?.search || null,
            limit_count: params?.limit || 50,
            offset_count: params?.offset || 0,
        });

        if (error) {
            console.error("Error fetching tickets:", error);
            return { data: null, error: error.message };
        }

        return { data: data as SupportTicket[], error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { data: null, error: "An unexpected error occurred" };
    }
}

/**
 * Get ticket by ID
 */
export async function getTicketById(
    id: string
): Promise<{ data: SupportTicketDetails | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("get_ticket_details", {
            ticket_id: id,
        });

        if (error) {
            console.error("Error fetching ticket:", error);
            return { data: null, error: error.message };
        }

        if (!data || data.length === 0) {
            return { data: null, error: "Ticket not found" };
        }

        return { data: data[0] as SupportTicketDetails, error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { data: null, error: "An unexpected error occurred" };
    }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
    id: string,
    status: TicketStatus
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("update_ticket_status", {
            ticket_id: id,
            new_status: status,
        });

        if (error) {
            console.error("Error updating ticket status:", error);
            return { success: false, error: error.message };
        }

        const result = data as { success: boolean; message: string };
        return { success: result.success, error: result.success ? null : result.message };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Assign ticket to admin
 */
export async function assignTicketToAdmin(
    ticketId: string,
    adminId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("assign_ticket_to_admin", {
            ticket_id: ticketId,
            admin_id: adminId,
        });

        if (error) {
            console.error("Error assigning ticket:", error);
            return { success: false, error: error.message };
        }

        const result = data as { success: boolean; message: string };
        return { success: result.success, error: result.success ? null : result.message };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Add response to ticket
 * Note: This stores responses in a JSONB field. For production, consider a separate ticket_responses table.
 */
export async function addTicketResponse(
    ticketId: string,
    response: string,
    attachments?: string[]
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        // Get current ticket
        const { data: ticket, error: fetchError } = await supabase
            .from("support_tickets")
            .select("attachments_json")
            .eq("id", ticketId)
            .single();

        if (fetchError) {
            return { success: false, error: fetchError.message };
        }

        // Add response to attachments (temporary solution)
        const currentAttachments = (ticket.attachments_json as any[]) || [];
        const newResponse = {
            type: "response",
            text: response,
            admin_id: user.id,
            attachments: attachments || [],
            timestamp: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
            .from("support_tickets")
            .update({
                attachments_json: [...currentAttachments, newResponse],
                status: "in_progress",
                updated_at: new Date().toISOString(),
            })
            .eq("id", ticketId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Close ticket
 */
export async function closeTicket(
    ticketId: string,
    resolution?: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const updates: any = {
            status: "closed",
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // If resolution provided, add it as a final response
        if (resolution) {
            const { data: ticket } = await supabase
                .from("support_tickets")
                .select("attachments_json")
                .eq("id", ticketId)
                .single();

            if (ticket) {
                const currentAttachments = (ticket.attachments_json as any[]) || [];
                updates.attachments_json = [
                    ...currentAttachments,
                    {
                        type: "resolution",
                        text: resolution,
                        timestamp: new Date().toISOString(),
                    },
                ];
            }
        }

        const { error } = await supabase
            .from("support_tickets")
            .update(updates)
            .eq("id", ticketId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(): Promise<{
    data: {
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
        avg_response_time_hours: number;
    } | null;
    error: string | null;
}> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("support_tickets")
            .select("status, created_at, resolved_at");

        if (error) {
            return { data: null, error: error.message };
        }

        // Calculate average response time
        const resolvedTickets = data.filter((t) => t.resolved_at);
        const avgResponseTime =
            resolvedTickets.length > 0
                ? resolvedTickets.reduce((sum, t) => {
                    const created = new Date(t.created_at).getTime();
                    const resolved = new Date(t.resolved_at!).getTime();
                    return sum + (resolved - created) / (1000 * 60 * 60); // hours
                }, 0) / resolvedTickets.length
                : 0;

        const stats = {
            total: data.length,
            open: data.filter((t) => t.status === "open").length,
            in_progress: data.filter((t) => t.status === "in_progress").length,
            resolved: data.filter((t) => t.status === "resolved").length,
            closed: data.filter((t) => t.status === "closed").length,
            avg_response_time_hours: Math.round(avgResponseTime * 10) / 10,
        };

        return { data: stats, error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { data: null, error: "An unexpected error occurred" };
    }
}
