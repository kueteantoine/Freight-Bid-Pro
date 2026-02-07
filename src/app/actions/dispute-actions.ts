"use server";


import { createClient } from "@/lib/supabase/server";

export interface Dispute {
    id: string;
    dispute_number: number;
    shipment_id: string;
    transaction_id: string | null;
    raised_by_user_id: string;
    raised_by_email: string;
    against_user_id: string;
    against_email: string;
    dispute_type: string;
    dispute_description: string;
    evidence_urls_json: string[];
    status: string;
    priority: string;
    assigned_to_admin_id: string | null;
    assigned_admin_email: string | null;
    resolution_notes: string | null;
    resolution_action: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    age_hours: number;
}

export interface DisputeDetails extends Omit<Dispute, 'age_hours'> {
    shipment_number: string;
}

/**
 * Get all disputes with optional filters
 */
export async function getAllDisputes(params?: {
    status?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ data: Dispute[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("get_all_disputes", {
            filter_status: params?.status || null,
            filter_priority: params?.priority || null,
            search_query: params?.search || null,
            limit_count: params?.limit || 50,
            offset_count: params?.offset || 0,
        });

        if (error) {
            console.error("Error fetching disputes:", error);
            return { data: null, error: error.message };
        }

        return { data: data as Dispute[], error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { data: null, error: "An unexpected error occurred" };
    }
}

/**
 * Get dispute by ID
 */
export async function getDisputeById(
    id: string
): Promise<{ data: DisputeDetails | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("get_dispute_details", {
            dispute_id: id,
        });

        if (error) {
            console.error("Error fetching dispute:", error);
            return { data: null, error: error.message };
        }

        if (!data || data.length === 0) {
            return { data: null, error: "Dispute not found" };
        }

        return { data: data[0] as DisputeDetails, error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { data: null, error: "An unexpected error occurred" };
    }
}

/**
 * Update dispute status
 */
export async function updateDisputeStatus(
    id: string,
    status: string,
    notes?: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("update_dispute_status", {
            dispute_id: id,
            new_status: status,
            admin_notes: notes || null,
        });

        if (error) {
            console.error("Error updating dispute status:", error);
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
 * Assign dispute to admin
 */
export async function assignDisputeToAdmin(
    disputeId: string,
    adminId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("assign_dispute_to_admin", {
            dispute_id: disputeId,
            admin_id: adminId,
        });

        if (error) {
            console.error("Error assigning dispute:", error);
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
 * Add message to dispute (stored in evidence_urls_json for now)
 */
export async function addDisputeMessage(
    disputeId: string,
    message: string,
    attachments?: string[]
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        // Get current dispute
        const { data: dispute, error: fetchError } = await supabase
            .from("disputes")
            .select("evidence_urls_json")
            .eq("id", disputeId)
            .single();

        if (fetchError) {
            return { success: false, error: fetchError.message };
        }

        // Add message to evidence (we'll create a proper messages table later if needed)
        const currentEvidence = (dispute.evidence_urls_json as any[]) || [];
        const newMessage = {
            type: "message",
            text: message,
            attachments: attachments || [],
            timestamp: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
            .from("disputes")
            .update({
                evidence_urls_json: [...currentEvidence, newMessage],
                updated_at: new Date().toISOString(),
            })
            .eq("id", disputeId);

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
 * Resolve dispute
 */
export async function resolveDispute(
    disputeId: string,
    action: string,
    notes: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("resolve_dispute", {
            dispute_id: disputeId,
            resolution_action_text: action,
            resolution_notes_text: notes,
        });

        if (error) {
            console.error("Error resolving dispute:", error);
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
 * Get dispute statistics
 */
export async function getDisputeStats(): Promise<{
    data: {
        total: number;
        open: number;
        under_review: number;
        resolved: number;
        escalated: number;
    } | null;
    error: string | null;
}> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("disputes")
            .select("status");

        if (error) {
            return { data: null, error: error.message };
        }

        const stats = {
            total: data.length,
            open: data.filter((d) => d.status === "open").length,
            under_review: data.filter((d) => d.status === "under_review").length,
            resolved: data.filter((d) => d.status === "resolved").length,
            escalated: data.filter((d) => d.status === "escalated").length,
        };

        return { data: stats, error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { data: null, error: "An unexpected error occurred" };
    }
}
