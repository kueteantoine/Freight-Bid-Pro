"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTransporterOperations, updateShipmentStatus } from "@/app/actions/transporter-actions";
import { Shipment } from "@/lib/types/database";
import { ShipmentOperationsCard } from "@/components/transporter/operations/ShipmentOperationsCard";
import { toast } from "sonner";
import { Loader2, PackageSearch } from "lucide-react";
import { DriverDispatchDialog } from "@/components/transporter/operations/DriverDispatchDialog";
import { ReportIssueDialog } from "@/components/transporter/operations/ReportIssueDialog";
import { CompletionChecklistDialog } from "@/components/transporter/operations/CompletionChecklistDialog";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const FleetTrackingMap = dynamic(
    () => import("@/components/transporter/operations/FleetTrackingMap").then((mod) => mod.FleetTrackingMap),
    {
        ssr: false,
        loading: () => <div className="h-[600px] flex items-center justify-center bg-slate-50 rounded-xl">Loading map...</div>
    }
);

export default function TransporterOperationsPage() {
    const [shipments, setShipments] = React.useState<Shipment[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState("ongoing");
    const [dispatchShipment, setDispatchShipment] = React.useState<Shipment | null>(null);
    const [issueShipment, setIssueShipment] = React.useState<Shipment | null>(null);
    const [completeShipment, setCompleteShipment] = React.useState<Shipment | null>(null);
    const t = useTranslations("transporter.operations");

    const fetchOperations = async () => {
        try {
            setLoading(true);
            const data = await getTransporterOperations();
            setShipments(data);
        } catch (error) {
            toast.error("Failed to load operations");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchOperations();
    }, []);

    const ongoingShipments = shipments.filter(s =>
        ["bid_awarded", "in_transit"].includes(s.status)
    );
    const completedShipments = shipments.filter(s => s.status === "delivered");

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 space-y-8" id="operations-page">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("subtitle")}</p>
                </div>
            </div>

            <Tabs defaultValue="ongoing" className="w-full" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <TabsList>
                        <TabsTrigger value="ongoing">{t("tabs.ongoing")} ({ongoingShipments.length})</TabsTrigger>
                        <TabsTrigger value="completed">{t("tabs.completed")} ({completedShipments.length})</TabsTrigger>
                        <TabsTrigger value="map">{t("tabs.mapView")}</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="ongoing" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {ongoingShipments.length > 0 ? (
                            ongoingShipments.map((shipment) => (
                                <ShipmentOperationsCard
                                    key={shipment.id}
                                    shipment={shipment}
                                    onDispatch={() => setDispatchShipment(shipment)}
                                    onReportIssue={() => setIssueShipment(shipment)}
                                    onComplete={() => setCompleteShipment(shipment)}
                                    onSuccess={fetchOperations}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
                                <PackageSearch className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold">{t("noShipments")}</h3>
                                <p className="text-muted-foreground">{t("noOngoingDescription")}</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="completed" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {completedShipments.length > 0 ? (
                            completedShipments.map((shipment) => (
                                <ShipmentOperationsCard
                                    key={shipment.id}
                                    shipment={shipment}
                                    onSuccess={fetchOperations}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
                                <PackageSearch className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold">{t("noShipments")}</h3>
                                <p className="text-muted-foreground">{t("noCompletedDescription")}</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="map" className="mt-0">
                    <div className="bg-white border rounded-xl overflow-hidden h-[600px]">
                        <FleetTrackingMap shipments={ongoingShipments} />
                    </div>
                </TabsContent>
            </Tabs>

            {dispatchShipment && (
                <DriverDispatchDialog
                    shipment={dispatchShipment}
                    open={!!dispatchShipment}
                    onOpenChange={(open) => !open && setDispatchShipment(null)}
                    onSuccess={fetchOperations}
                />
            )}

            {issueShipment && (
                <ReportIssueDialog
                    shipment={issueShipment}
                    open={!!issueShipment}
                    onOpenChange={(open) => !open && setIssueShipment(null)}
                    onSuccess={fetchOperations}
                />
            )}

            {completeShipment && (
                <CompletionChecklistDialog
                    shipment={completeShipment}
                    open={!!completeShipment}
                    onOpenChange={(open) => !open && setCompleteShipment(null)}
                    onSuccess={fetchOperations}
                />
            )}
        </div>
    );
}
