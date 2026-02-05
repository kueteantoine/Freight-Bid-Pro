"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { respondToSafetyCheckin, SafetyCheckinStatus } from "@/app/actions/safety-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SafetyCheckinPrompt() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [checkinId, setCheckinId] = useState<string | null>(null);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        // Listen for new safety check-ins assigned to the current user
        const channel = supabase
            .channel('safety_checkins')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'safety_checkins',
                },
                (payload: any) => {
                    // Check if this checkin is for the current user (this logic would be better with real-time filters if possible)
                    // For now, we manually filter or rely on the payload having the user_id
                    // In a real app, we'd use a server-side trigger to send a push notification,
                    // but for this MVP, we listen for database changes.
                    handleNewCheckin(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleNewCheckin = async (newCheckin: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && newCheckin.driver_user_id === user.id && newCheckin.status === 'pending') {
            setCheckinId(newCheckin.id);
            setOpen(true);
            // Play sound alert if possible
        }
    };

    const handleRespond = async () => {
        if (!checkinId) return;
        setIsLoading(true);

        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej)
            );

            const result = await respondToSafetyCheckin({
                checkinId,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            });

            if (result.success) {
                toast.success("Safety check-in completed. Stay safe!");
                setOpen(false);
                setCheckinId(null);
            } else {
                toast.error("Failed to submit check-in: " + result.error);
            }
        } catch (error) {
            toast.error("Could not get location. Check-in failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="border-green-500 border-2">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                        <ShieldCheck className="h-6 w-6" />
                        Safety Check-in
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-foreground font-semibold">
                        Are you safe and okay?
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                        A periodic safety check-in has been requested by dispatch. Please confirm your status.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={(e) => { e.preventDefault(); handleRespond(); }}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 h-16 text-lg font-bold w-full"
                    >
                        {isLoading ? "Responding..." : "I AM SAFE"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
