'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// TYPES
// =====================================================

export type ContentPageType = 'legal' | 'help' | 'marketing';
export type ContentFormat = 'html' | 'markdown' | 'plain_text';

export interface ContentPage {
    id: string;
    page_slug: string;
    page_type: ContentPageType;
    title: string;
    content: string;
    content_format: ContentFormat;
    language: string;
    meta_description?: string;
    meta_keywords?: string[];
    is_published: boolean;
    published_at?: string;
    category_id?: string;
    created_by_admin_id?: string;
    updated_by_admin_id?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateContentPageInput {
    page_slug: string;
    page_type: ContentPageType;
    title: string;
    content: string;
    content_format?: ContentFormat;
    language?: string;
    meta_description?: string;
    meta_keywords?: string[];
    category_id?: string;
}

export interface ContentVersion {
    id: string;
    page_id: string;
    version_number: number;
    content_snapshot: any;
    change_summary?: string;
    changed_by_admin_id?: string;
    created_at: string;
}

// =====================================================
// GET CONTENT PAGES
// =====================================================

export async function getContentPages(filters?: {
    page_type?: ContentPageType;
    language?: string;
    is_published?: boolean;
}) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_all_content_pages', {
            page_type_filter: filters?.page_type || null,
            language_filter: filters?.language || null,
            published_filter: filters?.is_published ?? null,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error fetching content pages:', error);
        return { success: false, error: error.message };
    }
}

export async function getContentPage(slug: string, language: string = 'en') {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_published_content', {
            slug_param: slug,
            language_param: language,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error fetching content page:', error);
        return { success: false, error: error.message };
    }
}

export async function getContentPageById(pageId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('content_pages')
            .select('*')
            .eq('id', pageId)
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching content page by ID:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// CREATE/UPDATE CONTENT
// =====================================================

export async function createContentPage(input: CreateContentPageInput) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('content_pages')
            .insert({
                page_slug: input.page_slug,
                page_type: input.page_type,
                title: input.title,
                content: input.content,
                content_format: input.content_format || 'html',
                language: input.language || 'en',
                meta_description: input.meta_description,
                meta_keywords: input.meta_keywords,
                category_id: input.category_id,
                created_by_admin_id: user.id,
                updated_by_admin_id: user.id,
                is_published: false,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/content');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating content page:', error);
        return { success: false, error: error.message };
    }
}

export async function updateContentPage(
    pageId: string,
    input: Partial<CreateContentPageInput>,
    changeSummary?: string
) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Update the content page
        const { data, error } = await supabase
            .from('content_pages')
            .update({
                ...input,
                updated_by_admin_id: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', pageId)
            .select()
            .single();

        if (error) throw error;

        // Create version (trigger will handle this automatically, but we can also call RPC)
        if (changeSummary) {
            await supabase.rpc('create_content_version', {
                page_id_param: pageId,
                change_summary_param: changeSummary,
            });
        }

        revalidatePath('/admin/content');
        revalidatePath(`/admin/content/${pageId}`);
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating content page:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteContentPage(pageId: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from('content_pages').delete().eq('id', pageId);

        if (error) throw error;

        revalidatePath('/admin/content');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting content page:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// PUBLISHING
// =====================================================

export async function publishContentPage(pageId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('publish_content', {
            page_id_param: pageId,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        revalidatePath('/admin/content');
        revalidatePath(`/admin/content/${pageId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error publishing content page:', error);
        return { success: false, error: error.message };
    }
}

export async function unpublishContentPage(pageId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('content_pages')
            .update({ is_published: false })
            .eq('id', pageId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/content');
        revalidatePath(`/admin/content/${pageId}`);
        return { success: true, data };
    } catch (error: any) {
        console.error('Error unpublishing content page:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// VERSION CONTROL
// =====================================================

export async function getContentHistory(pageId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_content_history', {
            page_id_param: pageId,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error fetching content history:', error);
        return { success: false, error: error.message };
    }
}

export async function rollbackContent(pageId: string, versionId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('rollback_content_version', {
            page_id_param: pageId,
            version_id_param: versionId,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        revalidatePath('/admin/content');
        revalidatePath(`/admin/content/${pageId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error rolling back content:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// CONTENT CATEGORIES
// =====================================================

export async function getContentCategories() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('content_categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching content categories:', error);
        return { success: false, error: error.message };
    }
}

export async function createContentCategory(input: {
    name: string;
    slug: string;
    description?: string;
    parent_category_id?: string;
    display_order?: number;
    icon?: string;
}) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('content_categories')
            .insert(input)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/content');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating content category:', error);
        return { success: false, error: error.message };
    }
}

export async function updateContentCategory(
    categoryId: string,
    input: Partial<{
        name: string;
        slug: string;
        description: string;
        parent_category_id: string;
        display_order: number;
        icon: string;
        is_active: boolean;
    }>
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('content_categories')
            .update(input)
            .eq('id', categoryId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/content');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating content category:', error);
        return { success: false, error: error.message };
    }
}
