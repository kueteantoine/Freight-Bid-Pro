"use client";

import React, { useEffect, useState } from "react";
import { getShipmentsByStatus } from "@/app/actions/tracking-actions";
import { Shipment } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ArrowRight, Truck, Eye, Search, Filter } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export default function ShipperTrackingPage() {
    const t = useTranslations("shipperSubPages");
    const tCommon = useTranslations("common");
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchShipments = async () => {
            try {
                const data = await getShipmentsByStatus("in_transit");
                setShipments(data);
            } catch (error) {
                console.error("Error fetching tracking shipments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShipments();
    }, []);

    const filteredShipments = shipments.filter(s =>
        s.shipment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.pickup_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.delivery_location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{t("liveTracking")}</h1>
                    <p className="text-slate-500 font-medium mt-1">{t("liveTrackingDesc")}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={tCommon("searchShipments")}
                            className="pl-10 rounded-xl bg-white shadow-sm border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="rounded-xl shrink-0">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="rounded-3xl border-none shadow-sm animate-pulse h-48 bg-slate-100" />
                    ))}
                </div>
            ) : filteredShipments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredShipments.map((shipment) => (
                        <Card key={shipment.id} className="rounded-3xl border-none shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white border border-slate-100">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl font-bold">{shipment.shipment_number}</CardTitle>
                                            <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-3 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                {tCommon("active")}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                                            {shipment.actual_pickup_at ? formatDistanceToNow(new Date(shipment.actual_pickup_at), { addSuffix: true }) : 'recently'}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 bg-slate-50 group-hover:bg-primary/10 rounded-2xl flex items-center justify-center transition-colors">
                                        <Truck className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-400 uppercase leading-none mb-1">Current Location</p>
                                            <p className="text-sm font-bold truncate text-slate-700">Moving between cities...</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-400 uppercase leading-none mb-1">Estimated Arrival</p>
                                            <p className="text-sm font-bold truncate text-slate-700">
                                                {shipment.estimated_arrival ? new Date(shipment.estimated_arrival).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Calculating...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                    <Link href={`/shipper/shipments/${shipment.id}`} className="flex-1">
                                        <Button className="w-full rounded-2xl h-12 font-black gap-2 shadow-sm group-hover:shadow-lg transition-all">
                                            <Eye className="h-4 w-4" />
                                            {tCommon("openMapView")}
                                        </Button>
                                    </Link>
                                    <Link href={`/shipper/messages?shipmentId=${shipment.id}`}>
                                        <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 border-slate-200">
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Truck className="h-10 w-10 text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">{t("noShipmentsInTransit")}</h2>
                    <p className="text-slate-500 max-w-xs mt-2 font-medium">{t("noShipmentsInTransitDesc")}</p>
                    <Link href="/shipper/shipments" className="mt-8">
                        <Button variant="outline" className="rounded-2xl px-8 h-12 font-bold text-slate-600 border-slate-200">
                            {t("goToMyShipments")}
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
