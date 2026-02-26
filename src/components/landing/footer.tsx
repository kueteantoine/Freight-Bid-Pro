"use client";

import React from "react";
import Link from "next/link";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useTranslations } from "next-intl";

export function LandingFooter() {
  const t = useTranslations("landing.footer");
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container px-4 md:px-6 mx-auto flex flex-col md:h-24 items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          {t("rights")}
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link className="text-sm hover:underline underline-offset-4" href="#">
            {t("terms")}
          </Link>
          <Link className="text-sm hover:underline underline-offset-4" href="#">
            {t("privacy")}
          </Link>
        </nav>
        <MadeWithDyad />
      </div>
    </footer>
  );
}