"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateFees } from "@/app/actions/finance-actions";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Calculator } from 'lucide-react';

export default function FeeCalculator() {
    const { convert, format } = useCurrency();
    const [bidAmount, setBidAmount] = useState<number | string>("");
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const calculate = async () => {
            if (!bidAmount || Number(bidAmount) <= 0) {
                setResult(null);
                return;
            }

            const data = await calculateFees(Number(bidAmount));
            setResult(data);
        };

        const timeout = setTimeout(calculate, 500); // Debounce
        return () => clearTimeout(timeout);
    }, [bidAmount]);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Fee Calculator
                </CardTitle>
                <CardDescription>
                    Estimate your net earnings before placing a bid.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="bid-amount">Bid Amount (XAF)</Label>
                        <Input
                            id="bid-amount"
                            type="number"
                            placeholder="e.g. 150000"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                        />
                    </div>

                    {result && (
                        <div className="mt-4 space-y-3 p-4 bg-muted/50 rounded-lg border">
                            <div className="flex justify-between text-sm">
                                <span>Platform Commission ({result.breakdown.commissionPct}%)</span>
                                <span className="text-red-500">-{format(convert(result.commission))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Aggregator Fee ({result.breakdown.aggFeePct}%)</span>
                                <span className="text-red-500">-{format(convert(result.aggFee))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>MoMo Fee ({result.breakdown.momoFeePct}%)</span>
                                <span className="text-red-500">-{format(convert(result.momoFee))}</span>
                            </div>

                            <div className="pt-3 border-t flex justify-between items-center font-bold">
                                <span>Net Earnings</span>
                                <span className="text-emerald-600 text-lg">{format(convert(result.netEarnings))}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
