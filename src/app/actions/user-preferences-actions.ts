"use strict";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * User Preferences Actions (Prompt 58)
 * Handles updating user language, currency, and other preferences.
 */

export async function updateUserCurrency(currency: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
        .from('user_preferences')
        .update({
            currency,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

    if (error) {
        console.error("Error updating currency:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function updateUserLanguage(language: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
        .from('user_preferences')
        .update({
            language,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

    if (error) {
        console.error("Error updating language:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function getUserPreferences() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error("Error fetching preferences:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}
