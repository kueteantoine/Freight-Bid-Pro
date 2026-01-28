"use client";

import { ShipmentBookingForm } from "@/components/shipper/shipment-booking-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewShipmentPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Shipment</h1>
                    <p className="text-muted-foreground">Fill in the details below to post a new load to the marketplace.</p>
                </div>
            </div>

            <ShipmentBookingForm />
        </div>
    );
}
