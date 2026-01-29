"use client";

import React from "react";
import { Shipment } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Package, DollarSign, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "./CountdownTimer";
import { Badge } from "@/components/ui/badge";

interface ShipmentBidCardProps {
  shipment: Shipment;
  isSelected: boolean;
  onClick: () => void;
}

export function ShipmentBidCard({ shipment, isSelected, onClick }: ShipmentBidCardProps) {
  const lowestBid = shipment.bids[0]?.bid_amount;
  const bidCount = shipment.bids.length;
  const isExpired = shipment.bid_expires_at && new Date(shipment.bid_expires_at) < new Date();

  return (
    <Card
      className={cn(
        "rounded-2xl shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-primary/20",
        isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-slate-100 bg-white"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Package className={cn("h-4 w-4", isSelected ? "text-primary" : "text-slate-400")} />
            <span className="text-sm font-black text-slate-900">{shipment.shipment_number || shipment.id.slice(0, 8)}</span>
          </div>
          {shipment.bid_expires_at && <CountdownTimer expiryDate={shipment.bid_expires_at} />}
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-center py-1">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <div className="flex-1 w-px border-l-2 border-dotted border-slate-200 my-1"></div>
            <MapPin className="h-4 w-4 text-rose-500" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Pickup</p>
              <p className="text-xs font-medium text-slate-700 line-clamp-1">{shipment.pickup_location}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Delivery</p>
              <p className="text-xs font-medium text-slate-700 line-clamp-1">{shipment.delivery_location}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-50/50">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-black text-emerald-600">
              {lowestBid ? `XAF ${lowestBid.toLocaleString()}` : 'No Bids'}
            </span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-0.5">
            {bidCount} Bids
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}