"use client";

import React, { useState, useEffect } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";

/**
 * CurrencyCalculator Component (Prompt 58)
 * A simple widget to convert between XAF and the selected currency.
 */

export function CurrencyCalculator() {
    const { currentCurrency, convert, format, isLoading } = useCurrency();
    const [amount, setAmount] = useState<number>(1000);
    const [converted, setConverted] = useState<number>(0);

    useEffect(() => {
        setConverted(convert(amount));
    }, [amount, currentCurrency, convert]);

    if (isLoading) return null;

    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    Currency Converter
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Amount (XAF)</label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="font-mono"
                    />
                </div>

                <div className="flex justify-center">
                    <div className="bg-muted p-1 rounded-full">
                        <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                        Estimate ({currentCurrency})
                    </label>
                    <div className="p-2 bg-primary/5 rounded-md border border-primary/10">
                        <p className="text-lg font-black text-primary">
                            {format(converted, currentCurrency)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
