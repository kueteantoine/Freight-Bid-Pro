import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Shield, Save, Eye, MapPin } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";
import { cn } from "@/lib/utils";

interface Step6ReviewPostProps {
  form: UseFormReturn<BookingFormValues>;
}

export function Step7ReviewPost({ form }: Step6ReviewPostProps) {
  const saveAsTemplate = form.watch("save_as_template");
  const values = form.getValues();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Review & Finalize</h2>
        <p className="text-muted-foreground">Confirm all details before posting to the marketplace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logistics Summary */}
        <Card className="border-primary/20 bg-primary/5 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase font-bold">Pickup</p>
              <p className="font-semibold line-clamp-1">{values.pickup_location}</p>
              <p className="text-xs text-muted-foreground">{new Date(values.scheduled_pickup_date).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase font-bold">Delivery</p>
              <p className="font-semibold line-clamp-1">{values.delivery_location}</p>
              {values.scheduled_delivery_date && (
                <p className="text-xs text-muted-foreground">{new Date(values.scheduled_delivery_date).toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cargo Summary */}
        <Card className="border-muted shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Eye className="h-4 w-4" /> Cargo & Bidding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Freight:</span>
              <span className="font-semibold">{values.freight_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight/Qty:</span>
              <span className="font-semibold">{values.weight_kg}kg / {values.quantity} units</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Auction:</span>
              <span className="font-semibold capitalize">{values.auction_type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance:</span>
              <span className={cn("font-bold", values.insurance_required ? "text-blue-600" : "text-muted-foreground")}>
                {values.insurance_required ? `XAF ${values.insurance_value.toLocaleString()}` : "Not Required"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Template Section */}
      <Card className="border-dashed bg-muted/20">
        <CardContent className="pt-6 space-y-4">
          <FormField<BookingFormValues, "save_as_template">
            control={form.control}
            name="save_as_template"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-base font-bold flex items-center gap-2">
                    <Save className="w-4 h-4 text-primary" /> Save as reusable template
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {saveAsTemplate && (
            <FormField<BookingFormValues, "template_name">
              control={form.control}
              name="template_name"
              render={({ field }) => (
                <FormItem className="animate-in slide-in-from-top-2 duration-300">
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Weekly Cocoa Delivery" className="h-11 bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}