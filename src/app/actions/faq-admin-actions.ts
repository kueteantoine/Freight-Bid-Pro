"use server";

import { createClient } from "@/lib/supabase/server";

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    language: string;
    display_order: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Get all FAQs for admin (including unpublished)
 */
export async function getAllFAQsAdmin(): Promise<{
    data: FAQ[] | null;
    error: string | null;
}> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("get_all_faqs_admin");

        if (error) {
            console.error("Error fetching FAQs:", error);
            return { data: null, error: error.message };
        }

        return { data: data as FAQ[], error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { data: null, error: "An unexpected error occurred" };
    }
}

/**
 * Create new FAQ
 */
export async function createFAQ(faqData: {
    question: string;
    answer: string;
    category: string;
    language?: string;
    display_order?: number;
}): Promise<{ success: boolean; id?: string; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("create_faq", {
            question_text: faqData.question,
            answer_text: faqData.answer,
            category_text: faqData.category,
            language_code: faqData.language || "en",
            display_order_num: faqData.display_order || 0,
        });

        if (error) {
            console.error("Error creating FAQ:", error);
            return { success: false, error: error.message };
        }

        const result = data as { success: boolean; message: string; id: string };
        return {
            success: result.success,
            id: result.id,
            error: result.success ? null : result.message,
        };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Update FAQ
 */
export async function updateFAQ(
    id: string,
    faqData: {
        question: string;
        answer: string;
        category: string;
        language: string;
        is_published: boolean;
    }
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("update_faq", {
            faq_id: id,
            question_text: faqData.question,
            answer_text: faqData.answer,
            category_text: faqData.category,
            language_code: faqData.language,
            is_published_flag: faqData.is_published,
        });

        if (error) {
            console.error("Error updating FAQ:", error);
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
 * Delete FAQ
 */
export async function deleteFAQ(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("delete_faq", {
            faq_id: id,
        });

        if (error) {
            console.error("Error deleting FAQ:", error);
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
 * Toggle FAQ published status
 */
export async function toggleFAQPublished(id: string): Promise<{
    success: boolean;
    is_published?: boolean;
    error: string | null;
}> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("toggle_faq_published", {
            faq_id: id,
        });

        if (error) {
            console.error("Error toggling FAQ published:", error);
            return { success: false, error: error.message };
        }

        const result = data as { success: boolean; message: string; is_published: boolean };
        return {
            success: result.success,
            is_published: result.is_published,
            error: result.success ? null : result.message,
        };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Reorder FAQs
 */
export async function reorderFAQs(faqIds: string[]): Promise<{
    success: boolean;
    error: string | null;
}> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("reorder_faqs", {
            faq_ids: faqIds,
        });

        if (error) {
            console.error("Error reordering FAQs:", error);
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
 * Get FAQ categories
 */
export async function getFAQCategories(): Promise<{
    data: string[] | null;
    error: string | null;
}> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("faq_content")
            .select("category")
            .order("category");

        if (error) {
            return { data: null, error: error.message };
        }

        // Get unique categories
        const categories = [...new Set(data.map((item) => item.category))];
        return { data: categories, error: null };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { data: null, error: "An unexpected error occurred" };
    }
}
