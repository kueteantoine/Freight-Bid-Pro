"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CurrencyService, ExchangeRate, CurrencyConfig } from "@/lib/services/currency-service";
import { useUserData } from "@/hooks/use-user-data";
import { updateUserCurrency } from "@/app/actions/user-preferences-actions";
import { toast } from "sonner";

interface CurrencyContextType {
    currentCurrency: string;
    rates: ExchangeRate[];
    config: CurrencyConfig | null;
    isLoading: boolean;
    setCurrency: (code: string) => Promise<void>;
    convert: (amount: number, from?: string) => number;
    format: (amount: number, code?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const { preferences, isLoading: userLoading } = useUserData();
    const [currentCurrency, setCurrentCurrency] = useState<string>("XAF");
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [config, setConfig] = useState<CurrencyConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load
    useEffect(() => {
        async function init() {
            try {
                const [dbRates, dbConfig] = await Promise.all([
                    CurrencyService.getRates(),
                    CurrencyService.getConfig()
                ]);
                setRates(dbRates);
                setConfig(dbConfig);
            } catch (error) {
                console.error("Failed to initialize currency context:", error);
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, []);

    // Sync with user preferences
    useEffect(() => {
        if (preferences?.currency) {
            setCurrentCurrency(preferences.currency);
        }
    }, [preferences?.currency]);

    const setCurrency = useCallback(async (code: string) => {
        try {
            const result = await updateUserCurrency(code);
            if (result.success) {
                setCurrentCurrency(code);
                toast.success(`Currency changed to ${code}`);
            } else {
                toast.error("Failed to update currency preference");
            }
        } catch (error) {
            toast.error("An error occurred while updating currency");
        }
    }, []);

    const convert = useCallback((amount: number, from: string = "XAF") => {
        return CurrencyService.convert(amount, from, currentCurrency, rates);
    }, [currentCurrency, rates]);

    const format = useCallback((amount: number, code: string = currentCurrency) => {
        return CurrencyService.format(amount, code);
    }, [currentCurrency]);

    return (
        <CurrencyContext.Provider value={{
            currentCurrency,
            rates,
            config,
            isLoading: isLoading || userLoading,
            setCurrency,
            convert,
            format
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
