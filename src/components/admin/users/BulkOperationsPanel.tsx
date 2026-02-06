"use client";

import React from "react";
import { bulkVerifyDocuments, exportUserData } from "@/actions/admin-user-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    Download,
    X,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface BulkOperationsPanelProps {
    selectedUsers: string[];
    onClearSelection: () => void;
    onRefresh: () => void;
}

export default function BulkOperationsPanel({
    selectedUsers,
    onClearSelection,
    onRefresh,
}: BulkOperationsPanelProps) {
    const [processing, setProcessing] = React.useState(false);

    const handleBulkVerify = async (status: 'verified' | 'rejected') => {
        if (selectedUsers.length === 0) {
            toast.error('No users selected');
            return;
        }

        setProcessing(true);
        try {
            await bulkVerifyDocuments(
                selectedUsers,
                status,
                `Bulk ${status} by admin`
            );
            toast.success(`${selectedUsers.length} users ${status} successfully`);
            onClearSelection();
            onRefresh();
        } catch (error: any) {
            toast.error(`Failed to bulk ${status}: ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleExport = async () => {
        setProcessing(true);
        try {
            const csv = await exportUserData();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('User data exported successfully');
        } catch (error: any) {
            toast.error(`Failed to export: ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    if (selectedUsers.length === 0) {
        return null;
    }

    return (
        <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        Bulk Operations
                        <Badge variant="secondary">{selectedUsers.length} selected</Badge>
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        disabled={processing}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkVerify('verified')}
                        disabled={processing}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                        {processing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Bulk Approve
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkVerify('rejected')}
                        disabled={processing}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    >
                        {processing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Bulk Reject
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={processing}
                    >
                        {processing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Export Selected
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
