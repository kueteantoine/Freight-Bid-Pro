import { getShipmentDetails } from "@/app/actions/tracking-actions";
import { TrackingTimeline } from "@/components/shipper/tracking/TrackingTimeline";
import { MilestoneProgress } from "@/components/shipper/tracking/MilestoneProgress";
import { ShipmentDetailsPanel } from "@/components/shipper/tracking/ShipmentDetailsPanel";
import { ShipmentActions } from "@/components/shipper/tracking/ShipmentActions";
import { ChatWindow } from "@/components/shipper/communication/ChatWindow";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, History } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShipmentDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ShipmentDetailPage(props: ShipmentDetailPageProps) {
    const params = await props.params;
    const { id } = params;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        notFound();
    }

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
                    {/* Left Column - Tabs for Timeline and Chat */}
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs defaultValue="updates" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="updates" className="flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Tracking Updates
                                </TabsTrigger>
                                <TabsTrigger value="messages" className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Messages
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="updates" className="mt-6 space-y-6">
                                <TrackingTimeline events={shipment.tracking_events} />
                            </TabsContent>
                            <TabsContent value="messages" className="mt-6">
                                <ChatWindow
                                    shipmentId={shipment.id}
                                    currentUserId={user.id}
                                    transporterId={shipment.assigned_transporter_user_id || undefined}
                                    driverId={shipment.assigned_driver_user_id || undefined}
                                />
                            </TabsContent>
                        </Tabs>
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
