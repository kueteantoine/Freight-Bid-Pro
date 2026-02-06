"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface AccountActionsDialogProps {
    type: 'suspend' | 'reactivate' | 'reset-password' | null;
    open: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => Promise<void>;
    userEmail?: string;
}

export default function AccountActionsDialog({
    type,
    open,
    onClose,
    onConfirm,
    userEmail,
}: AccountActionsDialogProps) {
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            await onConfirm(reason);
            setReason('');
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const getDialogContent = () => {
        switch (type) {
            case 'suspend':
                return {
                    title: 'Suspend User Account',
                    description: 'This will deactivate all user roles and prevent login.',
                    icon: <AlertTriangle className="h-12 w-12 text-red-600" />,
                    confirmText: 'Suspend Account',
                    confirmVariant: 'destructive' as const,
                    showReason: true,
                };
            case 'reactivate':
                return {
                    title: 'Reactivate User Account',
                    description: 'This will restore account access and reactivate verified roles.',
                    icon: <CheckCircle className="h-12 w-12 text-green-600" />,
                    confirmText: 'Reactivate Account',
                    confirmVariant: 'default' as const,
                    showReason: false,
                };
            case 'reset-password':
                return {
                    title: 'Reset User Password',
                    description: `A password reset link will be sent to ${userEmail}. The user will need to follow the link to set a new password.`,
                    icon: <AlertTriangle className="h-12 w-12 text-yellow-600" />,
                    confirmText: 'Send Reset Link',
                    confirmVariant: 'default' as const,
                    showReason: false,
                };
            default:
                return null;
        }
    };

    const content = getDialogContent();
    if (!content) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {content.icon}
                        {content.title}
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        {content.description}
                    </DialogDescription>
                </DialogHeader>

                {content.showReason && (
                    <div className="space-y-2 py-4">
                        <label className="text-sm font-semibold">
                            Reason for suspension <span className="text-red-600">*</span>
                        </label>
                        <Textarea
                            placeholder="Provide a reason for this action..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button
                        variant={content.confirmVariant}
                        onClick={handleConfirm}
                        disabled={processing || (content.showReason && !reason.trim())}
                    >
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {content.confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
