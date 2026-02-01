import { getShipmentDetails } from "@/app/actions/tracking-actions";
import { TrackingTimeline } from "@/components/shipper/tracking/TrackingTimeline";
import { MilestoneProgress } from "@/components/shipper/tracking/MilestoneProgress";
import { ShipmentDetailsPanel } from "@/components/shipper/tracking/ShipmentDetailsPanel";
import { ShipmentActions } from "@/components/shipper/tracking/ShipmentActions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ShipmentDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ShipmentDetailPage(props: ShipmentDetailPageProps) {
    const params = await props.params;
    const { id } = params;

    try {
        const shipment = await getShipmentDetails(id);

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/shipper/shipments">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{shipment.shipment_number}</h1>
                        <p className="text-muted-foreground">
                            {shipment.pickup_location} → {shipment.delivery_location}
                        </p>
                    </div>
                    <ShipmentActions shipment={shipment} />
                </div>

                {/* Milestone Progress */}
                <MilestoneProgress shipment={shipment} />

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <TrackingTimeline events={shipment.tracking_events} />
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-6">
                        <ShipmentDetailsPanel shipment={shipment} />
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error loading shipment:", error);
        notFound();
    }
}
