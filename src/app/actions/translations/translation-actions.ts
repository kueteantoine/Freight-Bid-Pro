'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const translationSchema = z.object({
    key: z.string().min(1, 'Key is required').max(255),
    namespace: z.string().min(1, 'Namespace is required').max(255),
    en_value: z.string().min(1, 'English value is required'),
    fr_value: z.string().min(1, 'French value is required'),
});

export type TranslationInput = z.infer<typeof translationSchema>;

export async function getAdminTranslations() {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { data: hasRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', user.id)
            .in('role_type', ['admin', 'super_admin'])
            .eq('is_active', true)
            .single();

        if (!hasRole) return { error: 'Unauthorized admin access' };

        const { data, error } = await supabase
            .from('translations')
            .select('*')
            .order('namespace', { ascending: true })
            .order('key', { ascending: true });

        if (error) {
            console.error('Error fetching admin translations:', error);
            return { error: 'Failed to fetch translations' };
        }

        return { translations: data };
    } catch (error) {
        console.error('Unexpected error fetching admin translations:', error);
        return { error: 'An unexpected error occurred' };
    }
}

export async function upsertTranslation(input: TranslationInput) {
    try {
        // Validate input
        const validatedData = translationSchema.parse(input);

        const supabase = await createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized', type: 'error' };

        const { data: hasRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', user.id)
            .in('role_type', ['admin', 'super_admin'])
            .eq('is_active', true)
            .single();

        if (!hasRole) return { error: 'Unauthorized admin access', type: 'error' };

        const { error } = await supabase
            .from('translations')
            .upsert({
                key: validatedData.key,
                namespace: validatedData.namespace,
                en_value: validatedData.en_value,
                fr_value: validatedData.fr_value,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key,namespace' });

        if (error) {
            console.error('Error upserting translation:', error);
            return { error: 'Failed to save translation', type: 'error' };
        }

        // Invalidate the cache across the application
        revalidateTag('translations');

        return { success: 'Translation saved successfully', type: 'success' };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message, type: 'error' };
        }
        console.error('Unexpected error upserting translation:', error);
        return { error: 'An unexpected error occurred', type: 'error' };
    }
}

export async function deleteTranslation(id: string) {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized', type: 'error' };

        const { data: hasRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', user.id)
            .in('role_type', ['admin', 'super_admin'])
            .eq('is_active', true)
            .single();

        if (!hasRole) return { error: 'Unauthorized admin access', type: 'error' };

        const { error } = await supabase
            .from('translations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting translation:', error);
            return { error: 'Failed to delete translation', type: 'error' };
        }

        // Invalidate the cache across the application
        revalidateTag('translations');

        return { success: 'Translation deleted successfully', type: 'success' };
    } catch (error) {
        console.error('Unexpected error deleting translation:', error);
        return { error: 'An unexpected error occurred', type: 'error' };
    }
}
