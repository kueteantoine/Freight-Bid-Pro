"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Get pending custom freight types for review
 */
export async function getPendingCustomFreightTypes() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("freight_types_custom")
        .select("*")
        .eq("status", "pending_review")
        .order("usage_count", { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Get pending custom vehicle types for review
 */
export async function getPendingCustomVehicleTypes() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("vehicle_types_custom")
        .select("*")
        .eq("status", "pending_review")
        .order("usage_count", { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Promote a custom type to standard
 */
export async function promoteCustomType(
    type: "freight" | "vehicle",
    customTypeId: string,
    standardData: any
) {
    const supabase = await createSupabaseServerClient();

    // 1. Create standard type
    const table = type === "freight" ? "freight_categories" : "vehicle_types";
    const { data: standardType, error: standardError } = await supabase
        .from(table)
        .insert(standardData)
        .select()
        .single();

    if (standardError) throw standardError;

    // 2. Update custom type status
    const customTable = type === "freight" ? "freight_types_custom" : "vehicle_types_custom";
    const { error: customError } = await supabase
        .from(customTable)
        .update({
            status: "promoted",
            promoted_to_standard_id: standardType.id,
            updated_at: new Date().toISOString()
        })
        .eq("id", customTypeId);

    if (customError) throw customError;

    revalidatePath("/admin/settings/curation");
    return standardType;
}

/**
 * Merge a custom type into an existing standard type (mark as synonym)
 */
export async function mergeCustomType(
    type: "freight" | "vehicle",
    customTypeId: string,
    targetStandardId: string,
    synonymName: string
) {
    const supabase = await createSupabaseServerClient();

    // 1. Add to synonyms
    const { error: synonymError } = await supabase
        .from("type_synonyms")
        .insert({
            synonym_name: synonymName,
            target_type_id: targetStandardId,
            target_table_name: type === "freight" ? "freight_categories" : "vehicle_types"
        });

    if (synonymError) throw synonymError;

    // 2. Update custom type status
    const customTable = type === "freight" ? "freight_types_custom" : "vehicle_types_custom";
    const { error: customError } = await supabase
        .from(customTable)
        .update({
            status: "merged",
            promoted_to_standard_id: targetStandardId,
            updated_at: new Date().toISOString()
        })
        .eq("id", customTypeId);

    if (customError) throw customError;

    revalidatePath("/admin/settings/curation");
}

/**
 * Flag a custom type as invalid or inappropriate
 */
export async function flagCustomType(
    type: "freight" | "vehicle",
    customTypeId: string
) {
    const supabase = await createSupabaseServerClient();
    const customTable = type === "freight" ? "freight_types_custom" : "vehicle_types_custom";

    const { error } = await supabase
        .from(customTable)
        .update({
            status: "flagged",
            updated_at: new Date().toISOString()
        })
        .eq("id", customTypeId);

    if (error) throw error;
    revalidatePath("/admin/settings/curation");
}
