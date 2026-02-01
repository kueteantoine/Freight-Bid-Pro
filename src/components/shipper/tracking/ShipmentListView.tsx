"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shipment, ShipmentStatus } from "@/lib/types/database";
import { ShipmentCard } from "./ShipmentCard";
import { Loader2 } from "lucide-react";

interface ShipmentListViewProps {
    shipments: Shipment[];
    counts: {
        all: number;
        draft: number;
        open_for_bidding: number;
        bid_awarded: number;
        in_transit: number;
        delivered: number;
        cancelled: number;
    };
}

const tabs = [
    { value: "all", label: "All Shipments", key: "all" as const },
    { value: "open_for_bidding", label: "Open for Bidding", key: "open_for_bidding" as const },
    { value: "bid_awarded", label: "Awarded", key: "bid_awarded" as const },
    { value: "in_transit", label: "In Transit", key: "in_transit" as const },
    { value: "delivered", label: "Delivered", key: "delivered" as const },
    { value: "draft", label: "Drafts", key: "draft" as const },
    { value: "cancelled", label: "Cancelled", key: "cancelled" as const },
];

export function ShipmentListView({ shipments, counts }: ShipmentListViewProps) {
    const [activeTab, setActiveTab] = useState("all");

    const filteredShipments = activeTab === "all"
        ? shipments
        : shipments.filter(s => s.status === activeTab);

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                            {tab.label}
                            <Badge variant="secondary" className="ml-1">
                                {counts[tab.key]}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className="mt-6">
                        {filteredShipments.length === 0 ? (
                            <div className="border-2 border-dashed border-muted rounded-xl h-64 flex items-center justify-center bg-muted/50">
                                <div className="text-center space-y-2">
                                    <p className="text-muted-foreground">
                                        No {tab.label.toLowerCase()} found.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredShipments.map((shipment) => (
                                    <ShipmentCard key={shipment.id} shipment={shipment} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
