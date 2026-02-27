"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  MapPin,
  Filter,
  Plus,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Clock,
  Briefcase,
  Maximize2,
  AlertCircle,
  Zap,
  Tag,
  Calendar,
  Weight,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { Shipment } from "@/lib/types/database";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BidSubmissionDialog } from "@/components/transporter/bidding/BidSubmissionDialog";
import { CarrierBiddingDashboard } from "@/components/transporter/bidding/CarrierBiddingDashboard";
import { BiddingAnalyticsPanel } from "@/components/transporter/bidding/BiddingAnalyticsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/CurrencyContext";
import { FeaturedBadge } from "@/components/ads/featured-badge";

export default function CarrierLoadsPage() {
  const t = useTranslations("transporterSubPages");
  const tCommon = useTranslations("common");
  const [loads, setLoads] = React.useState<Shipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchParams, setSearchParams] = React.useState({
    origin: "",
    destination: "",
    vehicleType: "all",
    weightRange: "all",
  });
  const [isPostTruckOpen, setIsPostTruckOpen] = React.useState(false);
  const [newTruck, setNewTruck] = React.useState({
    origin_location: "",
    destination_location: "",
    available_from: "",
    vehicle_type: "flatbed",
    capacity_kg: 0,
  });
  const [selectedLoad, setSelectedLoad] = React.useState<Shipment | null>(null);
  const [activeTab, setActiveTab] = React.useState("marketplace");

  const fetchLoads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("shipments")
        .select("*, bids(*)")
        .eq("status", "open_for_bidding");

      if (searchParams.origin) {
        query = query.ilike("pickup_location", `%${searchParams.origin}%`);
      }
      if (searchParams.destination) {
        query = query.ilike("delivery_location", `%${searchParams.destination}%`);
      }
      if (searchParams.vehicleType !== "all") {
        query = query.eq("preferred_vehicle_type", searchParams.vehicleType);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      const shipments = data || [];

      // Fetch subscription tiers for shippers
      const shipperIds = Array.from(new Set(shipments.map(s => s.shipper_user_id)));
      const { getBulkUserSubscriptionTiers } = await import("@/lib/subscription-helpers");
      const tierMap = await getBulkUserSubscriptionTiers(shipperIds);

      // Apply visibility boost and sort
      const boostedLoads = shipments.map(load => ({
        ...load,
        tier: tierMap[load.shipper_user_id]
      })).sort((a, b) => {
        const multA = a.tier?.visibility_multiplier || 1;
        const multB = b.tier?.visibility_multiplier || 1;

        if (multA !== multB) return multB - multA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setLoads(boostedLoads);
    } catch (error: any) {
      toast.error("Failed to fetch loads: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLoads();

    const channel = supabase
      .channel("open-shipments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shipments", filter: "status=eq.open_for_bidding" },
        () => {
          fetchLoads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchParams]);

  const handlePostTruck = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to post capacity.");
        return;
      }

      const { error } = await supabase.from("available_trucks").insert({
        ...newTruck,
        transporter_user_id: user.id,
        status: "active",
      });

      if (error) throw error;

      toast.success("Truck capacity posted successfully!");
      setIsPostTruckOpen(false);
    } catch (error: any) {
      toast.error("Failed to post truck: " + error.message);
    }
  };

  const handleSaveSearch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("saved_searches").insert({
        user_id: user.id,
        search_name: `${searchParams.origin || 'Any'} to ${searchParams.destination || 'Any'}`,
        filters: searchParams,
      });

      if (error) throw error;
      toast.success("Search saved!");
    } catch (error: any) {
      toast.error("Failed to save search: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden -m-6 md:-m-10">
      <div className="flex flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center justify-between">
            <TabsList className="bg-slate-100/50 p-1 rounded-xl">
              <TabsTrigger value="marketplace" className="rounded-lg font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {t("marketplace")}
              </TabsTrigger>
              <TabsTrigger value="my-bids" className="rounded-lg font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {t("myBids")}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {t("analytics")}
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                {t("liveConnection")}
              </div>
            </div>
          </div>

          <TabsContent value="marketplace" className="flex-1 min-h-0 m-0 p-0 border-none outline-none">
            <div className="flex h-full">
              <aside className="w-80 bg-white border-r border-slate-100 flex flex-col p-6 space-y-8 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">{t("searchFilters")}</h3>
                    <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 hover:bg-slate-50 font-bold text-primary" onClick={handleSaveSearch}>
                      {t("saveSearch")}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">{t("origin")}</label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary" />
                        <Input
                          placeholder={t("originPlaceholder")}
                          className="pl-9 bg-slate-50 border-slate-100 rounded-xl focus:bg-white h-11"
                          value={searchParams.origin}
                          onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">{t("destination")}</label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary" />
                        <Input
                          placeholder={t("destinationPlaceholder")}
                          className="pl-9 bg-slate-50 border-slate-100 rounded-xl focus:bg-white h-11"
                          value={searchParams.destination}
                          onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">{t("shipmentDetails")}</h3>
                  <div className="space-y-4">
                    <Select
                      value={searchParams.vehicleType}
                      onValueChange={(val) => setSearchParams({ ...searchParams, vehicleType: val })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium">
                        <SelectValue placeholder={tCommon("vehicleType")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">{tCommon("allVehicles")}</SelectItem>
                        <SelectItem value="flatbed">{tCommon("flatbedReefer")}</SelectItem>
                        <SelectItem value="box">{tCommon("boxTruck")}</SelectItem>
                        <SelectItem value="container">{tCommon("containerCarrier")}</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-primary/20 transition-all">
                        <span className="text-sm font-medium text-slate-600">{t("weightRange")}</span>
                        <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-primary/20 transition-all">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{t("thisWeek")}</span>
                        <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-auto">
                  <Dialog open={isPostTruckOpen} onOpenChange={setIsPostTruckOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold transition-all">
                        {t("postEmptyTruck")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black">{t("postAvailableCapacity")}</DialogTitle>
                        <DialogDescription>
                          {t("postCapacityDesc")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="origin" className="font-bold">{t("origin")}</Label>
                          <Input
                            id="origin"
                            placeholder="e.g. Douala"
                            className="rounded-xl h-11 bg-slate-50 border-slate-100"
                            value={newTruck.origin_location}
                            onChange={(e) => setNewTruck({ ...newTruck, origin_location: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="destination" className="font-bold">{t("destination")}</Label>
                          <Input
                            id="destination"
                            placeholder="e.g. Yaoundé"
                            className="rounded-xl h-11 bg-slate-50 border-slate-100"
                            value={newTruck.destination_location}
                            onChange={(e) => setNewTruck({ ...newTruck, destination_location: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="date" className="font-bold">{t("availableFrom")}</Label>
                            <Input
                              id="date"
                              type="date"
                              className="rounded-xl h-11 bg-slate-50 border-slate-100"
                              value={newTruck.available_from}
                              onChange={(e) => setNewTruck({ ...newTruck, available_from: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="type" className="font-bold">{tCommon("vehicleType")}</Label>
                            <Select
                              value={newTruck.vehicle_type}
                              onValueChange={(val) => setNewTruck({ ...newTruck, vehicle_type: val })}
                            >
                              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="flatbed">{tCommon("flatbed")}</SelectItem>
                                <SelectItem value="reefer">{tCommon("reefer")}</SelectItem>
                                <SelectItem value="box">{tCommon("boxTruck")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full h-12 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20" onClick={handlePostTruck}>
                          {t("postAvailability")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </aside>

              <div className="flex-1 relative bg-slate-100">
                <div className="absolute inset-0 bg-[url('/map-placeholder.png')] bg-cover bg-center">
                  <div className="absolute top-6 left-6 flex gap-4">
                    <Badge className="bg-white/90 backdrop-blur shadow-lg border-none text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2">
                      <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-black uppercase">{t("liveMarketplace")}</span>
                      <span className="font-black text-primary">{loads.length}</span>
                      <span className="text-[10px] text-emerald-500">+12% today</span>
                    </Badge>
                  </div>
                  <MapMarker x="40%" y="60%" label={`${loads.length} ${t("loads")}`} />
                  <MapMarker x="25%" y="75%" label="Douala" dot />
                </div>
              </div>

              <aside className="w-[450px] bg-white border-l border-slate-100 flex flex-col">
                <header className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{t("availableLoads")}</h3>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase">{tCommon("live")}</Badge>
                  </div>
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-fit h-8 border-none bg-transparent hover:bg-slate-50 font-bold text-slate-400 text-xs">
                      <SelectValue placeholder={t("sortBy")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{t("newestFirst")}</SelectItem>
                      <SelectItem value="price-high">{t("highestPrice")}</SelectItem>
                    </SelectContent>
                  </Select>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="p-10 text-center space-y-4">
                      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm font-bold text-slate-400">{tCommon("loading")}</p>
                    </div>
                  ) : loads.length === 0 ? (
                    <div className="p-10 text-center space-y-4">
                      <AlertCircle className="h-12 w-12 text-slate-200 mx-auto" />
                      <p className="text-sm font-bold text-slate-400">{t("noLoadsFound")}</p>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSearchParams({ origin: "", destination: "", vehicleType: "all", weightRange: "all" })}>
                        {t("clearFilters")}
                      </Button>
                    </div>
                  ) : (
                    loads.map((load) => (
                      <LoadCard
                        key={load.id}
                        load={load}
                        type={load.delivery_location.toLowerCase().includes('chad') || load.delivery_location.toLowerCase().includes('car') ? tCommon("international") : tCommon("localCameroon")}
                        refId={load.shipment_number}
                        origin={load.pickup_location}
                        dest={load.delivery_location}
                        freight={load.freight_type}
                        weight={`${load.weight_kg} kg`}
                        equip={load.preferred_vehicle_type}
                        price={load.bids?.[0]?.bid_amount || 0}
                        pickup={new Date(load.scheduled_pickup_date).toLocaleDateString()}
                        distance={tCommon("calculating")}
                        onAction={(l: Shipment) => setSelectedLoad(l)}
                        t={t}
                      />
                    ))
                  )}
                </div>

                <footer className="p-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <p>{t("showingAvailableLoads", { count: loads.length })}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg border-slate-100">{tCommon("previous")}</Button>
                    <Button size="sm" className="h-8 rounded-lg bg-primary">{tCommon("nextPage")}</Button>
                  </div>
                </footer>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="my-bids" className="flex-1 overflow-y-auto m-0 p-8 border-none outline-none bg-slate-50/20">
            <div className="max-w-5xl mx-auto">
              <CarrierBiddingDashboard />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-y-auto m-0 p-8 border-none outline-none bg-slate-50/20">
            <div className="max-w-6xl mx-auto">
              <BiddingAnalyticsPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedLoad && (
        <BidSubmissionDialog
          shipment={selectedLoad}
          open={!!selectedLoad}
          onOpenChange={(open) => !open && setSelectedLoad(null)}
          onSuccess={fetchLoads}
        />
      )}
    </div>
  );
}

function MapMarker({ x, y, label, dot, xOffset }: any) {
  return (
    <div className="absolute group" style={{ left: x, top: y }}>
      {dot ? (
        <div className="relative">
          <div className="h-4 w-4 bg-primary rounded-full border-2 border-white shadow-lg z-10"></div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl">
            {label}
            <div className="absolute bottom-[-1px] left-1/2 translate-x-[-50%] border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
          </div>
        </div>
      ) : (
        <div className={cn("flex flex-col items-center gap-1", xOffset && "translate-x-10 translate-y-10")}>
          <div className="bg-primary text-white rounded-2xl px-4 py-2 flex items-center gap-2 shadow-xl hover:scale-105 transition-transform cursor-pointer border-2 border-white/20">
            <Briefcase className="h-3 w-3" />
            <span className="text-[11px] font-black whitespace-nowrap">{label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadCard({ load, type, refId, origin, dest, freight, weight, equip, price, pickup, distance, urgent, onAction, t }: any) {
  const { convert, format } = useCurrency();
  const tier = (load as any).tier;
  const isSponsored = tier && (tier.tier_slug === 'silver' || tier.tier_slug === 'gold');

  return (
    <Card className={cn(
      "rounded-3xl border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all group overflow-hidden",
      isSponsored && "border-primary/20 bg-primary/5"
    )}>
      <CardContent className="p-6 space-y-6">
        <header className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-50 text-primary border-none text-[9px] font-black px-2 py-0.5">
                {type}
              </Badge>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                Ref: <span className="text-slate-600">{refId}</span>
              </span>
            </div>
            {tier && (
              <div className="flex items-center gap-2">
                <FeaturedBadge tierSlug={tier.tier_slug} size="sm" />
                {isSponsored && (
                  <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{t("sponsored")}</span>
                )}
              </div>
            )}
          </div>
          {(urgent || (load.bid_expires_at && new Date(load.bid_expires_at) < new Date(Date.now() + 2 * 60 * 60 * 1000))) && (
            <Badge className="bg-rose-50 text-rose-600 border-none text-[9px] font-black animate-pulse">
              {t("urgent")}
            </Badge>
          )}
        </header>

        <div className="flex gap-4">
          <div className="flex flex-col items-center py-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <div className="flex-1 w-px border-l-2 border-dotted border-slate-200 my-1"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">{origin}</h4>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 uppercase font-bold tracking-tight">
                <Clock className="h-3 w-3" /> {t("pickupTitle")}: {pickup}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">{dest}</h4>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 uppercase font-bold tracking-tight">
                <MapPin className="h-3 w-3" /> {distance}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("type")}</span>
            <p className="text-[11px] font-bold text-slate-700">{freight}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("weight")}</span>
            <p className="text-[11px] font-bold text-slate-700">{weight}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("equipment")}</span>
            <p className="text-[11px] font-bold text-slate-700 uppercase">{equip}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase">{t("currentBid")}</span>
              <span className="text-[12px] font-black text-primary">{format(convert(price))}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold border-slate-200" onClick={() => onAction?.(load)}>{t("details")}</Button>
          <Button className="flex-1 h-12 rounded-xl text-xs font-bold bg-primary shadow-lg shadow-primary/10" onClick={() => onAction?.(load)}>
            {t("quickBid")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}