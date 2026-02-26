import { getLocale } from 'next-intl/server';

export const CURRENCY = 'XAF'; // Central African CFA franc

/**
 * Returns the current locale or defaults to French
 */
export async function getCurrentLocale() {
    try {
        const locale = await getLocale();
        return locale || 'fr';
    } catch (error) {
        return 'fr';
    }
}

/**
 * Formats a number as currency based on the current locale
 */
export async function formatCurrency(amount: number) {
    const locale = await getCurrentLocale();

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: CURRENCY,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Formats a date based on the current locale
 */
export async function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
    const locale = await getCurrentLocale();
    const dateObj = new Date(date);

    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj);
}

/**
 * Formats a date with time based on the current locale
 */
export async function formatDateTime(date: Date | string | number) {
    const locale = await getCurrentLocale();
    const dateObj = new Date(date);

    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
}

/**
 * Formats a standard number based on the current locale
 */
export async function formatNumber(num: number, options?: Intl.NumberFormatOptions) {
    const locale = await getCurrentLocale();

    return new Intl.NumberFormat(locale, options).format(num);
}
