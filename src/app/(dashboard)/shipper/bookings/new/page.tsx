"use client";

import React from "react";
import { ShipmentBookingForm } from "@/components/shipper/shipment-booking-form";

export default function NewBookingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Create New Shipment</h1>
        <p className="text-muted-foreground">
          Fill in the details below to post your load to our carrier network.
        </p>
      </div>
      <ShipmentBookingForm />
    </div>
  );
}