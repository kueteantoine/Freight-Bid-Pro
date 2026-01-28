"use client";

import React from "react";
import { Zap, Shield, Globe } from "lucide-react";

export function LandingFeatures() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Real-Time Bidding</h3>
            <p className="text-muted-foreground">
              Get the best rates through competitive bidding. Carriers compete to move your freight efficiently.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Secure Payments</h3>
            <p className="text-muted-foreground">
              Integrated with Orange Money and MTN MoMo. Automatic commission handling and itemized receipts.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Real-Time Tracking</h3>
            <p className="text-muted-foreground">
              Know exactly where your cargo is. GPS tracking and milestone updates from pickup to delivery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}