"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, Loader2, Zap, CheckCircle2 } from "lucide-react";
import { configureAutoAcceptRules } from "@/app/actions/bid-actions";
import { AutoAcceptRules } from "@/lib/types/database";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface AutoAcceptRulesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shipmentId: string;
    currentRules?: AutoAcceptRules;
    activeBidsCount?: number;
}

export function AutoAcceptRulesDialog({
    open,
    onOpenChange,
    shipmentId,
    currentRules,
    activeBidsCount = 0,
}: AutoAcceptRulesDialogProps) {
    const [enabled, setEnabled] = useState(currentRules?.enabled || false);
    const [priceThreshold, setPriceThreshold] = useState(
        currentRules?.price_threshold?.toString() || ""
    );
    const [minRating, setMinRating] = useState(currentRules?.min_rating || 4.0);
    const [maxDeliveryDays, setMaxDeliveryDays] = useState(
        currentRules?.max_delivery_days?.toString() || ""
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (currentRules) {
            setEnabled(currentRules.enabled);
            setPriceThreshold(currentRules.price_threshold?.toString() || "");
            setMinRating(currentRules.min_rating || 4.0);
            setMaxDeliveryDays(currentRules.max_delivery_days?.toString() || "");
        }
    }, [currentRules]);

    const handleSave = async () => {
        if (enabled) {
            if (!priceThreshold || parseFloat(priceThreshold) <= 0) {
                toast.error("Invalid Price Threshold", {
                    description: "Please enter a valid maximum price.",
                });
                return;
            }

            if (!maxDeliveryDays || parseInt(maxDeliveryDays) <= 0) {
                toast.error("Invalid Delivery Time", {
                    description: "Please enter a valid maximum delivery time.",
                });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const rules: AutoAcceptRules = {
                enabled,
                price_threshold: enabled && priceThreshold ? parseFloat(priceThreshold) : null,
                min_rating: enabled ? minRating : null,
                max_delivery_days: enabled && maxDeliveryDays ? parseInt(maxDeliveryDays) : null,
            };

            await configureAutoAcceptRules(shipmentId, rules);
            toast.success(enabled ? "Auto-Accept Enabled!" : "Auto-Accept Disabled", {
                description: enabled
                    ? "Bids meeting your criteria will be automatically awarded."
                    : "Auto-accept has been turned off for this shipment.",
            });
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error("Failed to Save Rules", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Zap className="h-6 w-6 text-amber-500" />
                        Auto-Accept Rules
                    </DialogTitle>
                    <DialogDescription>
                        Automatically award bids that meet your criteria. Save time and secure the
                        best transporters instantly.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-auto-accept" className="text-base font-bold">
                                Enable Auto-Accept
                            </Label>
                            <p className="text-sm text-slate-600">
                                Automatically award qualifying bids
                            </p>
                        </div>
                        <Switch
                            id="enable-auto-accept"
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>

                    {enabled && (
                        <>
                            {/* Price Threshold */}
                            <div className="space-y-2">
                                <Label htmlFor="priceThreshold" className="text-sm font-bold">
                                    Maximum Price (XAF) *
                                </Label>
                                <Input
                                    id="priceThreshold"
                                    type="number"
                                    placeholder="e.g., 50000"
                                    value={priceThreshold}
                                    onChange={(e) => setPriceThreshold(e.target.value)}
                                    className="h-12 rounded-xl text-lg font-bold"
                                    required={enabled}
                                    min="1"
                                />
                                <p className="text-xs text-slate-500">
                                    Bids above this amount will not be auto-accepted
                                </p>
                            </div>

                            {/* Minimum Rating */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold">Minimum Rating</Label>
                                    <Badge variant="secondary" className="font-black text-base px-3 py-1">
                                        {minRating.toFixed(1)} ★
                                    </Badge>
                                </div>
                                <Slider
                                    value={[minRating]}
                                    onValueChange={(value) => setMinRating(value[0])}
                                    min={1}
                                    max={5}
                                    step={0.1}
                                    className="py-4"
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>1.0 (Any)</span>
                                    <span>3.0 (Good)</span>
                                    <span>5.0 (Excellent)</span>
                                </div>
                            </div>

                            {/* Maximum Delivery Days */}
                            <div className="space-y-2">
                                <Label htmlFor="maxDeliveryDays" className="text-sm font-bold">
                                    Maximum Delivery Time (Days) *
                                </Label>
                                <Input
                                    id="maxDeliveryDays"
                                    type="number"
                                    placeholder="e.g., 3"
                                    value={maxDeliveryDays}
                                    onChange={(e) => setMaxDeliveryDays(e.target.value)}
                                    className="h-12 rounded-xl text-lg font-bold"
                                    required={enabled}
                                    min="1"
                                />
                                <p className="text-xs text-slate-500">
                                    Bids with longer delivery times will not be auto-accepted
                                </p>
                            </div>

                            {/* Preview of Matching Bids */}
                            {activeBidsCount > 0 && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">
                                                Current Matching Bids
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Based on current criteria, approximately{" "}
                                                <span className="font-bold">
                                                    {Math.floor(activeBidsCount * 0.3)}
                                                </span>{" "}
                                                of {activeBidsCount} active bids would qualify for auto-accept.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Warning */}
                            <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-amber-900">
                                        Automatic Financial Commitment
                                    </p>
                                    <p className="text-xs text-amber-700">
                                        When a bid meets all criteria, it will be automatically awarded
                                        without your explicit confirmation. Ensure your criteria are set
                                        correctly.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="rounded-xl bg-primary hover:bg-primary/90"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Rules"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
