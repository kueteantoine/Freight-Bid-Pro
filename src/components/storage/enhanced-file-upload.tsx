"use client";

/**
 * Enhanced File Upload Component
 * Supports drag-and-drop, multi-file upload, compression, and quota checking
 */

import React, { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, CheckCircle2, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    uploadFile,
    validateFile,
    compressImage,
    formatFileSize,
    getFileIcon,
    isImageFile,
    type UploadOptions,
    type UploadResult,
} from "@/lib/storage/storage-service";
import {
    uploadDocumentAction,
    checkStorageQuotaAction,
} from "@/app/actions/storage-actions";

interface EnhancedFileUploadProps {
    label: string;
    description?: string;
    accept?: string[];
    maxSizeMB?: number;
    onUploadComplete: (results: UploadResult[]) => void;
    bucket: string;
    path: string;
    category?: string;
    tags?: string[];
    relatedEntityType?: string;
    relatedEntityId?: string;
    disabled?: boolean;
    multiple?: boolean;
    compress?: boolean;
    showPreview?: boolean;
}

interface FileWithPreview {
    file: File;
    preview?: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    result?: UploadResult;
}

export function EnhancedFileUpload({
    label,
    description,
    accept = ["application/pdf", "image/jpeg", "image/png"],
    maxSizeMB = 10,
    onUploadComplete,
    bucket,
    path,
    category,
    tags,
    relatedEntityType,
    relatedEntityId,
    disabled = false,
    multiple = false,
    compress = true,
    showPreview = true,
}: EnhancedFileUploadProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const droppedFiles = Array.from(e.dataTransfer.files);
            handleFiles(droppedFiles);
        },
        [multiple, accept, maxSizeMB]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        handleFiles(selectedFiles);
    };

    const handleFiles = async (selectedFiles: File[]) => {
        if (!multiple && selectedFiles.length > 1) {
            toast.error("Only one file allowed");
            return;
        }

        const validFiles: FileWithPreview[] = [];

        for (const file of selectedFiles) {
            // Validate file
            const validation = validateFile(file, { maxSizeMB, allowedTypes: accept });
            if (!validation.valid) {
                toast.error(`${file.name}: ${validation.error}`);
                continue;
            }

            // Create preview for images
            let preview: string | undefined;
            if (showPreview && isImageFile(file.type)) {
                preview = URL.createObjectURL(file);
            }

            validFiles.push({
                file,
                preview,
                progress: 0,
                status: 'pending',
            });
        }

        if (validFiles.length > 0) {
            setFiles((prev) => (multiple ? [...prev, ...validFiles] : validFiles));
            // Start uploading
            uploadFiles(validFiles);
        }
    };

    const uploadFiles = async (filesToUpload: FileWithPreview[]) => {
        const results: UploadResult[] = [];

        for (let i = 0; i < filesToUpload.length; i++) {
            const fileWithPreview = filesToUpload[i];
            const { file } = fileWithPreview;

            // Update status to uploading
            setFiles((prev) =>
                prev.map((f) =>
                    f.file === file ? { ...f, status: 'uploading', progress: 10 } : f
                )
            );

            try {
                // Check quota
                const quotaCheck = await checkStorageQuotaAction(file.size);
                if (!quotaCheck.success || !quotaCheck.hasSpace) {
                    throw new Error('Storage quota exceeded');
                }

                // Upload file
                const result = await uploadFile({
                    bucket,
                    path,
                    file,
                    compress,
                    maxSizeMB,
                    allowedTypes: accept,
                    metadata: {
                        category,
                        tags,
                        relatedEntityType,
                        relatedEntityId,
                    },
                });

                if (!result.success) {
                    throw new Error(result.error);
                }

                // Create metadata record
                const metadataResult = await uploadDocumentAction({
                    bucketId: bucket,
                    filePath: result.path!,
                    filename: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    category,
                    tags,
                    relatedEntityType,
                    relatedEntityId,
                });

                if (!metadataResult.success) {
                    throw new Error(metadataResult.error);
                }

                // Update status to success
                setFiles((prev) =>
                    prev.map((f) =>
                        f.file === file
                            ? { ...f, status: 'success', progress: 100, result }
                            : f
                    )
                );

                results.push(result);
                toast.success(`${file.name} uploaded successfully`);
            } catch (error: any) {
                // Update status to error
                setFiles((prev) =>
                    prev.map((f) =>
                        f.file === file
                            ? { ...f, status: 'error', error: error.message }
                            : f
                    )
                );

                toast.error(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        // Call completion callback
        if (results.length > 0) {
            onUploadComplete(results);
        }
    };

    const removeFile = (file: File) => {
        setFiles((prev) => {
            const updated = prev.filter((f) => f.file !== file);
            // Revoke preview URL to prevent memory leaks
            const fileToRemove = prev.find((f) => f.file === file);
            if (fileToRemove?.preview) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return updated;
        });
    };

    const clearAll = () => {
        // Revoke all preview URLs
        files.forEach((f) => {
            if (f.preview) {
                URL.revokeObjectURL(f.preview);
            }
        });
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const hasSuccessfulUploads = files.some((f) => f.status === 'success');
    const isUploading = files.some((f) => f.status === 'uploading');

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <label className="text-sm font-semibold">{label}</label>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
                {hasSuccessfulUploads && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {files.filter(f => f.status === 'success').length} uploaded
                    </span>
                )}
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-muted hover:border-primary/50 bg-muted/5",
                    (disabled || isUploading) && "opacity-70 pointer-events-none grayscale"
                )}
            >
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary mb-1">
                            <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium">
                            {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {accept.map(t => t.split('/')[1].toUpperCase()).join(', ')} (max. {maxSizeMB}MB)
                        </p>
                        {multiple && <p className="text-xs text-muted-foreground">Multiple files allowed</p>}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            onChange={handleFileChange}
                            accept={accept.join(",")}
                            disabled={disabled || isUploading}
                            multiple={multiple}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {files.map((fileWithPreview, index) => (
                            <FilePreviewCard
                                key={index}
                                fileWithPreview={fileWithPreview}
                                onRemove={() => removeFile(fileWithPreview.file)}
                                showPreview={showPreview}
                            />
                        ))}
                        {multiple && !isUploading && (
                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Add More
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAll}
                                >
                                    Clear All
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept={accept.join(",")}
                                    multiple={multiple}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// File Preview Card Component
function FilePreviewCard({
    fileWithPreview,
    onRemove,
    showPreview,
}: {
    fileWithPreview: FileWithPreview;
    onRemove: () => void;
    showPreview: boolean;
}) {
    const { file, preview, progress, status, error } = fileWithPreview;

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                status === 'success' && "border-green-200 bg-green-50/30",
                status === 'error' && "border-red-200 bg-red-50/30",
                status === 'uploading' && "border-blue-200 bg-blue-50/30",
                status === 'pending' && "border-muted bg-muted/5"
            )}
        >
            {/* Preview or Icon */}
            <div className="flex-shrink-0">
                {showPreview && preview ? (
                    <img
                        src={preview}
                        alt={file.name}
                        className="h-12 w-12 rounded object-cover"
                    />
                ) : (
                    <div className="h-12 w-12 rounded bg-primary/10 text-primary flex items-center justify-center text-2xl">
                        {getFileIcon(file.type)}
                    </div>
                )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>

                {/* Progress Bar */}
                {status === 'uploading' && (
                    <div className="mt-1">
                        <Progress value={progress} className="h-1.5" />
                    </div>
                )}

                {/* Error Message */}
                {status === 'error' && error && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {error}
                    </p>
                )}
            </div>

            {/* Status Icon */}
            <div className="flex-shrink-0">
                {status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                {(status === 'pending' || status === 'success') && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
