import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * Currency Service (Prompt 58)
 * Handles exchange rate fetching, caching, and currency conversion.
 */

export interface CurrencyConfig {
    base_currency: string;
    supported_currencies: string[];
    api_source: string;
    update_frequency: string;
}

export interface ExchangeRate {
    currency_code: string;
    rate_to_xaf: number;
    updated_at: string;
}

const EXCHANGE_RATE_API_URL = "https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/XAF";

export const CurrencyService = {
    /**
     * Fetches current configuration from platform_settings
     */
    async getConfig(): Promise<CurrencyConfig | null> {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('setting_value')
            .eq('setting_key', 'currency_config')
            .single();

        if (error) {
            console.error("Error fetching currency config:", error);
            return null;
        }

        return data.setting_value as CurrencyConfig;
    },

    /**
     * Fetches exchange rates from DB
     */
    async getRates(): Promise<ExchangeRate[]> {
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('*');

        if (error) {
            console.error("Error fetching exchange rates:", error);
            return [];
        }

        return data as ExchangeRate[];
    },

    /**
     * Updates exchange rates from external API
     * Note: In a production environment, this should be called by a cron job/edge function.
     * Here we provide it for manual/triggered updates.
     */
    async syncRatesFromApi(apiKey: string): Promise<{ success: boolean; error?: string }> {
        try {
            const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/XAF`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.result !== "success") {
                throw new Error(data["error-type"] || "Failed to fetch rates");
            }

            const rates = data.conversion_rates;
            const config = await this.getConfig();
            const supported = config?.supported_currencies || ["XAF", "USD", "EUR"];

            const updates = supported.map(code => {
                // The API gives rates relative to XAF (e.g., USD: 0.0016)
                // We want rate_to_xaf (e.g., USD: 610)
                // So rate_to_xaf = 1 / rates[code]
                const rateToBase = rates[code];
                const rateToXaf = rateToBase ? 1 / rateToBase : 0;

                return {
                    currency_code: code,
                    rate_to_xaf: rateToXaf,
                    updated_at: new Date().toISOString()
                };
            }).filter(u => u.rate_to_xaf > 0);

            const { error: upsertError } = await supabase
                .from('exchange_rates')
                .upsert(updates);

            if (upsertError) throw upsertError;

            return { success: true };
        } catch (error: any) {
            console.error("Error syncing rates:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Converts an amount from one currency to another using the provided rates
     */
    convert(amount: number, fromCode: string, toCode: string, rates: ExchangeRate[]): number {
        if (fromCode === toCode) return amount;

        const fromRate = rates.find(r => r.currency_code === fromCode)?.rate_to_xaf || 1;
        const toRate = rates.find(r => r.currency_code === toCode)?.rate_to_xaf || 1;

        // Convert fromCode to XAF first
        const amountInXaf = amount * fromRate;

        // Then convert XAF to toCode
        // If 1 USD = 610 XAF, then 1 XAF = 1/610 USD
        return amountInXaf / toRate;
    },

    /**
     * Formats an amount according to the currency and locale
     */
    format(amount: number, currencyCode: string, locale: string = 'fr-CM'): string {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: currencyCode === 'XAF' ? 0 : 2,
            maximumFractionDigits: currencyCode === 'XAF' ? 0 : 2,
        }).format(amount);
    }
};
