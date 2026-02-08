'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// TYPES
// =====================================================

export type AdPlacementZone = 'dashboard_banner' | 'sidebar' | 'sponsored_listing' | 'email_newsletter';
export type AdvertiserType = 'internal_user' | 'external_business';
export type AdApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'active' | 'paused' | 'expired';

export interface Advertisement {
    id: string;
    advertiser_user_id: string;
    ad_title: string;
    ad_type: string;
    ad_placement_zone: AdPlacementZone;
    ad_content: string;
    ad_image_url?: string;
    target_url: string;
    targeting_criteria: {
        user_roles?: string[];
        regions?: string[];
        languages?: string[];
    };
    pricing_model: string;
    price_amount: number;
    start_date: string;
    end_date: string;
    approval_status: AdApprovalStatus;
    advertiser_type: AdvertiserType;
    impressions_count: number;
    clicks_count: number;
    conversions_count: number;
    total_revenue: number;
    display_priority: number;
    created_at: string;
    updated_at: string;
}

export interface CreateAdvertisementInput {
    ad_title: string;
    ad_type: string;
    ad_placement_zone: AdPlacementZone;
    ad_content: string;
    ad_image_url?: string;
    target_url: string;
    targeting_criteria?: {
        user_roles?: string[];
        regions?: string[];
        languages?: string[];
    };
    pricing_model: string;
    price_amount: number;
    cost_per_impression?: number;
    cost_per_click?: number;
    start_date: string;
    end_date: string;
    advertiser_type?: AdvertiserType;
    display_priority?: number;
    approval_status?: AdApprovalStatus;
}

// =====================================================
// AD APPROVAL QUEUE
// =====================================================

export async function getAdApprovalQueue() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_pending_ad_approvals');

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error fetching ad approval queue:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// APPROVE/REJECT ADVERTISEMENTS
// =====================================================

export async function approveAdvertisement(adId: string, notes?: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('approve_advertisement', {
            ad_id_param: adId,
            notes_param: notes || null,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        revalidatePath('/admin/advertisements');
        return { success: true };
    } catch (error: any) {
        console.error('Error approving advertisement:', error);
        return { success: false, error: error.message };
    }
}

export async function rejectAdvertisement(adId: string, reason: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('reject_advertisement', {
            ad_id_param: adId,
            reason_param: reason,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        revalidatePath('/admin/advertisements');
        return { success: true };
    } catch (error: any) {
        console.error('Error rejecting advertisement:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

export async function createAdvertisement(input: CreateAdvertisementInput) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('advertisements')
            .insert({
                advertiser_user_id: user.id,
                ad_title: input.ad_title,
                ad_type: input.ad_type,
                ad_placement_zone: input.ad_placement_zone,
                ad_content: input.ad_content,
                ad_image_url: input.ad_image_url,
                target_url: input.target_url,
                targeting_criteria: input.targeting_criteria || {},
                pricing_model: input.pricing_model,
                price_amount: input.price_amount,
                cost_per_impression: input.cost_per_impression,
                cost_per_click: input.cost_per_click,
                start_date: input.start_date,
                end_date: input.end_date,
                advertiser_type: input.advertiser_type || 'external_business',
                display_priority: input.display_priority || 0,
                approval_status: input.approval_status || 'pending_approval',
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertisements');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating advertisement:', error);
        return { success: false, error: error.message };
    }
}

export async function updateAdvertisement(adId: string, input: Partial<CreateAdvertisementInput>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('advertisements')
            .update({
                ...input,
                updated_at: new Date().toISOString(),
            })
            .eq('id', adId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertisements');
        revalidatePath(`/admin/advertisements/${adId}`);
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating advertisement:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAdvertisement(adId: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from('advertisements').delete().eq('id', adId);

        if (error) throw error;

        revalidatePath('/admin/advertisements');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting advertisement:', error);
        return { success: false, error: error.message };
    }
}

export async function pauseAdvertisement(adId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('advertisements')
            .update({ approval_status: 'paused' })
            .eq('id', adId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertisements');
        revalidatePath(`/admin/advertisements/${adId}`);
        return { success: true, data };
    } catch (error: any) {
        console.error('Error pausing advertisement:', error);
        return { success: false, error: error.message };
    }
}

export async function resumeAdvertisement(adId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('advertisements')
            .update({ approval_status: 'active' })
            .eq('id', adId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertisements');
        revalidatePath(`/admin/advertisements/${adId}`);
        return { success: true, data };
    } catch (error: any) {
        console.error('Error resuming advertisement:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// GET ADVERTISEMENTS
// =====================================================

export async function getAllAdvertisements(filters?: {
    approval_status?: AdApprovalStatus;
    placement_zone?: AdPlacementZone;
    advertiser_type?: AdvertiserType;
}) {
    const supabase = await createClient();

    try {
        let query = supabase.from('advertisements').select('*').order('created_at', { ascending: false });

        if (filters?.approval_status) {
            query = query.eq('approval_status', filters.approval_status);
        }
        if (filters?.placement_zone) {
            query = query.eq('ad_placement_zone', filters.placement_zone);
        }
        if (filters?.advertiser_type) {
            query = query.eq('advertiser_type', filters.advertiser_type);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching advertisements:', error);
        return { success: false, error: error.message };
    }
}

export async function getAdvertisementById(adId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.from('advertisements').select('*').eq('id', adId).single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching advertisement:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// AD PERFORMANCE METRICS
// =====================================================

export async function getAdPerformanceMetrics(
    adId: string,
    dateRange?: { from: string; to: string }
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_ad_performance_metrics', {
            ad_id_param: adId,
            date_from: dateRange?.from || null,
            date_to: dateRange?.to || null,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error fetching ad performance metrics:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// AD SERVING (PUBLIC-FACING)
// =====================================================

export async function getAdsForPlacement(
    zone: AdPlacementZone,
    targeting?: {
        user_role?: string;
        language?: string;
    },
    limit: number = 1
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_ads_for_placement', {
            zone,
            user_role_param: targeting?.user_role || null,
            language_param: targeting?.language || 'en',
            limit_param: limit,
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching ads for placement:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// AD TRACKING
// =====================================================

export async function trackAdImpression(adId: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase.rpc('track_ad_impression', {
            ad_id_param: adId,
        });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error tracking ad impression:', error);
        return { success: false, error: error.message };
    }
}

export async function trackAdClick(adId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('track_ad_click', {
            ad_id_param: adId,
        });

        if (error) throw error;

        return { success: true, targetUrl: data };
    } catch (error: any) {
        console.error('Error tracking ad click:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// AD REVENUE DASHBOARD
// =====================================================

export async function getAdRevenueDashboard(dateRange?: { from: string; to: string }) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_enhanced_ad_revenue_dashboard', {
            date_from: dateRange?.from || null,
            date_to: dateRange?.to || null,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error fetching ad revenue dashboard:', error);
        return { success: false, error: error.message };
    }
}

export async function getTopPerformingAds(
    metric: 'revenue' | 'ctr' | 'impressions' | 'clicks' = 'revenue',
    limit: number = 10,
    dateRange?: { from: string; to: string }
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_top_performing_ads', {
            metric_param: metric,
            limit_param: limit,
            date_from: dateRange?.from || null,
            date_to: dateRange?.to || null,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error fetching top performing ads:', error);
        return { success: false, error: error.message };
    }
}
