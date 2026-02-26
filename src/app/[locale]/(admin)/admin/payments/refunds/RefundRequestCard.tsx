"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { approveRefundRequest, rejectRefundRequest } from "@/app/actions/admin-payment-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface RefundRequestCardProps {
    refund: {
        id: string;
        transaction_id: string;
        shipment_number: string;
        requester_email: string;
        refund_type: string;
        refund_reason: string;
        transaction_amount: number;
        evidence_urls_json: any;
        requested_at: string;
    };
}

export default function RefundRequestCard({ refund }: RefundRequestCardProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            await approveRefundRequest(refund.id, "Refund approved by admin");
            toast({
                title: "Refund Approved",
                description: "The refund request has been approved and will be processed."
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to approve refund request",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast({
                title: "Reason Required",
                description: "Please provide a reason for rejection",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);
        try {
            await rejectRefundRequest(refund.id, rejectReason);
            toast({
                title: "Refund Rejected",
                description: "The refund request has been rejected."
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reject refund request",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Refund Request - {refund.shipment_number}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Requested by {refund.requester_email} on {new Date(refund.requested_at).toLocaleDateString()}
                        </p>
                    </div>
                    <Badge variant={refund.refund_type === "full" ? "destructive" : "secondary"}>
                        {refund.refund_type === "full" ? "Full Refund" : "Partial Refund"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Transaction Amount</p>
                        <p className="text-lg font-semibold">{refund.transaction_amount.toLocaleString()} XAF</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                        <p className="text-sm font-mono">{refund.transaction_id.slice(0, 8)}...</p>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Reason</p>
                    <p className="text-sm bg-muted p-3 rounded">{refund.refund_reason}</p>
                </div>

                {refund.evidence_urls_json && Array.isArray(refund.evidence_urls_json) && refund.evidence_urls_json.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Evidence</p>
                        <div className="flex gap-2">
                            {refund.evidence_urls_json.map((url: string, idx: number) => (
                                <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Document {idx + 1}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {showRejectForm ? (
                    <div className="space-y-3 pt-2 border-t">
                        <Textarea
                            placeholder="Enter reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={isProcessing}
                                className="flex-1"
                            >
                                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Confirm Rejection
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectForm(false)}
                                disabled={isProcessing}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2 pt-2 border-t">
                        <Button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="flex-1"
                        >
                            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve Refund
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectForm(true)}
                            disabled={isProcessing}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
