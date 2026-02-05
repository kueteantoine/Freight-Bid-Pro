"use client";

import { useState } from "react";
import { DriverJob } from "@/app/actions/driver-jobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CameraCapture } from "./CameraCapture";
import { SignaturePad } from "./SignaturePad";
import { FileText, Camera, CheckCircle2, Upload, Trash2 } from "lucide-react";
import { uploadShipmentDocument, submitProofOfDelivery, ShipmentDocumentType } from "@/app/actions/driver-docs-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/utils/image-compression";

interface DocumentSectionProps {
    job: DriverJob;
}

export function DocumentSection({ job }: DocumentSectionProps) {
    const [submitting, setSubmitting] = useState(false);
    const [recipientName, setRecipientName] = useState("");
    const [podNotes, setPodNotes] = useState("");
    const [signature, setSignature] = useState<string | null>(null);

    const handlePhotoCapture = async (file: File, type: ShipmentDocumentType) => {
        setSubmitting(true);
        try {
            const compressedBlob = await compressImage(file);
            const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('shipmentId', job.shipment_id);
            formData.append('documentType', type);

            const result = await uploadShipmentDocument(formData);
            if (result.success) {
                toast.success(`${type.replace('_', ' ')} uploaded successfully`);
            } else {
                toast.error(result.error || "Upload failed");
            }
        } catch (error) {
            toast.error("An error occurred during upload");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePODSubmit = async () => {
        if (!signature || !recipientName) {
            toast.error("Please provide recipient name and signature");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('shipmentId', job.shipment_id);
            formData.append('recipientName', recipientName);
            formData.append('signature', signature);
            formData.append('notes', podNotes);

            // Get location if possible
            if ("geolocation" in navigator) {
                const pos = await new Promise<GeolocationPosition | null>((resolve) => {
                    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null));
                });
                if (pos) {
                    formData.append('latitude', pos.coords.latitude.toString());
                    formData.append('longitude', pos.coords.longitude.toString());
                }
            }

            const result = await submitProofOfDelivery(formData);
            if (result.success) {
                toast.success("Shipment delivered successfully!");
                // Optionally redirect or refresh
            } else {
                toast.error(result.error || "Submission failed");
            }
        } catch (error) {
            toast.error("An error occurred during submission");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="photos" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Photos
                </TabsTrigger>
                <TabsTrigger value="pod" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Proof of Delivery
                </TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="space-y-4 pt-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Camera className="h-5 w-5 text-primary" />
                            Shipment Photos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Pickup Cargo (Loaded)</Label>
                            <CameraCapture
                                label="Capture Loaded Cargo"
                                onCapture={(file) => handlePhotoCapture(file, 'pickup_cargo')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Delivery Cargo (Before Unload)</Label>
                            <CameraCapture
                                label="Capture Arrival Cargo"
                                onCapture={(file) => handlePhotoCapture(file, 'delivery_cargo')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Gate Pass / Documents</Label>
                            <CameraCapture
                                label="Capture Document"
                                onCapture={(file) => handlePhotoCapture(file, 'other')}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="pod" className="space-y-4 pt-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Submit Delivery Proof
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="recipient">Recipient Name</Label>
                            <Input
                                id="recipient"
                                placeholder="E.g. John Doe / Security Guard"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Recipient Signature</Label>
                            <SignaturePad
                                onSave={(sig) => setSignature(sig)}
                                onClear={() => setSignature(null)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pod-notes">Notes (Optional)</Label>
                            <Textarea
                                id="pod-notes"
                                placeholder="Any cargo damage or delivery issues?"
                                value={podNotes}
                                onChange={(e) => setPodNotes(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                            onClick={handlePODSubmit}
                            disabled={submitting || !signature || !recipientName}
                        >
                            {submitting ? "Submitting..." : "Confirm Delivery"}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
