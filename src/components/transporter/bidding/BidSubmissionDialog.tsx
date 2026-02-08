"use client";

import React from "react";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Calculator,
    Info,
    ArrowDownCircle,
    TrendingDown,
    Wallet,
    Settings2,
    AlertTriangle,
    Zap
} from "lucide-react";
import { BidBreakdown, Shipment } from "@/lib/types/database";
import { submitBid } from "@/app/actions/bid-actions";
import { toast } from "sonner";

interface BidSubmissionDialogProps {
    shipment: Shipment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function BidSubmissionDialog({
    shipment,
    open,
    onOpenChange,
    onSuccess,
}: BidSubmissionDialogProps) {
    const [loading, setLoading] = React.useState(false);
    const [amount, setAmount] = React.useState<number>(0);
    const [breakdown, setBreakdown] = React.useState<BidBreakdown>({
        base_rate: 0,
        fuel_cost: 0,
        driver_payment: 0,
        overhead: 0,
        profit_margin: 0,
        insurance: 0,
        tolls: 0,
        other_costs: 0,
    });
    const [autoBid, setAutoBid] = React.useState({
        enabled: false,
        limit: 0,
    });

    // Calculate current total from breakdown
    const calculatedTotal = React.useMemo(() => {
        const { base_rate, fuel_cost, driver_payment, overhead, insurance, tolls, other_costs } = breakdown;
        return (
            (base_rate || 0) +
            (fuel_cost || 0) +
            (driver_payment || 0) +
            (overhead || 0) +
            (insurance || 0) +
            (tolls || 0) +
            (other_costs || 0)
        );
    }, [breakdown]);

    // Update amount when calculated total changes (or vice versa)
    React.useEffect(() => {
        if (calculatedTotal > 0) {
            setAmount(calculatedTotal);
        }
    }, [calculatedTotal]);

    const handleBreakdownChange = (field: keyof BidBreakdown, value: string) => {
        const numValue = parseFloat(value) || 0;
        setBreakdown((prev) => ({ ...prev, [field]: numValue }));
    };

    const handleSubmit = async () => {
        if (amount <= 0) {
            toast.error("Please enter a valid bid amount");
            return;
        }

        if (autoBid.enabled && autoBid.limit >= amount) {
            toast.error("Auto-bid limit must be lower than your initial bid");
            return;
        }

        setLoading(true);
        try {
            const result = await submitBid(
                shipment.id,
                amount,
                breakdown,
                {
                    enabled: autoBid.enabled,
                    limit: autoBid.enabled ? autoBid.limit : null,
                }
            );

            if (result.success) {
                toast.success("Bid submitted successfully!");
                onOpenChange(false);
                onSuccess?.();
            }
        } catch (error: any) {
            toast.error("Failed to submit bid: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const lowestBid = shipment.bids?.length
        ? Math.min(...shipment.bids.map(b => b.bid_amount))
        : 0;

    const minIncrement = 1000;
    const nextRequiredBid = lowestBid > 0 ? lowestBid - minIncrement : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0 border-none">
                <DialogHeader className="p-8 pb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black px-2 py-0.5">
                            BIDDING OPEN
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Shipment #{shipment.shipment_number}
                        </span>
                    </div>
                    <DialogTitle className="text-3xl font-black tracking-tight text-slate-900">
                        Submit Your Bid
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">
                        Review the shipment details and provide your most competitive offer.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    {/* Market Intel Card */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-slate-50 border-none rounded-2xl p-4 flex items-center gap-3">
                            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Lowest</p>
                                <p className="text-lg font-black text-slate-900">
                                    {lowestBid > 0 ? `CFA ${lowestBid.toLocaleString()}` : "No bids yet"}
                                </p>
                            </div>
                        </Card>

                        {nextRequiredBid && (
                            <Card className="bg-primary/5 border-2 border-primary/20 border-dashed rounded-2xl p-4 flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Next Target</p>
                                    <p className="text-lg font-black text-primary">
                                        CFA {nextRequiredBid.toLocaleString()}
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Bid Breakdown Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Profit Breakdown</h3>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400">Values in CFA</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600">Base Rate</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="rounded-xl h-11 bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold"
                                    onChange={(e) => handleBreakdownChange("base_rate", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600">Fuel Cost</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="rounded-xl h-11 bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold"
                                    onChange={(e) => handleBreakdownChange("fuel_cost", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600">Driver Pay</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="rounded-xl h-11 bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold"
                                    onChange={(e) => handleBreakdownChange("driver_payment", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600">Insurance & Tolls</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="rounded-xl h-11 bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold"
                                    onChange={(e) => handleBreakdownChange("insurance", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Total & Auto-Bid Section */}
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <div className="flex items-end justify-between">
                            <div className="space-y-2">
                                <Label className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-primary" />
                                    Your Total Bid
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">CFA</span>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                        className="pl-14 text-2xl font-black h-16 rounded-2xl bg-slate-50 border-slate-100 w-full focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                            <div className="text-right pb-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Profit</p>
                                <p className="text-xl font-black text-emerald-500">
                                    CFA {(breakdown.profit_margin || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Auto-Bid Settings */}
                        <Card className="p-6 border-2 border-slate-50 rounded-3xl space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Settings2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Auto-Bidding Proxy</h4>
                                        <p className="text-[10px] text-slate-500 font-medium">Sit back while we bid for you</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={autoBid.enabled}
                                    onCheckedChange={(val) => setAutoBid(prev => ({ ...prev, enabled: val }))}
                                />
                            </div>

                            {autoBid.enabled && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                            Minimum Acceptable Amount (Floor)
                                            <Info className="h-3 w-3 text-slate-400" />
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">CFA</span>
                                            <Input
                                                type="number"
                                                placeholder="Your lowest possible price"
                                                className="pl-14 rounded-xl h-12 bg-white border-slate-100 font-bold"
                                                value={autoBid.limit}
                                                onChange={(e) => setAutoBid(prev => ({ ...prev, limit: parseFloat(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 border border-amber-100/50">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-1" />
                                        <p className="text-[10px] text-amber-900 font-medium leading-relaxed">
                                            If outbid, the system will automatically lower your bid by increments (CFA 1,000)
                                            until it reaches this floor.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0">
                    <Button
                        className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-lg font-black transition-all flex items-center justify-center gap-3"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Confirm Bid Submission
                                <ArrowDownCircle className="h-5 w-5" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
