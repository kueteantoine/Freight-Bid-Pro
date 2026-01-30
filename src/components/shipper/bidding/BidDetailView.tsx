"use client";

import React, { useState, useEffect } from "react";
import { Bid, CarrierProfile } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    Star,
    Truck,
    Shield,
    MapPin,
    Calendar,
    DollarSign,
    TrendingUp,
    User,
    FileText,
    Award,
} from "lucide-react";
import { format } from "date-fns";
import { getCarrierProfile } from "@/app/actions/bid-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface BidDetailViewProps {
    bid: Bid;
    onAward?: () => void;
    onReject?: () => void;
    onCounterOffer?: () => void;
}

export function BidDetailView({
    bid,
    onAward,
    onReject,
    onCounterOffer,
}: BidDetailViewProps) {
    const [carrierProfile, setCarrierProfile] = useState<CarrierProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getCarrierProfile(bid.transporter_user_id);
                setCarrierProfile(profile);
            } catch (error) {
                console.error("Failed to load carrier profile:", error);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [bid.transporter_user_id]);

    if (loading) {
        return <BidDetailSkeleton />;
    }

    if (!carrierProfile) {
        return (
            <div className="p-10 text-center">
                <p className="text-muted-foreground">Failed to load carrier profile</p>
            </div>
        );
    }

    const breakdown = bid.bid_breakdown_json || {};
    const hasBreakdown = Object.keys(breakdown).length > 0;

    return (
        <div className="space-y-6">
            {/* Header with Carrier Info */}
            <Card className="rounded-3xl border-slate-100 shadow-xl overflow-hidden">
                <CardHeader className="p-6 border-b bg-gradient-to-br from-primary/5 to-accent/5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                <AvatarImage src={carrierProfile.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/20 text-primary text-xl font-black">
                                    {carrierProfile.first_name?.[0] || <User className="h-8 w-8" />}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900">
                                    {carrierProfile.first_name} {carrierProfile.last_name}
                                </CardTitle>
                                {carrierProfile.company_name && (
                                    <p className="text-sm text-slate-600 font-medium mt-1">
                                        {carrierProfile.company_name}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    <VerificationBadge status={carrierProfile.verification_status} />
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        <span className="text-sm font-bold text-slate-900">
                                            {carrierProfile.overall_rating.toFixed(1)}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            ({carrierProfile.total_reviews} reviews)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Success Rate
                            </p>
                            <p className="text-3xl font-black text-emerald-600">
                                {carrierProfile.success_rate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {carrierProfile.completed_shipments_count} trips completed
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Bid Amount */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Bid Amount
                            </p>
                            <p className="text-4xl font-black text-primary">
                                XAF {bid.bid_amount.toLocaleString()}
                            </p>
                            {bid.is_counter_offer && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                    Counter Offer
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Estimated Delivery
                            </p>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-slate-500" />
                                <p className="text-xl font-bold text-slate-900">
                                    {bid.estimated_delivery_date
                                        ? format(new Date(bid.estimated_delivery_date), "MMM dd, yyyy")
                                        : "Not specified"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bid Breakdown */}
                    {hasBreakdown && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">
                                    Cost Breakdown
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {breakdown.base_rate && (
                                        <CostItem label="Base Rate" value={breakdown.base_rate} />
                                    )}
                                    {breakdown.fuel_cost && (
                                        <CostItem label="Fuel Cost" value={breakdown.fuel_cost} />
                                    )}
                                    {breakdown.driver_payment && (
                                        <CostItem label="Driver Payment" value={breakdown.driver_payment} />
                                    )}
                                    {breakdown.overhead && (
                                        <CostItem label="Overhead" value={breakdown.overhead} />
                                    )}
                                    {breakdown.profit_margin && (
                                        <CostItem
                                            label="Profit Margin"
                                            value={breakdown.profit_margin}
                                            highlight
                                        />
                                    )}
                                    {breakdown.insurance && (
                                        <CostItem label="Insurance" value={breakdown.insurance} />
                                    )}
                                    {breakdown.tolls && <CostItem label="Tolls" value={breakdown.tolls} />}
                                    {breakdown.other_costs && (
                                        <CostItem label="Other Costs" value={breakdown.other_costs} />
                                    )}
                                </div>
                                {breakdown.notes && (
                                    <p className="text-sm text-slate-600 italic mt-2">{breakdown.notes}</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Carrier Message */}
                    {bid.bid_message && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">
                                    Transporter Message
                                </h4>
                                <Card className="p-4 bg-slate-50 border-slate-100 rounded-xl">
                                    <p className="text-sm text-slate-700 leading-relaxed italic">
                                        &quot;{bid.bid_message}&quot;
                                    </p>
                                </Card>
                            </div>
                        </>
                    )}

                    {/* Ratings Breakdown */}
                    <Separator />
                    <div className="space-y-3">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">
                            Performance Ratings
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <RatingItem
                                label="Timeliness"
                                rating={carrierProfile.rating_timeliness}
                            />
                            <RatingItem
                                label="Communication"
                                rating={carrierProfile.rating_communication}
                            />
                            <RatingItem
                                label="Freight Condition"
                                rating={carrierProfile.rating_condition}
                            />
                        </div>
                    </div>

                    {/* Fleet Information */}
                    {carrierProfile.fleet_info && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Fleet Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoItem
                                        label="Total Vehicles"
                                        value={carrierProfile.fleet_info.total_vehicles.toString()}
                                    />
                                    <InfoItem
                                        label="Vehicle Types"
                                        value={carrierProfile.fleet_info.vehicle_types.join(", ")}
                                    />
                                    {carrierProfile.fleet_info.special_features.length > 0 && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-medium text-slate-500 mb-2">
                                                Special Features
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {carrierProfile.fleet_info.special_features.map((feature) => (
                                                    <Badge
                                                        key={feature}
                                                        variant="outline"
                                                        className="bg-blue-50 text-blue-700 border-blue-200"
                                                    >
                                                        {feature}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Insurance Information */}
                    {carrierProfile.insurance_info && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Insurance Coverage
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoItem
                                        label="Provider"
                                        value={carrierProfile.insurance_info.provider}
                                    />
                                    <InfoItem
                                        label="Policy Number"
                                        value={carrierProfile.insurance_info.policy_number}
                                    />
                                    <InfoItem
                                        label="Coverage Amount"
                                        value={`XAF ${carrierProfile.insurance_info.coverage_amount.toLocaleString()}`}
                                    />
                                    <InfoItem
                                        label="Expiry Date"
                                        value={format(
                                            new Date(carrierProfile.insurance_info.expiry_date),
                                            "MMM dd, yyyy"
                                        )}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <Separator />
                    <div className="flex gap-3">
                        {onAward && (
                            <Button
                                onClick={onAward}
                                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 font-bold"
                            >
                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                Award This Bid
                            </Button>
                        )}
                        {onCounterOffer && (
                            <Button
                                onClick={onCounterOffer}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl font-bold"
                            >
                                <DollarSign className="h-5 w-5 mr-2" />
                                Counter Offer
                            </Button>
                        )}
                        {onReject && (
                            <Button
                                onClick={onReject}
                                variant="secondary"
                                className="h-12 rounded-xl font-bold"
                            >
                                Reject
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function VerificationBadge({ status }: { status: string }) {
    const config = {
        verified: {
            label: "Verified",
            className: "bg-emerald-100 text-emerald-700 border-emerald-200",
            icon: CheckCircle2,
        },
        pending: {
            label: "Pending",
            className: "bg-amber-100 text-amber-700 border-amber-200",
            icon: FileText,
        },
        rejected: {
            label: "Unverified",
            className: "bg-slate-100 text-slate-700 border-slate-200",
            icon: Award,
        },
    };

    const { label, className, icon: Icon } = config[status as keyof typeof config] || config.pending;

    return (
        <Badge variant="outline" className={`${className} font-bold text-xs px-2 py-1`}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
        </Badge>
    );
}

function CostItem({
    label,
    value,
    highlight,
}: {
    label: string;
    value: number;
    highlight?: boolean;
}) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-xs font-medium text-slate-600">{label}</span>
            <span
                className={`text-sm font-bold ${highlight ? "text-primary" : "text-slate-900"
                    }`}
            >
                {value.toLocaleString()} XAF
            </span>
        </div>
    );
}

function RatingItem({ label, rating }: { label: string; rating: number }) {
    return (
        <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-lg font-black text-slate-900">{rating.toFixed(1)}</span>
            </div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-900">{value}</p>
        </div>
    );
}

function BidDetailSkeleton() {
    return (
        <Card className="rounded-3xl border-slate-100 shadow-xl">
            <CardHeader className="p-6 border-b">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    );
}
