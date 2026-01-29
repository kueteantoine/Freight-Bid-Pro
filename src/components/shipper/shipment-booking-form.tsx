"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  Clock,
  DollarSign,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  createShipment,
  saveShipmentDraft,
  getShipmentDraft,
  saveShipmentTemplate,
  getShipmentTemplates
} from "@/app/actions/shipment-actions";
import { bookingSchema, BookingFormValues } from "@/lib/schemas/shipment-schema";
import { User } from "@supabase/supabase-js";

// Import Step Components
import { Step1Pickup } from "./booking-steps/Step1Pickup";
import { Step2Delivery } from "./booking-steps/Step2Delivery";
import { Step3Freight } from "./booking-steps/Step3Freight";
import { Step4Vehicle } from "./booking-steps/Step4Vehicle";
import { Step5AdditionalRequirements } from "./booking-steps/Step5AdditionalRequirements";
import { Step5Bidding as Step6Bidding } from "./booking-steps/Step5Bidding";
import { Step7ReviewPost } from "./booking-steps/Step6ReviewPost";

const STEP_COMPONENTS: Record<number, React.FC<{ form: any }>> = {
  1: Step1Pickup,
  2: Step2Delivery,
  3: Step3Freight,
  4: Step4Vehicle,
  5: Step5AdditionalRequirements,
  6: Step6Bidding,
  7: Step7ReviewPost,
};

// Import Bulk Upload Modal
import { BulkUploadModal } from "./BulkUploadModal";

export function ShipmentBookingForm() {
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const router = useRouter();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      pickup_location: "",
      pickup_latitude: undefined,
      pickup_longitude: undefined,
      delivery_location: "",
      delivery_latitude: undefined,
      delivery_longitude: undefined,
      scheduled_pickup_date: "",
      scheduled_delivery_date: "",
      freight_type: "",
      weight_kg: 0,
      quantity: 1,
      dimensions_json: { length: 0, width: 0, height: 0 },
      preferred_vehicle_type: "box_van",
      special_equipment_needs: "",
      special_handling_requirements: "",
      insurance_required: false,
      insurance_value: 0,
      loading_requirements: "",
      unloading_requirements: "",
      save_as_template: false,
      template_name: "",
      auction_type: "standard",
      bidding_duration_minutes: 60,
      min_bid_increment: 1000,
      reserve_price: undefined,
      buy_it_now_price: undefined,
      marketplace_visibility: "public",
    },
  });

  // Load user, draft and templates
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setIsDraftLoading(false);
        return;
      }

      try {
        const [draft, loadedTemplates] = await Promise.all([
          getShipmentDraft(),
          getShipmentTemplates()
        ]);

        if (draft) {
          form.reset(draft);
          toast.info("Resumed from your last draft.");
        }

        setTemplates(loadedTemplates);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setIsDraftLoading(false);
      }
    }
    init();
  }, [form]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const values = form.getValues();
      saveShipmentDraft(values);
      setLastSaved(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [user, form]);

  const nextStep = async () => {
    let fields: (keyof BookingFormValues)[] = [];
    if (step === 1) fields = ["pickup_location", "scheduled_pickup_date"];
    if (step === 2) fields = ["delivery_location"];
    if (step === 3) fields = ["freight_type", "weight_kg", "quantity"];
    if (step === 4) fields = ["preferred_vehicle_type"];
    if (step === 5) fields = ["insurance_required", "insurance_value"];
    if (step === 6) fields = ["auction_type"];

    const isValid = await form.trigger(fields as any);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit: SubmitHandler<BookingFormValues> = async (values) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await createShipment(values);

      if (values.save_as_template && values.template_name) {
        await saveShipmentTemplate({
          template_name: values.template_name,
          ...values
        });
      }

      toast.success("Shipment posted to marketplace!");
      router.push("/shipper/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to post shipment.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = (template: any) => {
    form.reset(template);
    setStep(1);
    toast.success(`Loaded template: ${template.template_name}`);
  };

  if (isDraftLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading your booking session...</p>
      </div>
    );
  }

  const CurrentStepComponent = STEP_COMPONENTS[step];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Templates Section */}
      {templates.length > 0 && (
        <Card className="mb-8 border-dashed border-2 bg-muted/30">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pb-4">
            {templates.slice(0, 5).map((t) => (
              <Button
                key={t.id}
                variant="outline"
                size="sm"
                onClick={() => loadTemplate(t)}
                className="bg-background"
              >
                {t.template_name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Draft Status */}
      {lastSaved && (
        <div className="flex justify-end mb-4 overflow-hidden">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full animate-in fade-in slide-in-from-top-1">
            <Save className="w-3 h-3" /> Auto-saved at {lastSaved.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Multi-step Header */}
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-6 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
        {[
          { icon: MapPin, label: "Pickup" },
          { icon: MapPin, label: "Delivery" },
          { icon: Package, label: "Freight" },
          { icon: Truck, label: "Vehicle" },
          { icon: Shield, label: "Addons" },
          { icon: DollarSign, label: "Bidding" },
          { icon: CheckCircle2, label: "Post" }
        ].map((item, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-2 bg-background transition-all duration-500",
              step > i + 1 ? "border-green-500 bg-green-500 text-white" :
                step === i + 1 ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg" :
                  "border-muted text-muted-foreground"
            )}>
              {step > i + 1 ? <CheckCircle2 className="w-6 h-6" /> : <item.icon className="w-6 h-6" />}
            </div>
            <span className={cn(
              "mt-3 text-[10px] font-bold uppercase tracking-tighter sm:tracking-wider transition-colors duration-300",
              step === i + 1 ? "text-primary font-extrabold" : "text-muted-foreground/60"
            )}>{item.label}</span>
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-none shadow-2xl bg-card">
            <CardContent className="pt-8 px-6 sm:px-10">
              {CurrentStepComponent && <CurrentStepComponent form={form} />}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center px-2">
            <div>
              {step === 1 ? (
                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              ) : (
                <Button type="button" variant="outline" size="lg" onClick={prevStep} className="px-8 shadow-sm">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="hidden sm:flex gap-2"
                onClick={() => {
                  saveShipmentDraft(form.getValues());
                  toast.success("Progress saved as draft!");
                }}
              >
                <Save className="h-4 w-4" /> Save Draft
              </Button>

              {step < 7 ? (
                <Button type="button" size="lg" onClick={nextStep} className="px-8 shadow-lg transition-all hover:scale-105">
                  Next Step <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" size="lg" disabled={isLoading} className="px-12 bg-green-600 hover:bg-green-700 shadow-lg transition-all hover:scale-105 active:scale-95">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Post to Marketplace</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>

      <div className="mt-16 pt-8 border-t flex flex-col items-center space-y-4">
        <p className="text-sm text-muted-foreground">Have many loads to post?</p>
        <BulkUploadModal />
      </div>
    </div>
  );
}