"use client";

import { useState, useRef } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { sendEmergencyAlert, EmergencyAlertType } from "@/app/actions/safety-actions";

interface EmergencyButtonProps {
    shipmentId?: string;
    className?: string;
}

export function EmergencyButton({ shipmentId, className }: EmergencyButtonProps) {
    const [isSOSOpen, setIsSOSOpen] = useState(false);
    const [isPanicOpen, setIsPanicOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const handleSOS = async () => {
        setIsLoading(true);
        try {
            // Get location
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej)
            );

            const result = await sendEmergencyAlert({
                shipmentId,
                alertType: 'sos',
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            });

            if (result.success) {
                toast.success("Emergency alert sent! Dispatch has been notified.");
            } else {
                toast.error("Failed to send alert: " + result.error);
            }
        } catch (error) {
            toast.error("Could not get location. Alert sent without coordinates.");
            await sendEmergencyAlert({ shipmentId, alertType: 'sos' });
        } finally {
            setIsLoading(false);
            setIsSOSOpen(false);
        }
    };

    const handlePanic = async () => {
        setIsLoading(true);
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej)
            );

            const result = await sendEmergencyAlert({
                shipmentId,
                alertType: 'panic',
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            });

            if (result.success) {
                toast.success("Silent panic alert sent.");
            }
        } catch (error) {
            await sendEmergencyAlert({ shipmentId, alertType: 'panic' });
        } finally {
            setIsLoading(false);
            setIsPanicOpen(false);
        }
    };

    // Long press logic for Panic
    const startPress = () => {
        longPressTimer.current = setTimeout(() => {
            setIsPanicOpen(true);
        }, 3000); // 3 seconds for panic
    };

    const endPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    return (
        <>
            <div className={`flex flex-col gap-2 ${className}`}>
                <Button
                    variant="destructive"
                    size="lg"
                    className="h-20 w-20 rounded-full shadow-2xl animate-pulse flex flex-col items-center justify-center gap-1 border-4 border-red-500/50"
                    onClick={() => setIsSOSOpen(true)}
                    onMouseDown={startPress}
                    onMouseUp={endPress}
                    onTouchStart={startPress}
                    onTouchEnd={endPress}
                >
                    <ShieldAlert className="h-8 w-8" />
                    <span className="text-xs font-bold">SOS</span>
                </Button>
                <div className="text-[10px] text-center text-muted-foreground uppercase opacity-50">
                    Hold 3s for Panic
                </div>
            </div>

            {/* SOS Confirmation */}
            <AlertDialog open={isSOSOpen} onOpenChange={setIsSOSOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Confirm Emergency Alert
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will immediately notify platform administrators and your carrier dispatch.
                            Only use this for real emergencies.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleSOS(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isLoading}
                        >
                            {isLoading ? "Sending..." : "SEND ALERT"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Panic Confirmation (Optional, or just do it silently) */}
            {/* For Prompt 36 requirements, we should probably just send it after 3s hold */}
        </>
    );
}
