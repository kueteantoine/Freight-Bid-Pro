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

import { FleetTrackingMap } from "@/components/transporter/operations/FleetTrackingMap";

export default function TransporterOperationsPage() {
    const [shipments, setShipments] = React.useState<Shipment[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState("awarded");

    const [dispatchShipment, setDispatchShipment] = React.useState<Shipment | null>(null);
    const [isDispatchOpen, setIsDispatchOpen] = React.useState(false);

    const [issueShipment, setIssueShipment] = React.useState<Shipment | null>(null);
    const [isIssueOpen, setIsIssueOpen] = React.useState(false);

    const [completeShipment, setCompleteShipment] = React.useState<Shipment | null>(null);
    const [isCompleteOpen, setIsCompleteOpen] = React.useState(false);

    const fetchOperations = async () => {
        setLoading(true);
        try {
            // If map is selected, we want all active shipments, not just filtered by a status string
            const statusParam = activeTab === "map" ? "active" : activeTab;
            const data = await getTransporterOperations(statusParam);
            setShipments(data || []);
        } catch (error: any) {
            toast.error("Failed to fetch operations: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchOperations();
    }, [activeTab]);

    const handleUpdateStatus = async (shipment: Shipment, status: any, event: any) => {
        try {
            await updateShipmentStatus(shipment.id, status, event);
            toast.success(`Shipment status updated to ${status}`);
            fetchOperations();
        } catch (error: any) {
            toast.error("Failed to update status: " + error.message);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shipment Operations</h1>
                <p className="text-slate-500 font-medium">Manage your awarded, active, and completed shipments.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-14 w-fit">
                    <TabsTrigger value="awarded" className="rounded-xl font-bold px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Awarded
                    </TabsTrigger>
                    <TabsTrigger value="active" className="rounded-xl font-bold px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Active
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-xl font-bold px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        History
                    </TabsTrigger>
                    <TabsTrigger value="map" className="rounded-xl font-bold px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Fleet Map
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="m-0 border-none outline-none focus-visible:ring-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <p className="text-sm font-bold text-slate-400">Loading map visuals...</p>
                        </div>
                    ) : (
                        <FleetTrackingMap shipments={shipments} />
                    )}
                </TabsContent>

                {["awarded", "active", "completed"].map((tab) => (
                    <TabsContent key={tab} value={tab} className="m-0 border-none outline-none focus-visible:ring-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                <p className="text-sm font-bold text-slate-400">Fetching operational data...</p>
                            </div>
                        ) : shipments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                <PackageSearch className="h-16 w-16 text-slate-200" />
                                <div className="text-center">
                                    <p className="text-lg font-black text-slate-400">No shipments found</p>
                                    <p className="text-sm text-slate-400 font-medium">Any {tab} shipments will appear here.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {shipments.map(shipment => (
                                    <ShipmentOperationsCard
                                        key={shipment.id}
                                        shipment={shipment}
                                        onDispatch={(s) => {
                                            setDispatchShipment(s);
                                            setIsDispatchOpen(true);
                                        }}
                                        onUpdateStatus={handleUpdateStatus}
                                        onReportIssue={(s) => {
                                            setIssueShipment(s);
                                            setIsIssueOpen(true);
                                        }}
                                        onComplete={(s) => {
                                            setCompleteShipment(s);
                                            setIsCompleteOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            {dispatchShipment && (
                <DriverDispatchDialog
                    shipment={dispatchShipment}
                    open={isDispatchOpen}
                    onOpenChange={setIsDispatchOpen}
                    onSuccess={fetchOperations}
                />
            )}

            {issueShipment && (
                <ReportIssueDialog
                    shipment={issueShipment}
                    open={isIssueOpen}
                    onOpenChange={setIsIssueOpen}
                    onSuccess={fetchOperations}
                />
            )}

            {completeShipment && (
                <CompletionChecklistDialog
                    shipment={completeShipment}
                    open={isCompleteOpen}
                    onOpenChange={setIsCompleteOpen}
                    onSuccess={fetchOperations}
                />
            )}
        </div>
    );
}
