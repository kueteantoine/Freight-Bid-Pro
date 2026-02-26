import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import type { Metadata, Viewport } from "next";

export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string };
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'common' });

    return {
        applicationName: "Freight Bid Pro",
        title: {
            default: "Freight Bid Pro",
            template: "%s - Freight Bid Pro",
        },
        description: "Advanced freight bidding and management platform",
        appleWebApp: {
            capable: true,
            statusBarStyle: "default",
            title: "Freight Bid Pro",
        },
        formatDetection: {
            telephone: false,
        },
    };
}

export const viewport: Viewport = {
    themeColor: "#0f172a",
};

export default async function LocaleLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    // Providing all messages to the client side is the easiest way to get started
    const messages = await getMessages();

    // Configure RTL based on the locale (e.g. if Arabic is added later)
    const dir = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={dir} suppressHydrationWarning>
            <body className="antialiased h-full">
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <AnalyticsProvider>
                            {children}
                        </AnalyticsProvider>
                        <Toaster />
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
