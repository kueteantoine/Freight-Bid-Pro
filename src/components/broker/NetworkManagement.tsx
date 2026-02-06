"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Truck, Plus, Star, MapPin, Upload } from "lucide-react";
import {
    getShipperNetwork,
    getCarrierNetwork,
    type ShipperNetworkPartner,
    type CarrierNetworkPartner,
} from "@/lib/services/broker-actions";
import { AddPartnerDialog } from "./AddPartnerDialog";
import { PartnerDetailView } from "./PartnerDetailView";
import { CSVImportDialog } from "./CSVImportDialog";

export function NetworkManagement() {
    const [shippers, setShippers] = useState<ShipperNetworkPartner[]>([]);
    const [carriers, setCarriers] = useState<CarrierNetworkPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showCSVImport, setShowCSVImport] = useState(false);
    const [addDialogType, setAddDialogType] = useState<"shipper" | "carrier">("shipper");

    useEffect(() => {
        loadNetworks();
    }, []);

    const loadNetworks = async () => {
        setLoading(true);
        const [shipperResult, carrierResult] = await Promise.all([
            getShipperNetwork(),
            getCarrierNetwork(),
        ]);

        if (shipperResult.data) setShippers(shipperResult.data);
        if (carrierResult.data) setCarriers(carrierResult.data);
        setLoading(false);
    };

    const handleAddPartner = (type: "shipper" | "carrier") => {
        setAddDialogType(type);
        setShowAddDialog(true);
    };

    const handlePartnerAdded = () => {
        setShowAddDialog(false);
        loadNetworks();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500";
            case "inactive":
                return "bg-gray-500";
            case "suspended":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    if (selectedPartner) {
        return (
            <PartnerDetailView
                partner={selectedPartner}
                onClose={() => setSelectedPartner(null)}
                onUpdate={loadNetworks}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-primary">Network Management</h2>
            </div>

            <Tabs defaultValue="shippers" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="shippers">
                        <Building2 className="mr-2 h-4 w-4" />
                        Shipper Clients ({shippers.length})
                    </TabsTrigger>
                    <TabsTrigger value="carriers">
                        <Truck className="mr-2 h-4 w-4" />
                        Carrier Partners ({carriers.length})
                    </TabsTrigger>
                </TabsList>

                {/* Shipper Network Tab */}
                <TabsContent value="shippers" className="space-y-4">
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => { setAddDialogType("shipper"); setShowCSVImport(true); }}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import CSV
                        </Button>
                        <Button onClick={() => handleAddPartner("shipper")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Shipper Client
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading shipper network...</p>
                        </div>
                    ) : shippers.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Shipper Clients Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Add shipper clients to start brokering shipments
                            </p>
                            <Button onClick={() => handleAddPartner("shipper")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Your First Shipper
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {shippers.map((shipper) => (
                                <Card
                                    key={shipper.id}
                                    className="cursor-pointer hover:shadow-lg transition-all"
                                    onClick={() => setSelectedPartner({ ...shipper, type: "shipper" })}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">
                                                    {shipper.shipper_profile?.company_name || "Unnamed Company"}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {shipper.shipper_profile?.email}
                                                </p>
                                            </div>
                                            <Badge className={getStatusColor(shipper.relationship_status)}>
                                                {shipper.relationship_status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Shipments:</span>
                                            <span className="font-semibold">{shipper.total_shipments_brokered}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Revenue:</span>
                                            <span className="font-semibold">
                                                {shipper.total_revenue_generated.toLocaleString()} XAF
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Commission:</span>
                                            <span className="font-semibold">{shipper.commission_rate}%</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Carrier Network Tab */}
                <TabsContent value="carriers" className="space-y-4">
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => { setAddDialogType("carrier"); setShowCSVImport(true); }}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import CSV
                        </Button>
                        <Button onClick={() => handleAddPartner("carrier")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Carrier Partner
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading carrier network...</p>
                        </div>
                    ) : carriers.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Carrier Partners Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Add carrier partners to fulfill shipments
                            </p>
                            <Button onClick={() => handleAddPartner("carrier")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Your First Carrier
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {carriers.map((carrier) => (
                                <Card
                                    key={carrier.id}
                                    className="cursor-pointer hover:shadow-lg transition-all"
                                    onClick={() => setSelectedPartner({ ...carrier, type: "carrier" })}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">
                                                    {carrier.carrier_profile?.company_name || "Unnamed Company"}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {carrier.carrier_profile?.email}
                                                </p>
                                            </div>
                                            <Badge className={getStatusColor(carrier.relationship_status)}>
                                                {carrier.relationship_status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {carrier.reliability_rating ? (
                                                <>
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-semibold">{carrier.reliability_rating.toFixed(1)}</span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Not rated</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Shipments:</span>
                                            <span className="font-semibold">{carrier.total_shipments_assigned}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">On-Time:</span>
                                            <span className="font-semibold">
                                                {carrier.performance_metrics.on_time_rate}%
                                            </span>
                                        </div>
                                        {carrier.service_areas && carrier.service_areas.length > 0 && (
                                            <div className="flex items-start gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <span className="text-muted-foreground">
                                                    {carrier.service_areas.slice(0, 2).join(", ")}
                                                    {carrier.service_areas.length > 2 && ` +${carrier.service_areas.length - 2}`}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {showAddDialog && (
                <AddPartnerDialog
                    type={addDialogType}
                    onClose={() => setShowAddDialog(false)}
                    onSuccess={handlePartnerAdded}
                />
            )}

            {showCSVImport && (
                <CSVImportDialog
                    type={addDialogType}
                    onClose={() => setShowCSVImport(false)}
                    onSuccess={() => { setShowCSVImport(false); loadNetworks(); }}
                />
            )}
        </div>
    );
}
