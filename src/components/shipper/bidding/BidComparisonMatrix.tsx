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
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentInitiation } from "../payments/PaymentInitiation";
import { processPayment } from "@/app/actions/payment-actions";

interface BidComparisonMatrixProps {
  selectedBid: Bid;
  shipment: Shipment;
}

export function BidComparisonMatrix({ selectedBid, shipment }: BidComparisonMatrixProps) {
  const { convert, format, currentCurrency } = useCurrency();
  const transporter = selectedBid.profiles;
  const isLowestBid = shipment.bids[0]?.id === selectedBid.id;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const router = useRouter();

  const handlePaymentComplete = async (method: string) => {
    setIsAwarding(true);
    try {
      // Cameroonian fees (as per Prompt 17/implementation plan)
      const platformCommission = selectedBid.bid_amount * 0.05;
      const aggregatorFee = selectedBid.bid_amount * 0.01;
      const mobileMoneyFee = selectedBid.bid_amount * 0.01;
      const totalPayable = selectedBid.bid_amount + platformCommission + aggregatorFee + mobileMoneyFee;

      await processPayment({
        bidId: selectedBid.id,
        paymentMethod: method,
        grossAmount: selectedBid.bid_amount,
        platformCommission,
        aggregatorFee,
        mobileMoneyFee,
        totalPayable,
        customerPhone: "N/A", // Flutterwave requires this, though typically we'd get from session
        customerEmail: "shiper@example.com", // Placeholder, should be from session or props
        currency: currentCurrency
      });

      toast.success("Payment Successful & Bid Awarded!", {
        description: `${transporter.first_name} ${transporter.last_name} has been notified and the shipment is now active.`,
      });
      setShowConfirmDialog(false);
      router.refresh();
      router.push("/shipper/shipments"); // Redirect to tracking or shipment list
    } catch (error) {
      toast.error("Payment Processing Failed", {
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
              <p className="text-3xl font-black text-primary">{format(convert(selectedBid.bid_amount))}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Delivery</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <p className="text-lg font-bold text-slate-900">
                  {selectedBid.estimated_delivery_date ? format(new Date(selectedBid.estimated_delivery_date).getTime(), 'MMM dd, yyyy') : 'N/A'}
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
              <InfoRow icon={Clock} label="Bid Submitted" value={format(new Date(selectedBid.bid_submitted_at).getTime(), 'MMM dd, HH:mm')} />
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

      {/* Payment Initiation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-3xl p-0 border-none bg-transparent shadow-none">
          <PaymentInitiation
            bidAmount={selectedBid.bid_amount}
            onPaymentComplete={handlePaymentComplete}
            onCancel={() => setShowConfirmDialog(false)}
          />
        </DialogContent>
      </Dialog>
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