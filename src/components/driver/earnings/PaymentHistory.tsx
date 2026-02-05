"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    Search,
    Filter,
    ChevronRight,
    ShipWheel,
    ArrowLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PaymentHistoryProps {
    payments: any[];
    onSelectPayment: (payment: any) => void;
    onBack: () => void;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
    payments,
    onSelectPayment,
    onBack
}) => {
    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold">Payment History</h2>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search trip #"
                        className="pl-10 rounded-full bg-accent/30 border-none"
                    />
                </div>
                <Button variant="outline" size="icon" className="rounded-full">
                    <Filter className="w-4 h-4" />
                </Button>
            </div>

            {/* List */}
            <div className="space-y-3">
                {payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <ShipWheel className="w-12 h-12 opacity-20 mb-4" />
                        <p>No payments found</p>
                    </div>
                ) : (
                    payments.map((p) => (
                        <div
                            key={p.id}
                            className="bg-accent/40 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-accent/60 transition-colors"
                            onClick={() => onSelectPayment(p)}
                        >
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${p.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
                                    }`}>
                                    <ShipWheel className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-bold">Trip #{p.shipments?.shipment_number || 'N/A'}</p>
                                        <Badge variant={p.payment_status === 'completed' ? "outline" : "secondary"} className="text-[10px] py-0 h-4 px-1">
                                            {p.payment_status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <p className="text-sm font-bold">{formatCurrency(p.amount)}</p>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
