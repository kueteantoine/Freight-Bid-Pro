"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface RejectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => Promise<void>;
}

export function RejectionDialog({ open, onOpenChange, onConfirm }: RejectionDialogProps) {
    const [reason, setReason] = useState("schedule_conflict");
    const [customReason, setCustomReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        const finalReason = reason === "other" ? customReason : reason;
        await onConfirm(finalReason);
        setIsSubmitting(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reject Job Assignment</DialogTitle>
                    <DialogDescription>
                        Please let us know why you are unable to accept this job.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <RadioGroup value={reason} onValueChange={setReason}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="schedule_conflict" id="r1" />
                            <Label htmlFor="r1">Schedule conflict</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="location_too_far" id="r2" />
                            <Label htmlFor="r2">Pickup location too far</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="vehicle_issue" id="r3" />
                            <Label htmlFor="r3">Vehicle maintenance/issue</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pay_too_low" id="r4" />
                            <Label htmlFor="r4">Payment not sufficient</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="r5" />
                            <Label htmlFor="r5">Other reason</Label>
                        </div>
                    </RadioGroup>
                    {reason === "other" && (
                        <Textarea
                            placeholder="Please specify..."
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                        />
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reject Job
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
