"use client";

import React from "react";
import { CarrierProfileForm } from "@/components/transporter/profile/CarrierProfileForm";

export default function TransporterProfilePage() {
    return (
        <div className="space-y-10 pb-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Carrier Profile</h2>
                <p className="text-slate-500 mt-1">
                    Manage your business information, operating regions, and insurance details.
                </p>
            </div>

            <CarrierProfileForm
                onSave={async (data) => {
                    console.log("Saving profile data:", data);
                    // In a real scenario, this would call a profile service
                    return new Promise((resolve) => setTimeout(resolve, 1000));
                }}
            />
        </div>
    );
}
