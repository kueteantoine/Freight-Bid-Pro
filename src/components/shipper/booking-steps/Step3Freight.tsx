import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { BookingFormValues } from "@/lib/schemas/shipment-schema";
import { getTieredMatch } from "@/lib/utils/matching-utils";

interface Step3FreightProps {
  form: UseFormReturn<BookingFormValues>;
}

// These would ideally be fetched from the database
const SUGGESTED_FREIGHT_CATEGORIES = [
  "General Cargo", "Cocoa Beans", "Cement", "Electronics", "Construction Materials",
  "Perishable Goods", "Hazardous Materials", "Fragile Items", "Vehicles"
];

export function Step3Freight({ form }: Step3FreightProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleFreightTypeChange = (val: string) => {
    form.setValue("freight_type", val);

    if (val.length > 2) {
      let bestMatchLabel: string | null = null;
      let bestScore = 0;

      for (const cat of SUGGESTED_FREIGHT_CATEGORIES) {
        const match = getTieredMatch(val, cat);
        if (match.tier <= 3 && match.score > bestScore) {
          bestMatchLabel = cat;
          bestScore = match.score;
        }
      }

      // Don't suggest if it's already an exact match (Tier 1 or 2)
      if (bestMatchLabel && bestScore < 0.98) {
        setSuggestion(bestMatchLabel);
      } else {
        setSuggestion(null);
      }
    } else {
      setSuggestion(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">What are we shipping?</h2>
        <p className="text-muted-foreground">Details about the cargo help us find the right transporter.</p>
      </div>
      <div className="space-y-6">
        <FormField<BookingFormValues, "freight_type">
          control={form.control}
          name="freight_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Freight Type</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <Input
                    placeholder="e.g. Cocoa Beans, Cement, Electronics"
                    className="h-12"
                    {...field}
                    onChange={(e) => handleFreightTypeChange(e.target.value)}
                  />
                  {suggestion && (
                    <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg text-sm animate-in slide-in-from-top-1">
                      <AlertCircle className="w-4 h-4 text-primary" />
                      <span>Did you mean <strong>{suggestion}</strong>?</span>
                      <button
                        type="button"
                        onClick={() => {
                          form.setValue("freight_type", suggestion);
                          setSuggestion(null);
                        }}
                        className="ml-auto text-primary font-bold hover:underline"
                      >
                        Correct it
                      </button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-6">
          <FormField<BookingFormValues, "weight_kg">
            control={form.control}
            name="weight_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Weight</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type="number" className="h-12 pr-16" {...field} />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-muted p-1 rounded-md text-[10px] font-bold">
                      <span className="px-1.5 py-0.5 bg-background rounded shadow-sm text-primary">KG</span>
                      <span className="px-1.5 py-0.5 text-muted-foreground/50">LBS</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<BookingFormValues, "quantity">
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity / Units</FormLabel>
                <FormControl>
                  <Input type="number" className="h-12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4">
          <FormLabel>Dimensions (m)</FormLabel>
          <div className="grid grid-cols-3 gap-4">
            <FormField<BookingFormValues, "dimensions_json.length">
              control={form.control}
              name="dimensions_json.length"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" placeholder="L" {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField<BookingFormValues, "dimensions_json.width">
              control={form.control}
              name="dimensions_json.width"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" placeholder="W" {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField<BookingFormValues, "dimensions_json.height">
              control={form.control}
              name="dimensions_json.height"
              render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" placeholder="H" {...field} /></FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}