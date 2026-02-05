"use client";

import { useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { reportShipmentDelay, DelayReason } from "@/app/actions/safety-actions";

interface DelayReportDialogProps {
    shipmentId: string;
}

export function DelayReportDialog({ shipmentId }: DelayReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [reason, setReason] = useState<DelayReason>("traffic");
    const [explanation, setExplanation] = useState("");
    const [delayMinutes, setDelayMinutes] = useState("30");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await reportShipmentDelay({
                shipmentId,
                reason,
                explanation,
                estimatedDelayMinutes: parseInt(delayMinutes),
            });

            if (result.success) {
                toast.success("Delay reported to dispatch and shipper.");
                setOpen(false);
                setExplanation("");
            } else {
                toast.error("Failed to report delay: " + result.error);
            }
        } catch (error) {
            toast.error("An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex flex-col h-20 w-full gap-1 border-yellow-500/50 hover:bg-yellow-500/10">
                    <Clock className="h-6 w-6 text-yellow-500" />
                    <span className="text-xs">Report Delay</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            Report Shipment Delay
                        </DialogTitle>
                        <DialogDescription>
                            Let dispatch and the shipper know about any delays on this shipment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason for Delay</Label>
                            <Select value={reason} onValueChange={(v) => setReason(v as DelayReason)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="traffic">Traffic / Road Congestion</SelectItem>
                                    <SelectItem value="vehicle_issue">Vehicle Issue (Minor)</SelectItem>
                                    <SelectItem value="weather">Weather Conditions</SelectItem>
                                    <SelectItem value="loading_delay">Loading/Unloading Delay</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="minutes">Estimated Delay (Minutes)</Label>
                            <Input
                                id="minutes"
                                type="number"
                                value={delayMinutes}
                                onChange={(e) => setDelayMinutes(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="explanation">Explanation</Label>
                            <Textarea
                                id="explanation"
                                placeholder="Describe the situation..."
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700" disabled={isLoading}>
                            {isLoading ? "Submitting..." : "Submit Delay"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
