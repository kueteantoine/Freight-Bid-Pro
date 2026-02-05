"use client";

import { useState } from "react";
import { AlertCircle, Wrench } from "lucide-react"; // Using Wrench from lucide-react if Tool doesn't exist
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { reportVehicleBreakdown } from "@/app/actions/safety-actions";

interface BreakdownReportDialogProps {
    vehicleId?: string;
    shipmentId?: string;
}

export function BreakdownReportDialog({ vehicleId, shipmentId }: BreakdownReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [assistanceRequested, setAssistanceRequested] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej)
            );

            const result = await reportVehicleBreakdown({
                vehicleId,
                shipmentId,
                description,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                assistanceRequested,
            });

            if (result.success) {
                toast.success("Breakdown reported. Support is being coordinated.");
                setOpen(false);
                setDescription("");
            } else {
                toast.error("Failed to report breakdown: " + result.error);
            }
        } catch (error) {
            toast.error("Could not get location. Report submitted with low priority.");
            await reportVehicleBreakdown({ vehicleId, shipmentId, description, assistanceRequested });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex flex-col h-20 w-full gap-1 border-blue-500/50 hover:bg-blue-500/10">
                    <Wrench className="h-6 w-6 text-blue-500" />
                    <span className="text-xs">Breakdown</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-blue-500" />
                            Report Vehicle Breakdown
                        </DialogTitle>
                        <DialogDescription>
                            Report a technical failure or mechanical issue with your vehicle.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Issue Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the mechanical problem (e.g. flat tire, engine overheat, battery dead)..."
                                className="min-h-[100px]"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="assistance"
                                checked={assistanceRequested}
                                onCheckedChange={(checked) => setAssistanceRequested(checked as boolean)}
                            />
                            <Label htmlFor="assistance">Request Roadside Assistance</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                            {isLoading ? "Submitting..." : "Report Breakdown"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
