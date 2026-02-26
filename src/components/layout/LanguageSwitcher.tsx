"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Globe } from "lucide-react";

export function LanguageSwitcher() {
    const t = useTranslations("settings");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-9 w-9 opacity-50">
                <Globe className="h-4 w-4" />
            </Button>
        );
    }

    const switchLanguage = (newLocale: string) => {
        // Determine the root-relative path (removing the current locale prefix if present)
        const urlSegments = pathname.split('/');
        if (urlSegments[1] === 'en' || urlSegments[1] === 'fr') {
            urlSegments.splice(1, 1);
        }
        const newPath = `/${newLocale}${urlSegments.join('/')}`.replace('//', '/');

        startTransition(() => {
            // Set the NEXT_LOCALE cookie to persist preference
            document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;

            // Navigate to the new localized route
            router.replace(newPath);
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full focus-visible:ring-1 focus-visible:ring-inset"
                    disabled={isPending}
                >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">{t("language")}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuItem
                    onClick={() => switchLanguage("fr")}
                    className="flex items-center justify-between"
                    disabled={isPending}
                >
                    {t("french")}
                    {locale === "fr" && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => switchLanguage("en")}
                    className="flex items-center justify-between"
                    disabled={isPending}
                >
                    {t("english")}
                    {locale === "en" && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
