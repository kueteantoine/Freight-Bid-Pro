"use client";

/**
 * Storage Quota Display Component
 * Shows user's storage usage with visual indicator and breakdown
 */

import React, { useEffect, useState } from "react";
import { HardDrive, AlertTriangle, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/storage/storage-service";
import { getStorageQuotaAction, type StorageQuota } from "@/app/actions/storage-actions";

export function StorageQuotaDisplay() {
    const [quota, setQuota] = useState<StorageQuota | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuota();
    }, []);

    const loadQuota = async () => {
        setLoading(true);
        const result = await getStorageQuotaAction();
        if (result.success && result.quota) {
            setQuota(result.quota);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Storage Usage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-2 bg-muted rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!quota) {
        return null;
    }

    const percentageUsed = quota.percentageUsed;
    const isNearLimit = percentageUsed >= 70;
    const isOverLimit = percentageUsed >= 90;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Storage Usage
                </CardTitle>
                <CardDescription>
                    {formatFileSize(quota.usedStorageBytes)} of {formatFileSize(quota.totalQuotaBytes)} used
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Usage</span>
                        <span className={cn(
                            "font-medium",
                            isOverLimit && "text-red-600",
                            isNearLimit && !isOverLimit && "text-yellow-600",
                            !isNearLimit && "text-green-600"
                        )}>
                            {percentageUsed.toFixed(1)}%
                        </span>
                    </div>
                    <Progress
                        value={percentageUsed}
                        className={cn(
                            "h-2",
                            isOverLimit && "[&>div]:bg-red-600",
                            isNearLimit && !isOverLimit && "[&>div]:bg-yellow-600",
                            !isNearLimit && "[&>div]:bg-green-600"
                        )}
                    />
                </div>

                {/* Warnings */}
                {isOverLimit && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            You're running out of storage space. Delete some files or upgrade your plan to continue uploading.
                        </AlertDescription>
                    </Alert>
                )}

                {isNearLimit && !isOverLimit && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            You're approaching your storage limit. Consider deleting unused files.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Storage Tips */}
                {!isOverLimit && (
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium">Storage Tips:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                            <li>Delete old or unnecessary documents</li>
                            <li>Compress images before uploading</li>
                            <li>Use PDF format for documents when possible</li>
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Compact Storage Quota Indicator
 * Smaller version for use in headers or sidebars
 */
export function StorageQuotaIndicator() {
    const [quota, setQuota] = useState<StorageQuota | null>(null);

    useEffect(() => {
        loadQuota();
    }, []);

    const loadQuota = async () => {
        const result = await getStorageQuotaAction();
        if (result.success && result.quota) {
            setQuota(result.quota);
        }
    };

    if (!quota) return null;

    const percentageUsed = quota.percentageUsed;
    const isNearLimit = percentageUsed >= 70;
    const isOverLimit = percentageUsed >= 90;

    return (
        <div className="flex items-center gap-2 text-sm">
            <HardDrive className={cn(
                "h-4 w-4",
                isOverLimit && "text-red-600",
                isNearLimit && !isOverLimit && "text-yellow-600",
                !isNearLimit && "text-muted-foreground"
            )} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <Progress
                        value={percentageUsed}
                        className={cn(
                            "h-1.5 flex-1",
                            isOverLimit && "[&>div]:bg-red-600",
                            isNearLimit && !isOverLimit && "[&>div]:bg-yellow-600",
                            !isNearLimit && "[&>div]:bg-green-600"
                        )}
                    />
                    <span className={cn(
                        "text-xs font-medium tabular-nums",
                        isOverLimit && "text-red-600",
                        isNearLimit && !isOverLimit && "text-yellow-600",
                        !isNearLimit && "text-muted-foreground"
                    )}>
                        {percentageUsed.toFixed(0)}%
                    </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    {formatFileSize(quota.usedStorageBytes)} / {formatFileSize(quota.totalQuotaBytes)}
                </p>
            </div>
        </div>
    );
}
