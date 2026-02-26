"use client";

import React from "react";
import { BiddingDashboard } from "@/components/shipper/bidding/BiddingDashboard";
import { useTranslations } from "next-intl";

export default function ShipperBiddingPage() {
  const t = useTranslations("shipperSubPages");

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t("liveBidding")}</h1>
        <p className="text-muted-foreground">{t("liveBiddingDesc")}</p>
      </div>
      <BiddingDashboard />
    </div>
  );
}