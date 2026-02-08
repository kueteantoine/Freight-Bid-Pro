'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// TYPES
// =====================================================

export interface UserAdEligibility {
    eligible: boolean;
    reasons: string[];
    metrics?: {
        rating: number;
        completed_shipments: number;
        account_age_days: number;
        active_disputes: number;
    };
}

export interface CreateUserAdInput {
    ad_title: string;
    ad_type: string;
    ad_placement_zone: 'dashboard_banner' | 'sidebar' | 'sponsored_listing' | 'email_newsletter';
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
    start_date: string;
    end_date: string;
}

// =====================================================
// ELIGIBILITY CHECK
// =====================================================

export async function checkAdEligibility() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('check_user_ad_eligibility');

        if (error) throw error;

        return { success: true, data: data as UserAdEligibility };
    } catch (error: any) {
        console.error('Error checking ad eligibility:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// CREATE USER ADVERTISEMENT
// =====================================================

export async function createUserAdvertisement(input: CreateUserAdInput) {
    const supabase = await createClient();

    try {
        // First check eligibility
        const eligibilityCheck = await checkAdEligibility();
        if (!eligibilityCheck.success) {
            return { success: false, error: eligibilityCheck.error };
        }

        if (!eligibilityCheck.data?.eligible) {
            return {
                success: false,
                error: 'You do not meet the requirements to create advertisements',
                reasons: eligibilityCheck.data?.reasons,
            };
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check active subscription tier for limits
        const { getUserSubscriptionTier } = await import('@/lib/subscription-helpers');
        const subscription = await getUserSubscriptionTier(user.id);

        // Default limits for users without subscriptions
        const maxActiveAds = subscription?.tier?.features?.max_active_ads || 2;

        // Check active ads count (including pending)
        const { count: activeCount, error: activeCountError } = await supabase
            .from('advertisements')
            .select('*', { count: 'exact', head: true })
            .eq('advertiser_user_id', user.id)
            .in('approval_status', ['active', 'pending_approval']);

        if (activeCountError) throw activeCountError;
        if (activeCount !== null && activeCount >= maxActiveAds) {
            return {
                success: false,
                error: `Active advertisement limit reached (${maxActiveAds}). Please pause or wait for existing ads to expire, or upgrade your subscription.`
            };
        }

        // Check monthly submission count (fair use policy)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: monthlyCount, error: monthlyCountError } = await supabase
            .from('advertisements')
            .select('*', { count: 'exact', head: true })
            .eq('advertiser_user_id', user.id)
            .gte('created_at', thirtyDaysAgo.toISOString());

        if (monthlyCountError) throw monthlyCountError;
        if (monthlyCount !== null && monthlyCount >= 10) {
            return {
                success: false,
                error: 'Fair use limit reached. You can submit up to 10 advertisements per month.'
            };
        }


        // Create advertisement with pending_approval status
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
                start_date: input.start_date,
                end_date: input.end_date,
                advertiser_type: 'internal_user',
                approval_status: 'pending_approval', // Always pending for users
                display_priority: 0,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertisements');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating user advertisement:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// GET USER'S ADVERTISEMENTS
// =====================================================

export async function getUserAdvertisements(filters?: {
    approval_status?: string;
}) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        let query = supabase
            .from('advertisements')
            .select('*')
            .eq('advertiser_user_id', user.id)
            .eq('advertiser_type', 'internal_user')
            .order('created_at', { ascending: false });

        if (filters?.approval_status) {
            query = query.eq('approval_status', filters.approval_status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching user advertisements:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// UPDATE USER ADVERTISEMENT
// =====================================================

export async function updateUserAdvertisement(
    adId: string,
    updates: Partial<CreateUserAdInput>
) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check if ad belongs to user and is editable (draft or rejected)
        const { data: existingAd, error: fetchError } = await supabase
            .from('advertisements')
            .select('approval_status, advertiser_user_id')
            .eq('id', adId)
            .single();

        if (fetchError) throw fetchError;

        if (existingAd.advertiser_user_id !== user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        if (!['draft', 'rejected'].includes(existingAd.approval_status)) {
            return {
                success: false,
                error: 'Can only edit draft or rejected advertisements',
            };
        }

        // Update ad and reset to pending_approval
        const { data, error } = await supabase
            .from('advertisements')
            .update({
                ...updates,
                approval_status: 'pending_approval',
                updated_at: new Date().toISOString(),
            })
            .eq('id', adId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertisements');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating user advertisement:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// PAUSE USER ADVERTISEMENT
// =====================================================

export async function pauseUserAdvertisement(adId: string) {
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
            .update({ approval_status: 'paused' })
            .eq('id', adId)
            .eq('advertiser_user_id', user.id)
            .eq('approval_status', 'active')
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error pausing advertisement:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// RESUME USER ADVERTISEMENT
// =====================================================

export async function resumeUserAdvertisement(adId: string) {
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
            .update({ approval_status: 'active' })
            .eq('id', adId)
            .eq('advertiser_user_id', user.id)
            .eq('approval_status', 'paused')
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error resuming advertisement:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// DELETE USER ADVERTISEMENT
// =====================================================

export async function deleteUserAdvertisement(adId: string) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Only allow deletion of draft ads
        const { error } = await supabase
            .from('advertisements')
            .delete()
            .eq('id', adId)
            .eq('advertiser_user_id', user.id)
            .eq('approval_status', 'draft');

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting advertisement:', error);
        return { success: false, error: error.message };
    }
}
// =====================================================
// ADMIN: GET PENDING ADVERTISEMENTS
// =====================================================

export async function getPendingAdvertisements() {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check if user is admin
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!roleData) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const { data, error } = await supabase
            .from('advertisements')
            .select('*, user_profiles:advertiser_user_id(full_name)')
            .eq('approval_status', 'pending_approval')
            .order('created_at', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching pending advertisements:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// ADMIN: APPROVE ADVERTISEMENT
// =====================================================

export async function approveUserAdvertisement(adId: string) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check if user is admin
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!roleData) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const { data, error } = await supabase
            .from('advertisements')
            .update({
                approval_status: 'active',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
            })
            .eq('id', adId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertising/approvals');
        revalidatePath('/advertising');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error approving advertisement:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// ADMIN: REJECT ADVERTISEMENT
// =====================================================

export async function rejectUserAdvertisement(adId: string, reason: string) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check if user is admin
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!roleData) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const { data, error } = await supabase
            .from('advertisements')
            .update({
                approval_status: 'rejected',
                rejection_reason: reason,
                rejected_by: user.id,
                rejected_at: new Date().toISOString(),
            })
            .eq('id', adId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertising/approvals');
        revalidatePath('/advertising');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error rejecting advertisement:', error);
        return { success: false, error: error.message };
    }
}
