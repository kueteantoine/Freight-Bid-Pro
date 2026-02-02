"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { updateShipmentStatus } from "@/app/actions/transporter-actions";
import { Shipment } from "@/lib/types/database";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

interface ReportIssueDialogProps {
    shipment: Shipment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ReportIssueDialog({ shipment, open, onOpenChange, onSuccess }: ReportIssueDialogProps) {
    const [issueType, setIssueType] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    const handleReport = async () => {
        if (!issueType || !description) {
            toast.error("Please provide both the issue type and a description.");
            return;
        }

        setSubmitting(true);
        try {
            await updateShipmentStatus(shipment.id, shipment.status, "in_transit", `ISSUE: [${issueType}] ${description}`);
            toast.success("Issue reported successfully. Support and the shipper have been notified.");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Failed to report issue: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
                <DialogHeader>
                    <div className="bg-rose-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-rose-500" />
                    </div>
                    <DialogTitle className="text-2xl font-black">Report Operational Issue</DialogTitle>
                    <DialogDescription className="font-medium">
                        Describe the problem with load <span className="text-primary font-bold">{shipment.shipment_number}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 font-sans">Issue Type</Label>
                        <Select value={issueType} onValueChange={setIssueType}>
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold font-sans">
                                <SelectValue placeholder="Select type of issue" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="traffic">Heavy Traffic / Delay</SelectItem>
                                <SelectItem value="breakdown">Vehicle Breakdown</SelectItem>
                                <SelectItem value="accident">Accident</SelectItem>
                                <SelectItem value="document">Documentation Issue</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 font-sans">Detailed Description</Label>
                        <Textarea
                            placeholder="Explain the situation in detail..."
                            className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-100 font-medium resize-none shadow-none focus-visible:ring-primary/20"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        className="h-14 rounded-2xl font-bold font-sans text-slate-400"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 transition-all font-sans"
                        onClick={handleReport}
                        disabled={submitting}
                    >
                        {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Send Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
