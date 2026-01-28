"use client";

import React from "react";
import Link from "next/link";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
      <Link className="flex items-center justify-center gap-2" href="/">
        <Truck className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl tracking-tighter">FreightBid</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
          Features
        </Link>
        <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
          Login
        </Link>
        <Button asChild size="sm">
          <Link href="/register">Get Started</Link>
        </Button>
      </nav>
    </header>
  );
}