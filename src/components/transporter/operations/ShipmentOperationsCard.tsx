"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Truck, User, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Shipment } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface ShipmentOperationsCardProps {
    shipment: Shipment;
    onDispatch?: (shipment: Shipment) => void;
    onUpdateStatus?: (shipment: Shipment, status: any, event: any) => void;
    onReportIssue?: (shipment: Shipment) => void;
    onComplete?: (shipment: Shipment) => void;
}

export function ShipmentOperationsCard({
    shipment,
    onDispatch,
    onUpdateStatus,
    onReportIssue,
    onComplete
}: ShipmentOperationsCardProps) {
    const isAwarded = shipment.status === "bid_awarded";
    const isInTransit = shipment.status === "in_transit";
    const isDelivered = shipment.status === "delivered";

    const needsAssignment = isAwarded && (!shipment.assigned_driver_user_id || !shipment.assigned_vehicle_id);

    return (
        <Card className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{shipment.shipment_number}</span>
                            <Badge variant="outline" className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border-none",
                                isAwarded && "bg-blue-50 text-blue-600",
                                isInTransit && "bg-amber-50 text-amber-600",
                                isDelivered && "bg-emerald-50 text-emerald-600",
                            )}>
                                {shipment.status.replace(/_/g, " ")}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Updated {new Date(shipment.updated_at).toLocaleDateString()}</p>
                    </div>

                    {!isDelivered && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold"
                            onClick={() => onReportIssue?.(shipment)}
                        >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Report Issue
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center py-1">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                                <div className="flex-1 w-px border-l-2 border-dotted border-slate-200 my-1"></div>
                                <div className="h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/20"></div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">{shipment.pickup_location}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tight flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {new Date(shipment.scheduled_pickup_date).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">{shipment.delivery_location}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none font-sans">Driver</span>
                            <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-700">
                                    {shipment.assigned_driver_user_id ? "Assigned" : "Not Assigned"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none font-sans">Vehicle</span>
                            <div className="flex items-center gap-2">
                                <Truck className="h-3 w-3 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-700">
                                    {shipment.assigned_vehicle_id ? "Assigned" : "Not Assigned"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
                    {isAwarded && (
                        <>
                            {needsAssignment ? (
                                <Button className="flex-1 h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 transition-all font-sans" onClick={() => onDispatch?.(shipment)}>
                                    Assign Driver & Truck
                                </Button>
                            ) : (
                                <Button className="flex-1 h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 transition-all font-sans" onClick={() => onUpdateStatus?.(shipment, "in_transit", "pickup_started")}>
                                    Start Pickup
                                </Button>
                            )}
                        </>
                    )}

                    {isInTransit && (
                        <>
                            <Button variant="outline" className="flex-1 h-12 border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all font-sans" onClick={() => onUpdateStatus?.(shipment, "in_transit", "loaded")}>
                                Loaded & In Transit
                            </Button>
                            <Button className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-xs text-white shadow-lg shadow-emerald-200 transition-all font-sans" onClick={() => onComplete?.(shipment)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark Delivered
                            </Button>
                        </>
                    )}

                    {isDelivered && (
                        <Button variant="outline" className="flex-1 h-12 border-emerald-100 bg-emerald-50/30 rounded-xl font-bold text-xs text-emerald-600 cursor-default font-sans">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Completed
                        </Button>
                    )}

                    <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200 p-0 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
