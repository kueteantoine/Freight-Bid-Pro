"use client";

import React, { useState } from "react";
import { Bid, Shipment } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, DollarSign, MapPin, Star, Truck, User, Calendar, Clock, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { awardBid } from "@/app/actions/bid-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BidComparisonMatrixProps {
  selectedBid: Bid;
  shipment: Shipment;
}

export function BidComparisonMatrix({ selectedBid, shipment }: BidComparisonMatrixProps) {
  const transporter = selectedBid.profiles;
  const isLowestBid = shipment.bids[0]?.id === selectedBid.id;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const router = useRouter();

  const handleAwardBid = async () => {
    setIsAwarding(true);
    try {
      await awardBid(selectedBid.id);
      toast.success("Bid Awarded Successfully!", {
        description: `${transporter.first_name} ${transporter.last_name} has been awarded the shipment.`,
      });
      setShowConfirmDialog(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to Award Bid", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsAwarding(false);
    }
  };

  const isAwarded = selectedBid.bid_status === "awarded";
  const isExpired = selectedBid.bid_expires_at && new Date(selectedBid.bid_expires_at) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">Bid Details & Evaluation</h3>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={isAwarded || isExpired || isAwarding}
          className="rounded-xl h-11 px-6 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAwarding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Awarding...
            </>
          ) : isAwarded ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Already Awarded
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Award Bid
            </>
          )}
        </Button>
      </div>

      <Card className="rounded-3xl border-slate-100 shadow-xl overflow-hidden">
        <CardHeader className="p-6 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                <AvatarImage src={transporter.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {transporter.first_name?.[0] || <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg font-black text-slate-900">
                  {transporter.first_name} {transporter.last_name}
                </CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-slate-600">4.8</span>
                  <span className="text-xs text-slate-400">(120 trips completed)</span>
                </div>
              </div>
            </div>
            {isLowestBid && (
              <Badge className="bg-emerald-500 text-white font-black text-sm px-4 py-2 rounded-full shadow-md">
                LOWEST BID
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bid Amount</p>
              <p className="text-3xl font-black text-primary">XAF {selectedBid.bid_amount.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Delivery</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <p className="text-lg font-bold text-slate-900">
                  {selectedBid.estimated_delivery_date ? format(new Date(selectedBid.estimated_delivery_date), 'MMM dd, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Transporter Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={Truck} label="Vehicle Type" value="Flatbed (Verified)" />
              <InfoRow icon={MapPin} label="Distance from Pickup" value="45 km" />
              <InfoRow icon={Clock} label="Bid Submitted" value={format(new Date(selectedBid.bid_submitted_at), 'MMM dd, HH:mm')} />
              <InfoRow icon={DollarSign} label="Win Rate" value="75%" />
            </div>
          </div>

          {selectedBid.bid_message && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Transporter Message</h4>
              <Card className="p-4 bg-slate-50 border-slate-100 rounded-xl">
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  &quot;{selectedBid.bid_message}&quot;
                </p>
              </Card>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold">
              Counter Offer
            </Button>
            <Button variant="secondary" className="flex-1 h-12 rounded-xl font-bold">
              View Full Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Award Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">
              Award Bid to {transporter.first_name} {transporter.last_name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Final Price:</span>
                  <span className="text-xl font-black text-primary">
                    XAF {selectedBid.bid_amount.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Estimated Delivery:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedBid.estimated_delivery_date
                      ? format(new Date(selectedBid.estimated_delivery_date), "MMM dd, yyyy")
                      : "Not specified"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Transporter Rating:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-slate-900">4.8</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Awarding this bid will mark all other bids as outbid and update the shipment status.
                  This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isAwarding}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAwardBid}
              disabled={isAwarding}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              {isAwarding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Awarding...
                </>
              ) : (
                "Confirm Award"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}