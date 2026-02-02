"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Trophy,
    AlertCircle,
    Clock,
    ArrowUpRight,
    Zap,
    ChevronRight,
    MapPin
} from "lucide-react";
import { getCarrierActiveBids } from "@/app/actions/bid-actions";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { BidSubmissionDialog } from "./BidSubmissionDialog";

export function CarrierBiddingDashboard() {
    const [bids, setBids] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedShipment, setSelectedShipment] = React.useState<any>(null);

    const fetchBids = async () => {
        try {
            const data = await getCarrierActiveBids();
            setBids(data || []);
        } catch (error) {
            console.error("Failed to fetch bids:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchBids();

        // Subscribe to real-time updates for all bids by this user
        const channel = supabase
            .channel("carrier-bids")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "bids" },
                (payload) => {
                    // If the bid belongs to this user or is for a shipment they bid on, refresh
                    // For simplicity, we refresh everything for now
                    fetchBids();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-bold text-slate-400">Loading your active bids...</p>
            </div>
        );
    }

    if (bids.length === 0) {
        return (
            <div className="p-12 text-center space-y-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Zap className="h-8 w-8 text-slate-200" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">No Active Bids</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                        You haven't placed any bids yet. Head over to the Marketplace to find your next load.
                    </p>
                </div>
                <Button className="rounded-xl bg-primary px-8 font-bold">Explore Marketplace</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Auctions</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Monitoring</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase px-3 py-1">
                    {bids.filter(b => b.bid_status === "active" && b.bid_ranking === 1).length} Winning
                </Badge>
            </div>

            <div className="grid gap-4">
                {bids.map((bid) => {
                    const isWinning = bid.bid_status === "active" && bid.bid_ranking === 1;
                    const isOutbid = bid.bid_status === "outbid" || (bid.bid_status === "active" && bid.bid_ranking > 1);

                    return (
                        <Card
                            key={bid.id}
                            className={cn(
                                "rounded-3xl border-slate-100 shadow-sm transition-all overflow-hidden",
                                isWinning ? "bg-emerald-50/30 border-emerald-100" : "hover:border-primary/20"
                            )}
                        >
                            <CardContent className="p-0">
                                <div className="p-6 flex items-center justify-between gap-6">
                                    {/* Status Indicator */}
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                                            isWinning ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                        )}>
                                            {isWinning ? <Trophy className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-slate-900">#{bid.shipments.shipment_number}</h4>
                                                <Badge className={cn(
                                                    "border-none text-[9px] font-black px-2 py-0.5",
                                                    isWinning ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                )}>
                                                    {isWinning ? "WINNING" : "OUTBID"}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {bid.shipments.pickup_location} → {bid.shipments.delivery_location}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Pricing Info */}
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Bid</p>
                                            <p className="text-lg font-black text-slate-900">CFA {bid.bid_amount.toLocaleString()}</p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ranking</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-lg font-black text-slate-900">#{bid.bid_ranking || "-"}</span>
                                                {isWinning && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {isOutbid && (
                                                <Button
                                                    size="sm"
                                                    className="rounded-xl bg-primary font-bold h-10 px-6 gap-2"
                                                    onClick={() => setSelectedShipment({ ...bid.shipments, id: bid.shipment_id })}
                                                >
                                                    Rebid <ArrowUpRight className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50">
                                                <ChevronRight className="h-5 w-5 text-slate-300" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar for Auto-Bid */}
                                {bid.auto_bid_enabled && (
                                    <div className="px-6 pb-4">
                                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase mb-2">
                                            <div className="flex items-center gap-1">
                                                <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                Auto-Bid Active
                                            </div>
                                            <span>Min Floor: CFA {bid.max_auto_bid_amount?.toLocaleString()}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-400 transition-all duration-500"
                                                style={{ width: `${Math.max(10, Math.min(100, (bid.bid_amount / bid.max_auto_bid_amount) * 50))}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {selectedShipment && (
                <BidSubmissionDialog
                    shipment={selectedShipment}
                    open={!!selectedShipment}
                    onOpenChange={(open) => !open && setSelectedShipment(null)}
                    onSuccess={fetchBids}
                />
            )}
        </div>
    );
}
