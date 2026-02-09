'use server';

/**
 * Server Actions for Storage Operations
 * Handles document uploads, downloads, versioning, and quota management
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UploadDocumentParams {
    bucketId: string;
    filePath: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    category?: string;
    tags?: string[];
    relatedEntityType?: string;
    relatedEntityId?: string;
}

export interface DocumentMetadata {
    id: string;
    bucketId: string;
    filePath: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    tags?: string[];
    category?: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface StorageQuota {
    userId: string;
    roleType?: string;
    totalQuotaBytes: number;
    usedStorageBytes: number;
    percentageUsed: number;
    lastCalculatedAt: string;
}

/**
 * Upload document and create metadata record
 */
export async function uploadDocumentAction(params: UploadDocumentParams) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check storage quota
        const quotaCheck = await checkStorageQuotaAction(params.fileSize);
        if (!quotaCheck.success || !quotaCheck.hasSpace) {
            return {
                success: false,
                error: 'Storage quota exceeded. Please delete some files or upgrade your plan.'
            };
        }

        // Create metadata record
        const { data: metadata, error: metadataError } = await supabase
            .from('document_metadata')
            .insert({
                bucket_id: params.bucketId,
                file_path: params.filePath,
                filename: params.filename,
                file_size: params.fileSize,
                mime_type: params.mimeType,
                uploaded_by: user.id,
                category: params.category,
                tags: params.tags,
                related_entity_type: params.relatedEntityType,
                related_entity_id: params.relatedEntityId,
            })
            .select()
            .single();

        if (metadataError) {
            return { success: false, error: metadataError.message };
        }

        // Update storage quota
        await updateStorageQuotaAction();

        revalidatePath('/');

        return {
            success: true,
            documentId: metadata.id,
            message: 'Document uploaded successfully'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get signed URL for private document
 */
export async function getSignedUrlAction(
    bucketId: string,
    filePath: string,
    expiresIn: number = 3600
) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check if user has access to this document
        const { data: metadata, error: metadataError } = await supabase
            .from('document_metadata')
            .select('*')
            .eq('bucket_id', bucketId)
            .eq('file_path', filePath)
            .single();

        if (metadataError || !metadata) {
            return { success: false, error: 'Document not found' };
        }

        // Generate signed URL
        const { data, error } = await supabase.storage
            .from(bucketId)
            .createSignedUrl(filePath, expiresIn);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, url: data.signedUrl };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Soft delete document
 */
export async function deleteDocumentAction(documentId: string) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Soft delete the document
        const { error } = await supabase
            .from('document_metadata')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
            })
            .eq('id', documentId)
            .eq('uploaded_by', user.id); // Ensure user owns the document

        if (error) {
            return { success: false, error: error.message };
        }

        // Update storage quota
        await updateStorageQuotaAction();

        revalidatePath('/');

        return { success: true, message: 'Document deleted successfully' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * List documents with filters
 */
export async function listDocumentsAction(filters?: {
    bucketId?: string;
    category?: string;
    tags?: string[];
    relatedEntityType?: string;
    relatedEntityId?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
}) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        let query = supabase
            .from('document_metadata')
            .select('*', { count: 'exact' })
            .eq('uploaded_by', user.id);

        // Apply filters
        if (filters?.bucketId) {
            query = query.eq('bucket_id', filters.bucketId);
        }
        if (filters?.category) {
            query = query.eq('category', filters.category);
        }
        if (filters?.tags && filters.tags.length > 0) {
            query = query.contains('tags', filters.tags);
        }
        if (filters?.relatedEntityType) {
            query = query.eq('related_entity_type', filters.relatedEntityType);
        }
        if (filters?.relatedEntityId) {
            query = query.eq('related_entity_id', filters.relatedEntityId);
        }
        if (!filters?.includeDeleted) {
            query = query.eq('is_deleted', false);
        }

        // Pagination
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }

        // Order by creation date
        query = query.order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            documents: data as DocumentMetadata[],
            total: count || 0
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get document versions
 */
export async function getDocumentVersionsAction(documentId: string) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check if user owns the document
        const { data: metadata, error: metadataError } = await supabase
            .from('document_metadata')
            .select('*')
            .eq('id', documentId)
            .eq('uploaded_by', user.id)
            .single();

        if (metadataError || !metadata) {
            return { success: false, error: 'Document not found or access denied' };
        }

        // Get versions
        const { data: versions, error: versionsError } = await supabase
            .from('document_versions')
            .select('*')
            .eq('document_id', documentId)
            .order('version_number', { ascending: false });

        if (versionsError) {
            return { success: false, error: versionsError.message };
        }

        return { success: true, versions };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Restore document version
 */
export async function restoreDocumentVersionAction(
    documentId: string,
    versionNumber: number
) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get the version to restore
        const { data: version, error: versionError } = await supabase
            .from('document_versions')
            .select('*')
            .eq('document_id', documentId)
            .eq('version_number', versionNumber)
            .single();

        if (versionError || !version) {
            return { success: false, error: 'Version not found' };
        }

        // Update the document metadata to point to the old version
        const { error: updateError } = await supabase
            .from('document_metadata')
            .update({
                file_path: version.file_path,
                file_size: version.file_size,
                mime_type: version.mime_type,
                updated_at: new Date().toISOString(),
            })
            .eq('id', documentId)
            .eq('uploaded_by', user.id);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        revalidatePath('/');

        return { success: true, message: 'Document version restored successfully' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get storage quota for current user
 */
export async function getStorageQuotaAction(): Promise<{
    success: boolean;
    quota?: StorageQuota;
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get or create quota record
        let { data: quota, error: quotaError } = await supabase
            .from('storage_quotas')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (quotaError && quotaError.code === 'PGRST116') {
            // No quota record exists, create one
            const { data: newQuota, error: createError } = await supabase
                .from('storage_quotas')
                .insert({
                    user_id: user.id,
                    total_quota_bytes: 104857600, // 100MB default
                    used_storage_bytes: 0,
                })
                .select()
                .single();

            if (createError) {
                return { success: false, error: createError.message };
            }

            quota = newQuota;
        } else if (quotaError) {
            return { success: false, error: quotaError.message };
        }

        // Calculate percentage used
        const percentageUsed = quota
            ? (quota.used_storage_bytes / quota.total_quota_bytes) * 100
            : 0;

        return {
            success: true,
            quota: {
                userId: quota!.user_id,
                roleType: quota!.role_type,
                totalQuotaBytes: quota!.total_quota_bytes,
                usedStorageBytes: quota!.used_storage_bytes,
                percentageUsed: Math.round(percentageUsed * 100) / 100,
                lastCalculatedAt: quota!.last_calculated_at,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Check if user has enough quota for upload
 */
export async function checkStorageQuotaAction(fileSize: number): Promise<{
    success: boolean;
    hasSpace?: boolean;
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Call database function to check quota
        const { data, error } = await supabase.rpc('check_storage_quota', {
            p_user_id: user.id,
            p_file_size: fileSize,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, hasSpace: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update storage quota (recalculate usage)
 */
export async function updateStorageQuotaAction() {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Call database function to calculate usage
        const { data: usedBytes, error } = await supabase.rpc('calculate_user_storage_usage', {
            p_user_id: user.id,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Update quota record
        const { error: updateError } = await supabase
            .from('storage_quotas')
            .update({
                used_storage_bytes: usedBytes,
                last_calculated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Search documents by filename or tags
 */
export async function searchDocumentsAction(query: string) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Search by filename or tags
        const { data, error } = await supabase
            .from('document_metadata')
            .select('*')
            .eq('uploaded_by', user.id)
            .eq('is_deleted', false)
            .or(`filename.ilike.%${query}%,tags.cs.{${query}}`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, documents: data as DocumentMetadata[] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get orphaned files (admin only)
 */
export async function getOrphanedFilesAction(bucketId: string) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check if user is admin
        const { data: roles } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!roles) {
            return { success: false, error: 'Admin access required' };
        }

        // Call database function to get orphaned files
        const { data, error } = await supabase.rpc('get_orphaned_files', {
            p_bucket_id: bucketId,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, orphanedFiles: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
