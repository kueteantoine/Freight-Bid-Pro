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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2, XCircle } from "lucide-react";
import { rejectBid } from "@/app/actions/bid-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BidRejectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bidId: string;
    transporterName: string;
    bidAmount: number;
}

const REJECTION_REASONS = [
    { value: "price_too_high", label: "Price too high" },
    { value: "delivery_time_long", label: "Delivery time too long" },
    { value: "low_rating", label: "Carrier rating concerns" },
    { value: "found_better", label: "Found a better option" },
    { value: "requirements_not_met", label: "Requirements not met" },
    { value: "other", label: "Other reason" },
];

export function BidRejectionDialog({
    open,
    onOpenChange,
    bidId,
    transporterName,
    bidAmount,
}: BidRejectionDialogProps) {
    const [reason, setReason] = useState("");
    const [feedback, setFeedback] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleReject = async () => {
        if (!reason) {
            toast.error("Reason Required", {
                description: "Please select a reason for rejecting this bid.",
            });
            return;
        }

        if (!confirmed) {
            toast.error("Confirmation Required", {
                description: "Please confirm that you understand this action is final.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const reasonLabel = REJECTION_REASONS.find((r) => r.value === reason)?.label;
            const fullFeedback = feedback
                ? `${reasonLabel}: ${feedback}`
                : reasonLabel || reason;

            await rejectBid(bidId, fullFeedback);
            toast.success("Bid Rejected", {
                description: `The bid from ${transporterName} has been rejected.`,
            });
            onOpenChange(false);
            setReason("");
            setFeedback("");
            setConfirmed(false);
            router.refresh();
        } catch (error) {
            toast.error("Failed to Reject Bid", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <XCircle className="h-6 w-6 text-red-600" />
                        Reject Bid
                    </DialogTitle>
                    <DialogDescription>
                        Rejecting the bid from {transporterName} for XAF {bidAmount.toLocaleString()}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Rejection Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-bold">
                            Reason for Rejection *
                        </Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason" className="h-12 rounded-xl">
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {REJECTION_REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Optional Feedback */}
                    <div className="space-y-2">
                        <Label htmlFor="feedback" className="text-sm font-bold">
                            Additional Feedback (Optional)
                        </Label>
                        <Textarea
                            id="feedback"
                            placeholder="Provide constructive feedback to help the transporter improve..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="rounded-xl min-h-[100px] resize-none"
                            maxLength={300}
                        />
                        <p className="text-xs text-slate-500 text-right">
                            {feedback.length}/300 characters
                        </p>
                    </div>

                    {/* Warning Message */}
                    <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-red-900">
                                This action cannot be undone
                            </p>
                            <p className="text-xs text-red-700">
                                Once rejected, this bid will be permanently marked as rejected and the
                                transporter will be notified.
                            </p>
                        </div>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <Checkbox
                            id="confirm"
                            checked={confirmed}
                            onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor="confirm"
                            className="text-sm font-medium text-slate-700 cursor-pointer leading-relaxed"
                        >
                            I understand that rejecting this bid is final and cannot be reversed
                        </Label>
                    </div>
                </div>

                <DialogFooter className="gap-2 mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReject}
                        disabled={isSubmitting || !reason || !confirmed}
                        className="rounded-xl bg-red-600 hover:bg-red-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Rejecting...
                            </>
                        ) : (
                            "Confirm Rejection"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
