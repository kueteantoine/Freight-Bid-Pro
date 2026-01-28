import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";
import { AUCTION_TYPES } from "@/lib/constants/shipment-constants";

interface Step5BiddingProps {
  form: UseFormReturn<BookingFormValues>;
}

export function Step5Bidding({ form }: Step5BiddingProps) {
  const auctionType = form.watch("auction_type");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Bidding & Pricing</h2>
        <p className="text-muted-foreground">Configure how carriers will bid on your shipment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="auction_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Auction Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select auction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AUCTION_TYPES.map((type: { id: string, label: string, desc: string }) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{AUCTION_TYPES.find((t: { id: string, label: string, desc: string }) => t.id === field.value)?.desc}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="marketplace_visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marketplace Visibility</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="public">Public (Open to all verified carriers)</SelectItem>
                  <SelectItem value="private">Private (Invite-only)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === 'public' ? "Visible to all verified carriers." : "Only visible to carriers you invite."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {auctionType !== 'buy_it_now' && (
        <Card className="p-4 bg-muted/20 border-dashed animate-in fade-in duration-300">
          <CardTitle className="text-lg mb-4">Bidding Rules</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="bidding_duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bidding Duration (Minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 60 (1 hour)" className="h-10" {...field} />
                  </FormControl>
                  <FormDescription>How long the auction will remain open.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="min_bid_increment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Bid Increment (XAF)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 1000" className="h-10" {...field} />
                  </FormControl>
                  <FormDescription>Minimum amount a carrier must lower the previous bid by.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reserve_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserve Price (XAF, Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Minimum acceptable price" className="h-10" {...field} />
                  </FormControl>
                  <FormDescription>If the lowest bid doesn't meet this, you don't have to award it.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>
      )}

      {auctionType === 'buy_it_now' && (
        <Card className="p-4 bg-primary/10 border-primary/50 border-dashed animate-in fade-in duration-300">
          <CardTitle className="text-lg mb-4 text-primary">Instant Acceptance Price</CardTitle>
          <FormField
            control={form.control}
            name="buy_it_now_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buy It Now Price (XAF)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Fixed price for instant award" className="h-10" {...field} />
                </FormControl>
                <FormDescription>The first carrier to bid this price wins instantly.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>
      )}
    </div>
  );
}