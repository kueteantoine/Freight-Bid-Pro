"use server";

import { createClient } from "@/lib/supabase/server";

export interface UserFilters {
    searchQuery?: string;
    roleFilter?: string | null;
    statusFilter?: string | null;
    verificationFilter?: string | null;
    limit?: number;
    offset?: number;
}

export interface UserDirectoryResponse {
    users: any[];
    total_count: number;
}

/**
 * Fetch all users with filters and pagination
 */
export async function getAllUsers(filters: UserFilters = {}) {
    const supabase = await createClient();

    const {
        searchQuery = '',
        roleFilter = null,
        statusFilter = null,
        verificationFilter = null,
        limit = 50,
        offset = 0
    } = filters;

    const { data, error } = await supabase.rpc('get_all_users', {
        search_query: searchQuery,
        role_filter: roleFilter,
        status_filter: statusFilter,
        verification_filter: verificationFilter,
        limit_count: limit,
        offset_count: offset
    });

    if (error) {
        console.error('Error fetching users:', error);
        throw new Error(error.message);
    }

    return data as UserDirectoryResponse;
}

/**
 * Get detailed user information
 */
export async function getUserDetails(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_user_details', {
        target_user_id: userId
    });

    if (error) {
        console.error('Error fetching user details:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Suspend user account
 */
export async function suspendUserAccount(userId: string, reason: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('suspend_user_account', {
        target_user_id: userId,
        suspension_reason: reason
    });

    if (error) {
        console.error('Error suspending account:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Reactivate user account
 */
export async function reactivateUserAccount(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('reactivate_user_account', {
        target_user_id: userId
    });

    if (error) {
        console.error('Error reactivating account:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Suspend specific user role
 */
export async function suspendUserRole(roleId: string, reason: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('suspend_user_role', {
        role_id: roleId,
        suspension_reason: reason
    });

    if (error) {
        console.error('Error suspending role:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Bulk verify documents
 */
export async function bulkVerifyDocuments(
    roleIds: string[],
    status: 'verified' | 'rejected',
    adminNote: string = ''
) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('bulk_verify_documents', {
        role_ids: roleIds,
        verification_status: status,
        admin_note: adminNote
    });

    if (error) {
        console.error('Error bulk verifying documents:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get user activity summary
 */
export async function getUserActivity(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_user_activity_summary', {
        target_user_id: userId
    });

    if (error) {
        console.error('Error fetching user activity:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Reset user password (admin action)
 * This generates a password reset link and sends it to the user's email
 */
export async function resetUserPassword(email: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
    });

    if (error) {
        console.error('Error resetting password:', error);
        throw new Error(error.message);
    }

    return { success: true, message: 'Password reset email sent successfully' };
}

/**
 * Export user data to CSV format
 */
export async function exportUserData(filters: UserFilters = {}) {
    const { users } = await getAllUsers({ ...filters, limit: 10000 });

    // Convert to CSV
    const headers = ['ID', 'Email', 'Phone', 'Status', 'Roles', 'Created At'];
    const rows = users.map(user => [
        user.id,
        user.email,
        user.phone_number || '',
        user.account_status,
        user.roles?.map((r: any) => r.role_type).join(', ') || '',
        new Date(user.created_at).toLocaleDateString()
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
}
