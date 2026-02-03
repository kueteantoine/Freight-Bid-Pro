"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { RejectionDialog } from "./RejectionDialog";

interface AcceptanceFooterProps {
    onAccept: () => Promise<void>;
    onReject: (reason: string) => Promise<void>;
    expiresAt?: string | null;
}

export function AcceptanceFooter({ onAccept, onReject, expiresAt }: AcceptanceFooterProps) {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [showRejectionDialog, setShowRejectionDialog] = useState(false);

    useEffect(() => {
        if (!expiresAt) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const distance = expiry - now;

            if (distance < 0) {
                setTimeLeft("Expired");
                clearInterval(interval);
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const handleAccept = async () => {
        setIsAccepting(true);
        await onAccept();
        setIsAccepting(false);
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg md:pl-64 z-50">
                <div className="max-w-2xl mx-auto flex flex-col gap-2">
                    {timeLeft && (
                        <div className="text-center text-sm font-medium text-amber-600 mb-1">
                            Expires in: {timeLeft}
                        </div>
                    )}
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => setShowRejectionDialog(true)}
                            disabled={isAccepting}
                        >
                            Reject
                        </Button>
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={handleAccept}
                            disabled={isAccepting}
                        >
                            {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Accept Job
                        </Button>
                    </div>
                </div>
            </div>

            <RejectionDialog
                open={showRejectionDialog}
                onOpenChange={setShowRejectionDialog}
                onConfirm={onReject}
            />
        </>
    );
}
