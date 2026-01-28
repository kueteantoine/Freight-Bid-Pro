"use client";

import React from "react";
import Link from "next/link";
import { MadeWithDyad } from "@/components/made-with-dyad";

export function LandingFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container px-4 md:px-6 mx-auto flex flex-col md:h-24 items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © 2024 FreightBid. All rights reserved. Central Africa's Logistics Leader.
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link className="text-sm hover:underline underline-offset-4" href="#">
            Terms
          </Link>
          <Link className="text-sm hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
        <MadeWithDyad />
      </div>
    </footer>
  );
}