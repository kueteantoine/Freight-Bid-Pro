'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { inviteNewAdmin } from './admin-invitation';

// =====================================================
// TYPES
// =====================================================

export type AdminRoleType = 'super_admin' | 'financial_admin' | 'content_admin' | 'ad_manager' | 'support_admin';

export interface AdminRole {
    id: string;
    role_name: AdminRoleType;
    display_name: string;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AdminPermission {
    id: string;
    permission_key: string;
    permission_name: string;
    description: string;
    category: string;
    created_at: string;
}

export interface AdminUserRole {
    id: string;
    user_id: string;
    role_name: AdminRoleType;
    assigned_by_user_id?: string;
    assigned_at: string;
    is_active: boolean;
}

export interface AuditLogEntry {
    id: string;
    user_id?: string;
    action_type: string;
    entity_type: string;
    entity_id?: string;
    action_details?: any;
    ip_address?: string;
    user_agent?: string;
    performed_at: string;
}

// =====================================================
// PERMISSION CHECKS
// =====================================================

export async function checkPermission(permissionKey: string): Promise<boolean> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('check_admin_permission', {
            permission_key_param: permissionKey,
        });

        if (error) {
            console.error('Error checking permission:', error);
            return false;
        }

        return data === true;
    } catch (error: any) {
        console.error('Error checking permission:', error);
        return false;
    }
}

export async function getAdminPermissions(userId?: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_admin_permissions', {
            user_id_param: userId || null,
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching admin permissions:', error);
        return { success: false, error: error.message };
    }
}

export async function getAdminRoles(userId?: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_admin_roles', {
            user_id_param: userId || null,
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching admin roles:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// ROLE MANAGEMENT
// =====================================================

export async function assignAdminRole(userId: string, roleName: AdminRoleType) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('assign_admin_role', {
            target_user_id: userId,
            role_name_param: roleName,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        revalidatePath('/admin/roles');
        return { success: true };
    } catch (error: any) {
        console.error('Error assigning admin role:', error);
        return { success: false, error: error.message };
    }
}

export async function revokeAdminRole(userId: string, roleName: AdminRoleType) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('revoke_admin_role', {
            target_user_id: userId,
            role_name_param: roleName,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        revalidatePath('/admin/roles');
        return { success: true };
    } catch (error: any) {
        console.error('Error revoking admin role:', error);
        return { success: false, error: error.message };
    }
}

export async function promoteExistingUserToAdmin(userId: string, roleName: AdminRoleType) {
    const supabase = await createClient();

    try {
        // 1. Ensure user has base 'admin' role in user_roles
        const { error: baseRoleError } = await supabase
            .from('user_roles')
            .upsert({
                user_id: userId,
                role_type: 'admin',
                is_active: true,
                verification_status: 'verified'
            }, {
                onConflict: 'user_id, role_type'
            });

        if (baseRoleError) throw baseRoleError;

        // 2. Assign specialized admin role
        const result = await assignAdminRole(userId, roleName);

        return result;
    } catch (error: any) {
        console.error('Error promoting user to admin:', error);
        return { success: false, error: error.message };
    }
}

export async function revokeAdminAccess(userId: string) {
    const supabase = await createClient();

    try {
        // 1. Deactivate base 'admin' role
        const { error: baseRoleError } = await supabase
            .from('user_roles')
            .update({ is_active: false })
            .eq('user_id', userId)
            .eq('role_type', 'admin');

        if (baseRoleError) throw baseRoleError;

        // 2. Deactivate all specialized admin roles
        const { error: specializedRolesError } = await supabase
            .from('admin_user_roles')
            .update({ is_active: false })
            .eq('user_id', userId);

        if (specializedRolesError) throw specializedRolesError;

        revalidatePath('/admin/roles');
        return { success: true };
    } catch (error: any) {
        console.error('Error revoking all admin access:', error);
        return { success: false, error: error.message };
    }
}

export async function findUserByEmail(email: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .maybeSingle();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error finding user by email:', error);
        return { success: false, error: error.message };
    }
}

export async function smartAddAdmin(email: string, roleName: AdminRoleType) {
    // 1. Check if user exists
    const userResult = await findUserByEmail(email);

    if (userResult.success && userResult.data) {
        // User exists, promote them
        return await promoteExistingUserToAdmin(userResult.data.id, roleName);
    } else {
        // User doesn't exist, invite them
        return await inviteNewAdmin(email, roleName);
    }
}

// =====================================================
// GET ALL ROLES AND PERMISSIONS
// =====================================================

export async function getAllAdminRoles() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('admin_roles')
            .select('*')
            .eq('is_active', true)
            .order('role_name');

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching all admin roles:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllPermissions() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('admin_permissions')
            .select('*')
            .order('category', { ascending: true })
            .order('permission_name', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching all permissions:', error);
        return { success: false, error: error.message };
    }
}

export async function getPermissionsByCategory() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('admin_permissions')
            .select('*')
            .order('category', { ascending: true })
            .order('permission_name', { ascending: true });

        if (error) throw error;

        // Group by category
        const grouped = data.reduce((acc: any, permission: AdminPermission) => {
            const category = permission.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(permission);
            return acc;
        }, {});

        return { success: true, data: grouped };
    } catch (error: any) {
        console.error('Error fetching permissions by category:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// ROLE-PERMISSION MAPPING
// =====================================================

export async function getRolePermissions(roleName: AdminRoleType) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('admin_role_permissions')
            .select('permission_key, admin_permissions(*)')
            .eq('role_name', roleName);

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching role permissions:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// ADMIN USERS
// =====================================================

export async function getAllAdminUsers() {
    const supabase = await createClient();

    try {
        // Get all users with admin roles
        const { data, error } = await supabase
            .from('admin_user_roles')
            .select(
                `
        *,
        admin_roles(role_name, display_name, description)
      `
            )
            .eq('is_active', true)
            .order('assigned_at', { ascending: false });

        if (error) throw error;

        // Group by user_id
        const grouped = data.reduce((acc: any, userRole: any) => {
            const userId = userRole.user_id;
            if (!acc[userId]) {
                acc[userId] = {
                    user_id: userId,
                    roles: [],
                };
            }
            acc[userId].roles.push({
                role_name: userRole.role_name,
                display_name: userRole.admin_roles?.display_name,
                description: userRole.admin_roles?.description,
                assigned_at: userRole.assigned_at,
            });
            return acc;
        }, {});

        return { success: true, data: Object.values(grouped) };
    } catch (error: any) {
        console.error('Error fetching admin users:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// AUDIT LOG
// =====================================================

export async function logAdminAction(
    actionType: string,
    entityType: string,
    entityId?: string,
    actionDetails?: any
) {
    const supabase = await createClient();

    try {
        const { error } = await supabase.rpc('log_admin_action', {
            action_type_param: actionType,
            entity_type_param: entityType,
            entity_id_param: entityId || null,
            action_details_param: actionDetails || null,
        });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error logging admin action:', error);
        return { success: false, error: error.message };
    }
}

export async function getAdminAuditLog(filters?: {
    user_id?: string;
    action_type?: string;
    entity_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_admin_audit_log', {
            user_id_filter: filters?.user_id || null,
            action_type_filter: filters?.action_type || null,
            entity_type_filter: filters?.entity_type || null,
            date_from: filters?.date_from || null,
            date_to: filters?.date_to || null,
            limit_param: filters?.limit || 100,
            offset_param: filters?.offset || 0,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return {
            success: true,
            data: data.data,
            total_count: data.total_count,
            limit: data.limit,
            offset: data.offset,
        };
    } catch (error: any) {
        console.error('Error fetching admin audit log:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export async function isAdmin(): Promise<boolean> {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return false;

        const { data, error } = await supabase
            .from('admin_user_roles')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .limit(1);

        if (error) {
            console.error('Error checking admin status:', error);
            return false;
        }

        return data && data.length > 0;
    } catch (error: any) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

export async function isSuperAdmin(): Promise<boolean> {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return false;

        const { data, error } = await supabase
            .from('admin_user_roles')
            .select('id')
            .eq('user_id', user.id)
            .eq('role_name', 'super_admin')
            .eq('is_active', true)
            .limit(1);

        if (error) {
            console.error('Error checking super admin status:', error);
            return false;
        }

        return data && data.length > 0;
    } catch (error: any) {
        console.error('Error checking super admin status:', error);
        return false;
    }
}

export async function requirePermission(permissionKey: string): Promise<void> {
    const hasPermission = await checkPermission(permissionKey);

    if (!hasPermission) {
        throw new Error(`Insufficient permissions: ${permissionKey} required`);
    }
}
