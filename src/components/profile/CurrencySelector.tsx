"use client";

import React from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

/**
 * CurrencySelector Component (Prompt 58)
 * Allows users to select their preferred display currency.
 */

export function CurrencySelector() {
    const { currentCurrency, setCurrency, config, isLoading } = useCurrency();

    if (isLoading || !config) {
        return <div className="h-10 w-32 animate-pulse bg-muted rounded-md" />;
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Display Currency
            </label>
            <Select
                value={currentCurrency}
                onValueChange={(value) => setCurrency(value)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                    {config.supported_currencies.map((code) => (
                        <SelectItem key={code} value={code}>
                            {code}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
                All internal transactions are processed in XAF.
                Other currencies are for display estimates only.
            </p>
        </div>
    );
}
