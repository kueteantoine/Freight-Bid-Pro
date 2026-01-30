"use client";

import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2, TrendingDown } from "lucide-react";
import { createCounterOffer } from "@/app/actions/bid-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CounterOfferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bidId: string;
    originalAmount: number;
    transporterName: string;
}

export function CounterOfferDialog({
    open,
    onOpenChange,
    bidId,
    originalAmount,
    transporterName,
}: CounterOfferDialogProps) {
    const [counterAmount, setCounterAmount] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = parseFloat(counterAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid Amount", {
                description: "Please enter a valid counter-offer amount.",
            });
            return;
        }

        if (amount >= originalAmount) {
            toast.error("Invalid Counter-Offer", {
                description: "Counter-offer must be lower than the original bid.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await createCounterOffer(bidId, amount, message);
            toast.success("Counter-Offer Sent!", {
                description: `Your counter-offer of XAF ${amount.toLocaleString()} has been sent to ${transporterName}.`,
            });
            onOpenChange(false);
            setCounterAmount("");
            setMessage("");
            router.refresh();
        } catch (error) {
            toast.error("Failed to Send Counter-Offer", {
                description: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const savingsAmount = originalAmount - parseFloat(counterAmount || "0");
    const savingsPercentage = ((savingsAmount / originalAmount) * 100).toFixed(1);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">
                        Make Counter-Offer
                    </DialogTitle>
                    <DialogDescription>
                        Propose a different price to {transporterName}. They can accept, reject, or
                        counter your offer.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Original Bid Display */}
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Original Bid
                        </p>
                        <p className="text-2xl font-black text-slate-900">
                            XAF {originalAmount.toLocaleString()}
                        </p>
                    </div>

                    {/* Counter Amount Input */}
                    <div className="space-y-2">
                        <Label htmlFor="counterAmount" className="text-sm font-bold">
                            Your Counter-Offer Amount (XAF)
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                id="counterAmount"
                                type="number"
                                placeholder="Enter amount"
                                value={counterAmount}
                                onChange={(e) => setCounterAmount(e.target.value)}
                                className="pl-10 h-12 rounded-xl text-lg font-bold"
                                required
                                min="1"
                                max={originalAmount - 1}
                            />
                        </div>
                        {counterAmount && parseFloat(counterAmount) > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                {parseFloat(counterAmount) < originalAmount ? (
                                    <>
                                        <TrendingDown className="h-4 w-4 text-emerald-600" />
                                        <span className="font-bold text-emerald-600">
                                            Save XAF {savingsAmount.toLocaleString()} ({savingsPercentage}%)
                                        </span>
                                    </>
                                ) : (
                                    <span className="font-bold text-red-600">
                                        Must be lower than original bid
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Optional Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-bold">
                            Message (Optional)
                        </Label>
                        <Textarea
                            id="message"
                            placeholder="Explain your counter-offer or add terms..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="rounded-xl min-h-[100px] resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-slate-500 text-right">
                            {message.length}/500 characters
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
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
                            type="submit"
                            disabled={isSubmitting || !counterAmount || parseFloat(counterAmount) >= originalAmount}
                            className="rounded-xl bg-primary hover:bg-primary/90"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Counter-Offer"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
