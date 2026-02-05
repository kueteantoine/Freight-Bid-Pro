"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Info,
    Receipt,
    Plus,
    Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TripEarningsBreakdownProps {
    payment: {
        id: string;
        amount: number;
        base_amount: number;
        distance_bonus: number;
        time_bonus: number;
        quality_bonus: number;
        deductions: number;
        payment_status: string;
        created_at: string;
        shipments?: {
            shipment_number: string;
            pickup_location: string;
            delivery_location: string;
        };
    };
    onBack: () => void;
}

export const TripEarningsBreakdown: React.FC<TripEarningsBreakdownProps> = ({
    payment,
    onBack
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold">Trip Earnings</h2>
            </div>

            {/* Shipment Header */}
            <div className="bg-accent/50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Shipment #</p>
                        <p className="font-bold">{payment.shipments?.shipment_number || 'N/A'}</p>
                    </div>
                    <Badge variant={payment.payment_status === 'completed' ? "default" : "secondary"}>
                        {payment.payment_status.toUpperCase()}
                    </Badge>
                </div>

                <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                        <MapPin className="w-3 h-3 text-red-500 mt-1 shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{payment.shipments?.pickup_location}</span>
                    </div>
                    <div className="flex gap-2">
                        <MapPin className="w-3 h-3 text-emerald-500 mt-1 shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{payment.shipments?.delivery_location}</span>
                    </div>
                </div>
            </div>

            {/* Main Fare */}
            <div className="text-center py-6 border-b">
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-4xl font-black text-primary">{formatCurrency(payment.amount)}</p>
            </div>

            {/* Itemized Breakdown */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Breakdown
                </h3>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Base Fare</span>
                        <span className="text-sm font-medium">{formatCurrency(payment.base_amount)}</span>
                    </div>

                    {Number(payment.distance_bonus) > 0 && (
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <span className="text-sm flex items-center gap-1.5">
                                <Plus className="w-3 h-3" />
                                Distance Bonus
                            </span>
                            <span className="text-sm font-medium">+{formatCurrency(payment.distance_bonus)}</span>
                        </div>
                    )}

                    {Number(payment.time_bonus) > 0 && (
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <span className="text-sm flex items-center gap-1.5">
                                <Plus className="w-3 h-3" />
                                On-Time Bonus
                            </span>
                            <span className="text-sm font-medium">+{formatCurrency(payment.time_bonus)}</span>
                        </div>
                    )}

                    {Number(payment.quality_bonus) > 0 && (
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <span className="text-sm flex items-center gap-1.5">
                                <Plus className="w-3 h-3" />
                                Service Quality
                            </span>
                            <span className="text-sm font-medium">+{formatCurrency(payment.quality_bonus)}</span>
                        </div>
                    )}

                    {Number(payment.deductions) > 0 && (
                        <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                            <span className="text-sm flex items-center gap-1.5">
                                <Minus className="w-3 h-3" />
                                Deductions
                            </span>
                            <span className="text-sm font-medium">-{formatCurrency(payment.deductions)}</span>
                        </div>
                    )}

                    <div className="pt-3 border-t flex justify-between items-center">
                        <span className="text-base font-bold">Net Earnings</span>
                        <span className="text-base font-black text-primary">{formatCurrency(payment.amount)}</span>
                    </div>
                </div>
            </div>

            {/* Help Note */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl flex gap-3 text-blue-700 dark:text-blue-400">
                <Info className="w-5 h-5 shrink-0" />
                <p className="text-xs leading-relaxed">
                    Earnings are credited automatically after shipment is marked as delivered and verified by the system.
                </p>
            </div>
        </div>
    );
};
