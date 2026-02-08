"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Service Offerings
export async function getServiceOfferings() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("carrier_service_offerings")
        .select("*")
        .eq("transporter_user_id", user.id)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"
    return data;
}

export async function updateServiceOfferings(formData: any) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("carrier_service_offerings")
        .upsert({
            transporter_user_id: user.id,
            ...formData,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/transporter/settings");
    return data;
}

// Preferred Routes
export async function getPreferredRoutes() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("carrier_preferred_routes")
        .select("*")
        .eq("transporter_user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function addPreferredRoute(route: any) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("carrier_preferred_routes")
        .insert({
            transporter_user_id: user.id,
            ...route
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/transporter/settings");
    return data;
}

export async function deletePreferredRoute(routeId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("carrier_preferred_routes")
        .delete()
        .eq("id", routeId)
        .eq("transporter_user_id", user.id);

    if (error) throw error;
    revalidatePath("/transporter/settings");
}

// Pricing Rules
export async function getPricingRules() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("carrier_pricing_rules")
        .select("*")
        .eq("transporter_user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function upsertPricingRule(rule: any) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("carrier_pricing_rules")
        .upsert({
            transporter_user_id: user.id,
            ...rule,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/transporter/settings");
    return data;
}

export async function deletePricingRule(ruleId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("carrier_pricing_rules")
        .delete()
        .eq("id", ruleId)
        .eq("transporter_user_id", user.id);

    if (error) throw error;
    revalidatePath("/transporter/settings");
}

// Bid Automation
export async function getBidAutomationSettings() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("carrier_bid_automation_settings")
        .select("*")
        .eq("transporter_user_id", user.id)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

export async function updateBidAutomationSettings(formData: any) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("carrier_bid_automation_settings")
        .upsert({
            transporter_user_id: user.id,
            ...formData,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/transporter/settings");
    return data;
}

// Notification Settings
export async function getNotificationSettings() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("carrier_notification_settings")
        .select("*")
        .eq("transporter_user_id", user.id)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || { preferences: {} };
}

export async function updateNotificationSettings(preferences: any) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("carrier_notification_settings")
        .upsert({
            transporter_user_id: user.id,
            preferences: preferences,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/transporter/settings");
    return data;
}
