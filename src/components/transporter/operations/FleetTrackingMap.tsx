"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Zap, Truck } from "lucide-react";
import { Shipment } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface FleetTrackingMapProps {
    shipments: Shipment[];
}

export function FleetTrackingMap({ shipments }: FleetTrackingMapProps) {
    const activeShipments = shipments.filter(s => s.status === "in_transit" || s.status === "bid_awarded");

    return (
        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden h-full flex flex-col min-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between pb-4 bg-white z-10">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-black">Fleet Tracking</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Coverage</span>
                    </div>
                </div>
                <Maximize2 className="h-4 w-4 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent className="p-0 relative flex-1 bg-slate-100">
                <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=4.0511,9.7679&zoom=7&size=1000x800&scale=2&style=feature:all|element:labels|visibility:off&style=feature:water|color:0xdee2e6&style=feature:landscape|color:0xf8f9fa&key=...')] bg-cover bg-center">
                    {/* Simulated Markers for Active Shipments */}
                    {activeShipments.map((s, idx) => (
                        <div
                            key={s.id}
                            className="absolute group transition-all duration-1000"
                            style={{
                                left: `${20 + (idx * 15) % 60}%`,
                                top: `${30 + (idx * 12) % 40}%`
                            }}
                        >
                            <div className="relative">
                                <div className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white transition-transform hover:scale-110 cursor-pointer",
                                    s.status === "in_transit" ? "bg-primary text-white" : "bg-blue-500 text-white"
                                )}>
                                    <Truck className="h-5 w-5" />
                                </div>

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                    <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-2xl min-w-[160px]">
                                        <div className="flex justify-between items-start gap-4 mb-2">
                                            <p className="text-[9px] font-black uppercase text-slate-400 leading-none">{s.shipment_number}</p>
                                            <Badge variant="outline" className="text-[8px] h-4 border-white/20 text-white px-1 font-bold">
                                                {s.status.replace(/_/g, " ")}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-bold truncate mb-3">{s.delivery_location}</p>
                                        <div className="flex items-center justify-between text-[9px] font-medium text-slate-400 pt-2 border-t border-white/10">
                                            <span>ETA: {s.estimated_arrival ? new Date(s.estimated_arrival).toLocaleTimeString() : "Pending"}</span>
                                            <span className="text-emerald-400 font-bold">In Motion</span>
                                        </div>
                                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Map Overlay Stats */}
                    <div className="absolute top-6 left-6 flex flex-col gap-3">
                        <Badge className="bg-white/90 backdrop-blur shadow-xl border-none text-slate-900 px-4 py-3 rounded-2xl flex items-center gap-3 w-fit">
                            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Active Assets</span>
                                <span className="font-black text-sm">{activeShipments.length}</span>
                            </div>
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
