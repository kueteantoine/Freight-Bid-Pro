"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-primary/5 to-background">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              The Future of Freight in <span className="text-primary">Cameroon</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Connect Shippers with Carriers through a real-time bidding marketplace. 
              Streamline logistics, track shipments, and secure payments with Mobile Money.
            </p>
          </div>
          <div className="space-x-4">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/register">Ship Now</Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}