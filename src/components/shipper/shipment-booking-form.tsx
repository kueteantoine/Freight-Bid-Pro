"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  MapPin,
  Package,
  Truck,
  Calendar as CalendarIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Shield,
  FileText,
  Save,
  Clock,
  Upload,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "@/contexts/supabase-session-context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  createShipment,
  saveShipmentDraft,
  getShipmentDraft,
  saveShipmentTemplate,
  getShipmentTemplates
} from "@/app/actions/shipment-actions";

const bookingSchema = z.object({
  pickup_location: z.string().min(5, { message: "Pickup location is required" }),
  delivery_location: z.string().min(5, { message: "Delivery location is required" }),
  scheduled_pickup_date: z.string().min(1, { message: "Pickup date is required" }),
  scheduled_delivery_date: z.string().optional(),
  freight_type: z.string().min(2, { message: "Freight type is required" }),
  weight_kg: z.coerce.number().min(1, { message: "Weight must be at least 1kg" }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
  dimensions_json: z.object({
    length: z.coerce.number().min(0),
    width: z.coerce.number().min(0),
    height: z.coerce.number().min(0),
  }),
  preferred_vehicle_type: z.string().min(1, { message: "Preferred vehicle type is required" }),
  special_handling_requirements: z.string().optional(),
  insurance_required: z.boolean().default(false),
  insurance_value: z.coerce.number().default(0),
  loading_requirements: z.string().optional(),
  unloading_requirements: z.string().optional(),
  save_as_template: z.boolean().default(false),
  template_name: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const TRUCK_TYPES = [
  { id: "flatbed", label: "Flatbed", icon: Truck, description: "Open trailer for construction, machinery" },
  { id: "van", label: "Box Van", icon: Package, description: "Enclosed van for general consumer goods" },
  { id: "refrigerated", label: "Refrigerated", icon: CheckCircle2, description: "Temperature controlled for food/medical" },
  { id: "tanker", label: "Tanker", icon: ChevronDown, description: "For liquid bulk or hazardous materials" },
  { id: "curtainside", label: "Curtainside", icon: FileText, description: "Easy side-loading for pallets" },
  { id: "small_van", label: "Small Van", icon: Truck, description: "For small deliveries and courier service" },
];

export function ShipmentBookingForm() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const { user } = useSession();
  const router = useRouter();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      pickup_location: "",
      delivery_location: "",
      scheduled_pickup_date: "",
      scheduled_delivery_date: "",
      freight_type: "",
      weight_kg: 0,
      quantity: 1,
      dimensions_json: { length: 0, width: 0, height: 0 },
      preferred_vehicle_type: "van",
      special_handling_requirements: "",
      insurance_required: false,
      insurance_value: 0,
      loading_requirements: "",
      unloading_requirements: "",
      save_as_template: false,
      template_name: "",
    },
  });

  // Load draft and templates
  useEffect(() => {
    async function init() {
      if (!user) return;

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
  }, [user, form]);

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
    if (step === 2) fields = ["delivery_location", "scheduled_delivery_date"];
    if (step === 3) fields = ["freight_type", "weight_kg", "quantity"];
    if (step === 4) fields = ["preferred_vehicle_type"];

    const isValid = await form.trigger(fields);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit: SubmitHandler<BookingFormValues> = async (values) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Create Shipment
      await createShipment(values);

      // 2. Save as Template if checked
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
          { icon: Shield, label: "Review" }
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
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Where are we picking up?</h2>
                    <p className="text-muted-foreground">Provide the full address and scheduled time for pickup.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="pickup_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                              <Input placeholder="Enter pickup location (e.g. Akwa, Douala)" className="pl-10 h-12 text-lg" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                          <FormDescription>Use Google Maps autocomplete for better accuracy.</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scheduled_pickup_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduled Pickup Date & Time</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-primary" />
                              <Input type="datetime-local" className="pl-10 h-12 text-lg" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Where is it going?</h2>
                    <p className="text-muted-foreground">Enter the destination and expected delivery date.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="delivery_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                              <Input placeholder="Enter destination (e.g. Bastos, Yaoundé)" className="pl-10 h-12 text-lg" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scheduled_delivery_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Delivery Date (Optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                              <Input type="datetime-local" className="pl-10 h-12 text-lg" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>Leave blank if flexible.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">What are we shipping?</h2>
                    <p className="text-muted-foreground">Details about the cargo help us find the right carrier.</p>
                  </div>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="freight_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freight Type</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Cocoa Beans, Cement, Electronics" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="weight_kg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Weight (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
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
                        <FormField
                          control={form.control}
                          name="dimensions_json.length"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input type="number" placeholder="L" {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dimensions_json.width"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input type="number" placeholder="W" {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
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
              )}

              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Choose your vehicle</h2>
                    <p className="text-muted-foreground">What kind of truck does this load require?</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="preferred_vehicle_type"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormControl>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {TRUCK_TYPES.map((truck) => (
                              <div
                                key={truck.id}
                                onClick={() => field.onChange(truck.id)}
                                className={cn(
                                  "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group",
                                  field.value === truck.id
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-muted hover:border-primary/20 bg-background"
                                )}
                              >
                                <div className="flex gap-4 items-start">
                                  <div className={cn(
                                    "p-3 rounded-lg transition-colors",
                                    field.value === truck.id ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
                                  )}>
                                    <truck.icon className="w-6 h-6" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-bold flex items-center justify-between">
                                      {truck.label}
                                      {field.value === truck.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{truck.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Final Requirements</h2>
                    <p className="text-muted-foreground">Last few details before we post your load.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="insurance_required"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 shadow-sm">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-500" /> Freight Insurance Required
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">Protect your goods against damage or loss.</p>
                            </div>
                          </FormItem>
                        )}
                      />

                      {form.watch("insurance_required") && (
                        <FormField
                          control={form.control}
                          name="insurance_value"
                          render={({ field }) => (
                            <FormItem className="animate-in zoom-in-95 duration-300">
                              <FormLabel>Cargo Declared Value (XAF)</FormLabel>
                              <FormControl>
                                <Input type="number" className="h-10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <Save className="w-4 h-4" /> Save Preferences
                        </div>
                        <FormField
                          control={form.control}
                          name="save_as_template"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Save as reusable template</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        {form.watch("save_as_template") && (
                          <FormField
                            control={form.control}
                            name="template_name"
                            render={({ field }) => (
                              <FormItem className="animate-in slide-in-from-top-2 duration-300">
                                <FormControl>
                                  <Input placeholder="e.g. Weekly Cocoa Delivery" size={1} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="loading_requirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loading Instructions</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Specific loading requirements..." className="min-h-[80px]" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unloading_requirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unloading Instructions</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Specific unloading requirements..." className="min-h-[80px]" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
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

              {step < 5 ? (
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

      {/* Bulk Upload Trigger */}
      <div className="mt-16 pt-8 border-t flex flex-col items-center space-y-4">
        <p className="text-sm text-muted-foreground">Have many loads to post?</p>
        <Button variant="outline" className="gap-2 border-dashed border-2 px-8 py-6 h-auto">
          <Upload className="h-5 w-5 text-primary" />
          <div className="text-left">
            <div className="font-bold">Bulk Shipment Upload</div>
            <div className="text-xs text-muted-foreground">Import from CSV or Excel</div>
          </div>
        </Button>
      </div>
    </div>
  );
}