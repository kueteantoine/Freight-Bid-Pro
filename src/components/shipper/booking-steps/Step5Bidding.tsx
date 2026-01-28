import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";
import { AUCTION_TYPES } from "@/lib/constants/shipment-constants";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Step5BiddingProps {
  form: UseFormReturn<BookingFormValues>;
}

export function Step5Bidding({ form }: Step5BiddingProps) {
  const auctionType = form.watch("auction_type");
  const autoAcceptEnabled = form.watch("auto_accept_criteria_json.enabled");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Bidding & Pricing</h2>
        <p className="text-muted-foreground">Configure how carriers will bid on your shipment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField<BookingFormValues, "auction_type">
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

        <FormField<BookingFormValues, "marketplace_visibility">
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
        <Card className="p-6 bg-muted/20 border-dashed animate-in fade-in duration-300">
          <CardTitle className="text-lg mb-4">Bidding Rules</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField<BookingFormValues, "bidding_duration_minutes">
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
            <FormField<BookingFormValues, "min_bid_increment">
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
            <FormField<BookingFormValues, "reserve_price">
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
        <Card className="p-6 bg-primary/10 border-primary/50 border-dashed animate-in fade-in duration-300">
          <CardTitle className="text-lg mb-4 text-primary">Instant Acceptance Price</CardTitle>
          <FormField<BookingFormValues, "buy_it_now_price">
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

      {/* Auto-Accept Criteria */}
      <Collapsible className="border rounded-xl bg-white shadow-sm">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-bold text-lg hover:bg-muted/50 transition-colors rounded-t-xl">
          <div className="flex items-center gap-3">
            <Zap className={cn("h-5 w-5 transition-colors", autoAcceptEnabled ? "text-primary" : "text-muted-foreground")} />
            Auto-Accept Criteria
            {autoAcceptEnabled && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">ENABLED</Badge>}
          </div>
          <ChevronDown className={cn("h-5 w-5 transition-transform", autoAcceptEnabled && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 border-t space-y-6">
          <FormField<BookingFormValues, "auto_accept_criteria_json.enabled">
            control={form.control}
            name="auto_accept_criteria_json.enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable Auto-Accept</FormLabel>
                  <FormDescription>
                    Automatically award the bid if a carrier meets your predefined criteria.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {autoAcceptEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <FormField<BookingFormValues, "auto_accept_criteria_json.max_price">
                control={form.control}
                name="auto_accept_criteria_json.max_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Price (XAF)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Maximum acceptable bid" className="h-10" {...field} />
                    </FormControl>
                    <FormDescription>Award if bid is below this price.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<BookingFormValues, "auto_accept_criteria_json.min_rating">
                control={form.control}
                name="auto_accept_criteria_json.min_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">Min Carrier Rating <Star className="h-3 w-3 fill-amber-400 text-amber-400" /></FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 4.5" step="0.1" min="1" max="5" className="h-10" {...field} />
                    </FormControl>
                    <FormDescription>Award if carrier rating is above this.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<BookingFormValues, "auto_accept_criteria_json.max_delivery_days">
                control={form.control}
                name="auto_accept_criteria_json.max_delivery_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Delivery Days</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 3" className="h-10" {...field} />
                    </FormControl>
                    <FormDescription>Award if estimated delivery is within this many days.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}