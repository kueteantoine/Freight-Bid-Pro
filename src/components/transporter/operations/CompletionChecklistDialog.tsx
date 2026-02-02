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
import { completeShipment } from "@/app/actions/transporter-actions";
import { Shipment } from "@/lib/types/database";
import { toast } from "sonner";
import { Loader2, Camera, PenTool, CheckCircle2 } from "lucide-react";

interface CompletionChecklistDialogProps {
    shipment: Shipment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CompletionChecklistDialog({ shipment, open, onOpenChange, onSuccess }: CompletionChecklistDialogProps) {
    const [notes, setNotes] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    // In a real app, these would be file uploads
    const mockImages = ["https://placeholder.com/pod1.jpg", "https://placeholder.com/pod2.jpg"];

    const handleComplete = async () => {
        setSubmitting(true);
        try {
            await completeShipment(shipment.id, {
                notes,
                images: mockImages
            });
            toast.success("Shipment marked as delivered! Proof of delivery has been sent.");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Failed to complete shipment: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl overflow-hidden">
                <DialogHeader>
                    <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <DialogTitle className="text-2xl font-black">Shipment Completion</DialogTitle>
                    <DialogDescription className="font-medium">
                        Finalize delivery and upload proof for <span className="text-primary font-bold">{shipment.shipment_number}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all border-dashed border-2">
                            <Camera className="h-6 w-6 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Photos (0/2)</span>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all border-dashed border-2">
                            <PenTool className="h-6 w-6 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Signature</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 font-sans">Delivery Notes</Label>
                        <Textarea
                            placeholder="Any comments about the delivery or cargo condition..."
                            className="min-h-[100px] rounded-2xl bg-slate-50 border-slate-100 font-medium resize-none shadow-none focus-visible:ring-primary/20"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="bg-slate-50/50 -m-6 mt-4 p-6 flex-row gap-4">
                    <Button
                        className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 transition-all font-sans"
                        onClick={handleComplete}
                        disabled={submitting}
                    >
                        {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Complete Shipment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
