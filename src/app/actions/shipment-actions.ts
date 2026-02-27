"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath, unstable_cache } from "next/cache";

export async function createShipment(formData: any) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.from("shipments").insert({
        shipper_user_id: user.id,
        ...formData,
        status: "open_for_bidding",
    }).select().single();

    if (error) throw error;

    revalidatePath("/shipper/dashboard");
    revalidatePath("/shipper/shipments");

    return data;
}

export async function saveShipmentDraft(formData: any) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("shipment_drafts").upsert({
        user_id: user.id,
        form_data: formData,
        last_saved_at: new Date().toISOString(),
    });

    if (error) console.error("Error saving draft:", error);
}

export async function getShipmentDraft() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("shipment_drafts")
        .select("form_data")
        .eq("user_id", user.id)
        .single();

    if (error) return null;
    return data.form_data;
}

export async function saveShipmentTemplate(templateData: any) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.from("shipment_templates").insert({
        user_id: user.id,
        ...templateData,
    }).select().single();

    if (error) throw error;

    return data;
}

// --- Cached Helpers ---

const getCachedTemplates = unstable_cache(
    async (userId: string) => {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from("shipment_templates")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
    },
    ['shipment-templates'],
    { revalidate: 3600 }
);

// --- Public Actions ---

export async function getShipmentTemplates() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    return getCachedTemplates(user.id);
}

export async function bulkCreateShipments(shipments: any[]) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const shipmentsWithUser = shipments.map(s => ({
        ...s,
        shipper_user_id: user.id,
        status: "open_for_bidding"
    }));

    const { data, error } = await supabase.from("shipments").insert(shipmentsWithUser).select();

    if (error) throw error;

    revalidatePath("/shipper/dashboard");
    revalidatePath("/shipper/shipments");

    return data;
}
