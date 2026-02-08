"use client";

import React from "react";
import { Bid, Shipment } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, DollarSign, MapPin, Star, Truck, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BidListProps {
  shipment: Shipment;
  onSelectBid: (bid: Bid) => void;
}

import { FeaturedBadge } from "@/components/ads/featured-badge";

export function BidList({ shipment, onSelectBid }: BidListProps) {
  const lowestBid = shipment.bids[0]?.bid_amount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">
          Active Bids ({shipment.bids.length})
        </h3>
        <Button variant="outline" size="sm" className="rounded-xl">
          Filter Bids
        </Button>
      </div>

      <div className="space-y-4">
        {shipment.bids.length === 0 ? (
          <div className="p-10 text-center bg-muted/50 rounded-xl border border-dashed">
            <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No bids received yet. Share your load!</p>
          </div>
        ) : (
          shipment.bids.map((bid: any, index: number) => {
            const activeSub = bid.profiles?.user_ad_subscriptions?.find((sub: any) => sub.subscription_status === 'active');
            const tierSlug = activeSub?.ad_subscription_tiers?.[0]?.tier_slug;

            return (
              <Card
                key={bid.id}
                className={cn(
                  "rounded-2xl shadow-sm transition-all hover:shadow-lg cursor-pointer",
                  index === 0 ? "border-2 border-emerald-400 bg-emerald-50/50" : "border-slate-100 bg-white"
                )}
                onClick={() => onSelectBid(bid)}
              >
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarImage src={bid.profiles.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {bid.profiles.first_name?.[0] || <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900 leading-none">
                          {bid.profiles.first_name} {bid.profiles.last_name}
                        </p>
                        {tierSlug && <FeaturedBadge tierSlug={tierSlug} size="sm" />}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-slate-600">4.8</span>
                        <span className="text-xs text-slate-400">(120 trips)</span>
                      </div>
                    </div>
                  </div>


                  <div className="text-right">
                    <p className={cn(
                      "text-xl font-black",
                      index === 0 ? "text-emerald-600" : "text-slate-900"
                    )}>
                      XAF {bid.bid_amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                      Est. Delivery: {bid.estimated_delivery_date ? format(new Date(bid.estimated_delivery_date), 'MMM dd') : 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

      </div>
    </div>
  );
}