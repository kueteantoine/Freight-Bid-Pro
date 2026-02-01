"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    Loader2,
    Undo2,
    CheckCircle2
} from "lucide-react";
import { requestRefund } from "@/app/actions/payment-actions";
import { toast } from "sonner";

interface RefundRequestDialogProps {
    transactionId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RefundRequestDialog({ transactionId, isOpen, onClose, onSuccess }: RefundRequestDialogProps) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for the refund.");
            return;
        }

        setIsSubmitting(true);
        try {
            await requestRefund(transactionId, reason);
            setIsSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (error) {
            toast.error("Failed to submit refund request", {
                description: error instanceof Error ? error.message : "Please try again later."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !isSuccess && onClose()}>
            <DialogContent className="rounded-3xl max-w-md">
                {isSuccess ? (
                    <div className="py-10 flex flex-col items-center text-center space-y-4">
                        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-10 w-10 animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">Request Submitted</h3>
                        <p className="text-slate-500 font-medium">
                            Our team will review your refund request and get back to you within 24-48 hours.
                        </p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                <Undo2 className="h-6 w-6 text-primary" />
                                Request Refund
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium pt-2">
                                Please explain why you are requesting a refund for this transaction.
                                Refunds are subject to the platform&apos;s Terms of Service.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reason for refund</p>
                                <Textarea
                                    placeholder="e.g. Shipment was cancelled by transporter, Incorrect billing amount..."
                                    className="min-h-[120px] rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-[12px] text-amber-800 font-bold leading-relaxed">
                                    Requests are reviewed manually. Only full refunds are processed via the automated flow.
                                    Platform fees may be non-refundable depending on the reason.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="gap-3 sm:gap-0">
                            <Button
                                variant="outline"
                                className="rounded-xl font-bold h-12"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="rounded-xl font-black h-12 bg-primary px-8"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !reason.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Request"
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
