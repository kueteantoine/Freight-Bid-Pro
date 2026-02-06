"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Contract Renewal Service
 * Automated reminders for contract renewals
 */

export interface UpcomingRenewal {
    id: string;
    shipper_user_id: string;
    company_name: string;
    email: string;
    renewal_date: string;
    days_until_renewal: number;
    commission_rate: number;
    total_shipments: number;
    total_revenue: number;
    reminder_sent: boolean;
}

/**
 * Get upcoming contract renewals
 */
export async function getUpcomingRenewals(
    daysAhead: number = 90
): Promise<{ data: UpcomingRenewal[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        // Calculate date range
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        const { data, error } = await supabase
            .from("broker_shipper_network")
            .select(`
        id,
        shipper_user_id,
        commission_rate,
        total_shipments_brokered,
        total_revenue_generated,
        contract_details,
        shipper_profile:profiles!shipper_user_id(email),
        shipper_role:user_roles!shipper_user_id(role_specific_profile)
      `)
            .eq("broker_user_id", user.id)
            .eq("relationship_status", "active")
            .not("contract_details->renewal_date", "is", null);

        if (error) {
            console.error("Error fetching renewals:", error);
            return { data: null, error: error.message };
        }

        // Filter and transform data
        const renewals: UpcomingRenewal[] = (data || [])
            .map((partner: any) => {
                const renewalDate = partner.contract_details?.renewal_date;
                if (!renewalDate) return null;

                const renewal = new Date(renewalDate);
                const daysUntil = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntil < 0 || daysUntil > daysAhead) return null;

                return {
                    id: partner.id,
                    shipper_user_id: partner.shipper_user_id,
                    company_name: partner.shipper_role?.[0]?.role_specific_profile?.company_name || "Unknown",
                    email: partner.shipper_profile?.email || "",
                    renewal_date: renewalDate,
                    days_until_renewal: daysUntil,
                    commission_rate: partner.commission_rate,
                    total_shipments: partner.total_shipments_brokered || 0,
                    total_revenue: partner.total_revenue_generated || 0,
                    reminder_sent: partner.contract_details?.renewal_reminder_sent || false,
                };
            })
            .filter((r): r is UpcomingRenewal => r !== null)
            .sort((a, b) => a.days_until_renewal - b.days_until_renewal);

        return { data: renewals, error: null };
    } catch (error: any) {
        console.error("Error in getUpcomingRenewals:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Mark renewal reminder as sent
 */
export async function markReminderSent(
    partnerId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        // Get current contract details
        const { data: partner } = await supabase
            .from("broker_shipper_network")
            .select("contract_details")
            .eq("id", partnerId)
            .eq("broker_user_id", user.id)
            .single();

        if (!partner) {
            return { success: false, error: "Partner not found" };
        }

        // Update contract details with reminder flag
        const updatedDetails = {
            ...partner.contract_details,
            renewal_reminder_sent: true,
            reminder_sent_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("broker_shipper_network")
            .update({ contract_details: updatedDetails })
            .eq("id", partnerId)
            .eq("broker_user_id", user.id);

        if (error) {
            console.error("Error marking reminder sent:", error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (error: any) {
        console.error("Error in markReminderSent:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update contract renewal date
 */
export async function updateRenewalDate(
    partnerId: string,
    newRenewalDate: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        // Get current contract details
        const { data: partner } = await supabase
            .from("broker_shipper_network")
            .select("contract_details")
            .eq("id", partnerId)
            .eq("broker_user_id", user.id)
            .single();

        if (!partner) {
            return { success: false, error: "Partner not found" };
        }

        // Update contract details with new renewal date
        const updatedDetails = {
            ...partner.contract_details,
            renewal_date: newRenewalDate,
            renewal_reminder_sent: false, // Reset reminder flag
            last_renewed_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("broker_shipper_network")
            .update({ contract_details: updatedDetails })
            .eq("id", partnerId)
            .eq("broker_user_id", user.id);

        if (error) {
            console.error("Error updating renewal date:", error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (error: any) {
        console.error("Error in updateRenewalDate:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Set renewal reminder preferences
 */
export async function setRenewalReminderDays(
    partnerId: string,
    reminderDays: number
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        // Get current contract details
        const { data: partner } = await supabase
            .from("broker_shipper_network")
            .select("contract_details")
            .eq("id", partnerId)
            .eq("broker_user_id", user.id)
            .single();

        if (!partner) {
            return { success: false, error: "Partner not found" };
        }

        // Update contract details with reminder days
        const updatedDetails = {
            ...partner.contract_details,
            reminder_days_before: reminderDays,
        };

        const { error } = await supabase
            .from("broker_shipper_network")
            .update({ contract_details: updatedDetails })
            .eq("id", partnerId)
            .eq("broker_user_id", user.id);

        if (error) {
            console.error("Error setting reminder days:", error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (error: any) {
        console.error("Error in setRenewalReminderDays:", error);
        return { success: false, error: error.message };
    }
}
