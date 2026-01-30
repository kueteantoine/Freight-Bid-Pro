"use client";

import React, { useState, useMemo } from "react";
import { useRealtimeBids } from "@/hooks/use-realtime-bids";
import { Shipment, Bid } from "@/lib/types/database";
import { Loader2, Package, Search, Filter, ArrowLeft, Zap, BarChart3, MessageSquare, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShipmentBidCard } from "./ShipmentBidCard";
import { BidList } from "./BidList";
import { BidComparisonMatrix } from "./BidComparisonMatrix";
import { BiddingAnalytics } from "./BiddingAnalytics";
import { CounterOfferDialog } from "./CounterOfferDialog";
import { BidRejectionDialog } from "./BidRejectionDialog";
import { AutoAcceptRulesDialog } from "./AutoAcceptRulesDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export function BiddingDashboard() {
  const { activeShipments, isLoading, error } = useRealtimeBids();
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [showRejection, setShowRejection] = useState(false);
  const [showAutoAccept, setShowAutoAccept] = useState(false);

  const selectedShipment = useMemo(() => {
    const shipment = activeShipments.find(s => s.id === selectedShipmentId);
    if (shipment && !selectedBid && shipment.bids.length > 0) {
      // Automatically select the lowest bid when a shipment is selected
      setSelectedBid(shipment.bids[0]);
    }
    return shipment;
  }, [activeShipments, selectedShipmentId, selectedBid]);

  const handleShipmentSelect = (shipment: Shipment) => {
    setSelectedShipmentId(shipment.id);
    // Reset selected bid when switching shipments
    setSelectedBid(shipment.bids.length > 0 ? shipment.bids[0] : null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading live bidding data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-10">Error loading data: {error}</div>;
  }

  if (activeShipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-3xl shadow-xl border border-slate-100">
        <Package className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-2xl font-bold text-slate-900">No Active Bidding Shipments</h3>
        <p className="text-muted-foreground">Post a new load to start receiving bids in real-time.</p>
        <Button asChild className="mt-4 rounded-xl h-12 px-8">
          <Link href="/shipper/shipments/new">Create Shipment</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden rounded-3xl border border-slate-100 shadow-2xl bg-white">
      {/* Left Sidebar: Active Shipments List */}
      <aside className="w-96 border-r border-slate-100 flex flex-col">
        <header className="p-6 border-b border-slate-100 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Active Auctions ({activeShipments.length})</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input placeholder="Search shipment ID or route..." className="pl-9 h-11 bg-slate-50 border-slate-100 rounded-xl focus:bg-white" />
          </div>
        </header>
        <ScrollArea className="flex-1 p-4 space-y-4">
          {activeShipments.map((shipment) => (
            <ShipmentBidCard
              key={shipment.id}
              shipment={shipment}
              isSelected={shipment.id === selectedShipmentId}
              onClick={() => handleShipmentSelect(shipment)}
            />
          ))}
        </ScrollArea>
      </aside>

      {/* Main Content: Bid Details / Comparison */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedShipment ? (
          <div className="flex-1 grid grid-cols-2 overflow-hidden">
            {/* Left Panel: Bid List */}
            <ScrollArea className="p-8 border-r border-slate-100">
              <BidList
                shipment={selectedShipment}
                onSelectBid={setSelectedBid}
              />
            </ScrollArea>

            {/* Right Column - Bid Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedBid && selectedShipment ? (
                <>
                  <BidComparisonMatrix
                    selectedBid={selectedBid}
                    shipment={selectedShipment}
                  />

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCounterOffer(true)}
                      className="flex-1 rounded-xl gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Counter Offer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejection(true)}
                      className="rounded-xl gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Bid
                    </Button>
                  </div>

                  {/* Analytics Panel */}
                  {showAnalytics && (
                    <BiddingAnalytics shipmentId={selectedShipment.id} />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Package className="h-16 w-16 text-slate-300 mb-4" />
                  <p className="text-lg font-bold text-slate-900">Select a Bid to View Details</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Choose a shipment and bid from the left to see detailed comparison
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/shipper/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-3xl font-black text-slate-900">Live Bidding</h1>
            </div>
            <div className="flex items-center gap-2">
              {selectedShipmentId && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowAutoAccept(true)}
                    className="rounded-xl gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Auto-Accept Rules
                  </Button>
                  <Button
                    variant={showAnalytics ? "default" : "outline"}
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="rounded-xl gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {showAnalytics ? "Hide" : "Show"} Analytics
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Dialogs */}
      {selectedBid && (
        <>
          <CounterOfferDialog
            open={showCounterOffer}
            onOpenChange={setShowCounterOffer}
            bidId={selectedBid.id}
            originalAmount={selectedBid.bid_amount}
            transporterName={`${selectedBid.profiles.first_name} ${selectedBid.profiles.last_name}`}
          />
          <BidRejectionDialog
            open={showRejection}
            onOpenChange={setShowRejection}
            bidId={selectedBid.id}
            transporterName={`${selectedBid.profiles.first_name} ${selectedBid.profiles.last_name}`}
            bidAmount={selectedBid.bid_amount}
          />
        </>
      )}
      {selectedShipmentId && (
        <AutoAcceptRulesDialog
          open={showAutoAccept}
          onOpenChange={setShowAutoAccept}
          shipmentId={selectedShipmentId}
          activeBidsCount={selectedShipment?.bids.length || 0}
        />
      )}
    </div>
  );
}