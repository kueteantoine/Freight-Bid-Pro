"use client";

import React, { useState } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { resolveDispute, type DisputeDetails } from "@/app/actions/dispute-actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DisputeResolutionFormProps {
    dispute: DisputeDetails;
    onClose: () => void;
    onResolved: () => void;
}

export function DisputeResolutionForm({
    dispute,
    onClose,
    onResolved,
}: DisputeResolutionFormProps) {
    const [resolutionAction, setResolutionAction] = useState<string>("");
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [refundPercentage, setRefundPercentage] = useState("0");
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleSubmit = async () => {
        if (!resolutionAction || !resolutionNotes.trim()) {
            return;
        }

        setSubmitting(true);

        let actionText = resolutionAction;
        if (resolutionAction === "partial_refund") {
            actionText = `Partial Refund (${refundPercentage}%)`;
        }

        const { success, error } = await resolveDispute(
            dispute.id,
            actionText,
            resolutionNotes
        );

        setSubmitting(false);

        if (success) {
            setShowConfirmation(true);
            setTimeout(() => {
                onResolved();
            }, 2000);
        } else {
            alert(`Error: ${error}`);
        }
    };

    if (showConfirmation) {
        return (
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            Dispute Resolved!
                        </h3>
                        <p className="text-sm text-slate-500 text-center">
                            All parties have been notified of the resolution.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Resolve Dispute</DialogTitle>
                    <DialogDescription>
                        Dispute #{dispute.dispute_number} - {dispute.raised_by_email} vs.{" "}
                        {dispute.against_email}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Resolution Action */}
                    <div className="space-y-2">
                        <Label htmlFor="action" className="text-sm font-bold">
                            Resolution Action *
                        </Label>
                        <Select value={resolutionAction} onValueChange={setResolutionAction}>
                            <SelectTrigger id="action" className="h-11 rounded-xl">
                                <SelectValue placeholder="Select resolution action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full_refund">Full Refund to Shipper</SelectItem>
                                <SelectItem value="partial_refund">Partial Refund</SelectItem>
                                <SelectItem value="dismiss">Dismiss Dispute</SelectItem>
                                <SelectItem value="favor_carrier">Rule in Favor of Carrier</SelectItem>
                                <SelectItem value="favor_shipper">Rule in Favor of Shipper</SelectItem>
                                <SelectItem value="mediation">Mediation Required</SelectItem>
                                <SelectItem value="other">Other Resolution</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Refund Percentage (if partial refund) */}
                    {resolutionAction === "partial_refund" && (
                        <div className="space-y-2">
                            <Label htmlFor="refund" className="text-sm font-bold">
                                Refund Percentage
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="refund"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={refundPercentage}
                                    onChange={(e) => setRefundPercentage(e.target.value)}
                                    className="h-11 rounded-xl"
                                />
                                <span className="text-sm font-bold text-slate-600">%</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Enter the percentage of the transaction amount to refund
                            </p>
                        </div>
                    )}

                    {/* Resolution Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-bold">
                            Resolution Notes *
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Explain the reasoning for this resolution. This will be shared with both parties."
                            className="min-h-[120px] rounded-xl resize-none"
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                        />
                        <p className="text-xs text-slate-500">
                            Provide a clear explanation that will be sent to both parties
                        </p>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-900 mb-1">
                                Important Notice
                            </p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                This action cannot be undone. Both parties will be immediately
                                notified of your decision. If a refund is issued, it will be
                                processed automatically.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-xl h-11"
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700"
                        disabled={!resolutionAction || !resolutionNotes.trim() || submitting}
                    >
                        {submitting ? "Resolving..." : "Resolve Dispute"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
