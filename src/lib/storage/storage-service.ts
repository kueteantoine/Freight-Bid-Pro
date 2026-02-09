/**
 * Storage Service - Core file storage operations
 * Handles file uploads, downloads, deletions, and versioning
 */

import { supabase } from '@/lib/supabase/client';
import { createClient } from '@/lib/supabase/server';

export interface UploadOptions {
    bucket: string;
    path: string;
    file: File;
    compress?: boolean;
    maxSizeMB?: number;
    allowedTypes?: string[];
    metadata?: {
        category?: string;
        tags?: string[];
        relatedEntityType?: string;
        relatedEntityId?: string;
    };
}

export interface UploadResult {
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
    documentId?: string;
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
    createdAt: string;
    updatedAt: string;
}

export interface StorageQuota {
    userId: string;
    roleType?: string;
    totalQuotaBytes: number;
    usedStorageBytes: number;
    lastCalculatedAt: string;
}

/**
 * Validate file before upload
 */
export function validateFile(
    file: File,
    options: {
        maxSizeMB?: number;
        allowedTypes?: string[];
    } = {}
): { valid: boolean; error?: string } {
    const { maxSizeMB = 10, allowedTypes } = options;

    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
        return {
            valid: false,
            error: `File size exceeds ${maxSizeMB}MB limit`,
        };
    }

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        };
    }

    return { valid: true };
}

/**
 * Compress image file before upload
 */
export async function compressImage(
    file: File,
    maxWidthOrHeight: number = 1920,
    quality: number = 0.8
): Promise<File> {
    // Only compress images
    if (!file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height = (height * maxWidthOrHeight) / width;
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width = (width * maxWidthOrHeight) / height;
                        height = maxWidthOrHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    file.type,
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

/**
 * Upload file to storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
        const { bucket, path, file, compress = true, maxSizeMB = 10, allowedTypes, metadata } = options;

        // Validate file
        const validation = validateFile(file, { maxSizeMB, allowedTypes });
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // Compress if needed
        let fileToUpload = file;
        if (compress && file.type.startsWith('image/')) {
            try {
                fileToUpload = await compressImage(file);
            } catch (error) {
                console.warn('Image compression failed, uploading original:', error);
            }
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        // Upload to storage
        const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            return { success: false, error: uploadError.message };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return {
            success: true,
            url: publicUrl,
            path: filePath,
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
    files: File[],
    bucket: string,
    basePath: string,
    options?: Omit<UploadOptions, 'bucket' | 'path' | 'file'>
): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
        const result = await uploadFile({
            bucket,
            path: basePath,
            file,
            ...options,
        });
        results.push(result);
    }

    return results;
}

/**
 * Get signed URL for private file
 */
export async function getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) {
            return { error: error.message };
        }

        return { url: data.signedUrl };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Delete file from storage
 */
export async function deleteFile(
    bucket: string,
    path: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.storage.from(bucket).remove([path]);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * List files in a bucket path
 */
export async function listFiles(
    bucket: string,
    path: string = ''
): Promise<{ files?: any[]; error?: string }> {
    try {
        const { data, error } = await supabase.storage.from(bucket).list(path);

        if (error) {
            return { error: error.message };
        }

        return { files: data };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on MIME type
 */
export function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '📦';
    return '📎';
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(mimeType: string): boolean {
    return mimeType === 'application/pdf';
}

/**
 * Check if file is a document
 */
export function isDocumentFile(mimeType: string): boolean {
    return (
        mimeType.includes('word') ||
        mimeType.includes('document') ||
        mimeType.includes('sheet') ||
        mimeType.includes('excel') ||
        mimeType.includes('presentation') ||
        mimeType.includes('powerpoint') ||
        isPDFFile(mimeType)
    );
}

/**
 * Extract metadata from File object
 */
export function extractFileMetadata(file: File) {
    return {
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
    };
}

/**
 * Generate consistent file path
 */
export function generateFilePath(
    userId: string,
    category: string,
    filename: string
): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = filename.split('.').pop();
    return `${userId}/${category}/${timestamp}-${random}.${ext}`;
}
