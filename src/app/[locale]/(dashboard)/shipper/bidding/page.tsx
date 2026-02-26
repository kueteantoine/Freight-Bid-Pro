"use client";

import React from "react";
import { BiddingDashboard } from "@/components/shipper/bidding/BiddingDashboard";

export default function ShipperBiddingPage() {
  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Live Bidding Marketplace</h1>
        <p className="text-muted-foreground">Monitor real-time bids on your active shipments and award the best offer.</p>
      </div>
      <BiddingDashboard />
    </div>
  );
}