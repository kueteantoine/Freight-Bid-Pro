"use client";

import { useState } from "react";
import { AlertTriangle, Camera, Upload } from "lucide-react";
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
import { reportIncident, IncidentType } from "@/app/actions/safety-actions";

interface IncidentReportDialogProps {
    shipmentId: string;
}

export function IncidentReportDialog({ shipmentId }: IncidentReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [type, setType] = useState<IncidentType>("minor_accident");
    const [description, setDescription] = useState("");
    const [locationDescription, setLocationDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Get location
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej)
            );

            const result = await reportIncident({
                shipmentId,
                incidentType: type,
                description,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                locationDescription,
            });

            if (result.success) {
                toast.success("Incident report submitted successfully.");
                setOpen(false);
                setDescription("");
                setLocationDescription("");
            } else {
                toast.error("Failed to report incident: " + result.error);
            }
        } catch (error) {
            toast.error("An error occurred during submission.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex flex-col h-20 w-full gap-1 border-orange-500/50 hover:bg-orange-500/10">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                    <span className="text-xs">Report Incident</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Incident / Accident Report
                        </DialogTitle>
                        <DialogDescription>
                            Provided detailed information about the incident. This data is critical for insurance and safety.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Incident Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as IncidentType)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="minor_accident">Minor Accident</SelectItem>
                                    <SelectItem value="major_accident">Major Accident</SelectItem>
                                    <SelectItem value="injury">Injury to Driver/Staff</SelectItem>
                                    <SelectItem value="theft">Theft / Hijack</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location Description</Label>
                            <Input
                                id="location"
                                placeholder="e.g. Near Shell station on Route 1"
                                value={locationDescription}
                                onChange={(e) => setLocationDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Detailed Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe what happened..."
                                className="min-h-[100px]"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Evidence Photos</Label>
                            <div className="flex gap-2">
                                <Button type="button" variant="secondary" className="w-full flex gap-2">
                                    <Camera className="h-4 w-4" />
                                    Take Photo
                                </Button>
                                <Button type="button" variant="secondary" className="w-full flex gap-2">
                                    <Upload className="h-4 w-4" />
                                    Upload
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                            {isLoading ? "Submitting..." : "Submit Report"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
