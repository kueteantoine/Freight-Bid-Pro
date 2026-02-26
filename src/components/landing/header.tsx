"use client";

import React from "react";
import Link from "next/link";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTranslations } from "next-intl";

export function LandingHeader() {
  const tAuth = useTranslations("auth");
  const tNav = useTranslations("navigation");

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
      <Link className="flex items-center justify-center gap-2" href="/">
        <Truck className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl tracking-tighter">FreightBid</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <LanguageSwitcher />
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
          {tNav("features")}
        </Link>
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
          {tAuth("login")}
        </Link>
        <Button asChild size="sm">
          <Link href="/register">{tAuth("register")}</Link>
        </Button>
      </nav>
    </header>
  );
}