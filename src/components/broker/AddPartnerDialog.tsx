"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addShipperToNetwork, addCarrierToNetwork } from "@/lib/services/broker-actions";
import { toast } from "sonner";

interface AddPartnerDialogProps {
    type: "shipper" | "carrier";
    onClose: () => void;
    onSuccess: () => void;
}

export function AddPartnerDialog({ type, onClose, onSuccess }: AddPartnerDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        userId: "",
        commissionRate: "",
        contractDetails: "",
        serviceAreas: "",
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (type === "shipper") {
                const contractDetails = formData.contractDetails
                    ? JSON.parse(formData.contractDetails)
                    : {};

                const { error } = await addShipperToNetwork(
                    formData.userId,
                    parseFloat(formData.commissionRate),
                    contractDetails
                );

                if (error) {
                    toast.error("Failed to add shipper: " + error);
                } else {
                    toast.success("Shipper added to network successfully!");
                    onSuccess();
                }
            } else {
                const serviceAreas = formData.serviceAreas
                    ? formData.serviceAreas.split(",").map((s) => s.trim())
                    : [];

                const { error } = await addCarrierToNetwork(
                    formData.userId,
                    serviceAreas,
                    formData.notes
                );

                if (error) {
                    toast.error("Failed to add carrier: " + error);
                } else {
                    toast.success("Carrier added to network successfully!");
                    onSuccess();
                }
            }
        } catch (error: any) {
            toast.error("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        Add {type === "shipper" ? "Shipper Client" : "Carrier Partner"}
                    </DialogTitle>
                    <DialogDescription>
                        Add a new {type} to your network. You'll need their user ID from the platform.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="userId">User ID *</Label>
                        <Input
                            id="userId"
                            placeholder="Enter user ID (UUID)"
                            value={formData.userId}
                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            The platform user ID of the {type}
                        </p>
                    </div>

                    {type === "shipper" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
                                <Input
                                    id="commissionRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 10"
                                    value={formData.commissionRate}
                                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contractDetails">Contract Details (JSON)</Label>
                                <Textarea
                                    id="contractDetails"
                                    placeholder='{"renewal_date": "2026-12-31", "terms": "..."}'
                                    value={formData.contractDetails}
                                    onChange={(e) => setFormData({ ...formData, contractDetails: e.target.value })}
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Optional: Enter contract details as JSON
                                </p>
                            </div>
                        </>
                    )}

                    {type === "carrier" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="serviceAreas">Service Areas</Label>
                                <Input
                                    id="serviceAreas"
                                    placeholder="Douala, Yaoundé, Bafoussam"
                                    value={formData.serviceAreas}
                                    onChange={(e) => setFormData({ ...formData, serviceAreas: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Comma-separated list of regions/cities
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add any notes about this carrier..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Partner"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
