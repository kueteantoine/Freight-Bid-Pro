'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// PLATFORM SETTINGS ACTIONS
// =====================================================

export async function getPlatformSettings(category?: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_platform_settings', {
            category_filter: category || null
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching platform settings:', error);
        return { success: false, error: error.message };
    }
}

export async function updatePlatformSetting(key: string, value: any, category: string, description?: string) {
    const supabase = await createClient();

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const { error } = await supabase
            .from('platform_settings')
            .upsert({
                setting_key: key,
                setting_value: value,
                setting_category: category,
                description,
                updated_by_admin_id: user.id,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating platform setting:', error);
        return { success: false, error: error.message };
    }
}
