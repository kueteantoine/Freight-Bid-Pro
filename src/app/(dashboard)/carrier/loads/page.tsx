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

export default function CarrierLoadsPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden -m-6 md:-m-10">
      <div className="flex flex-1 min-h-0">

        {/* Left Sidebar: Filters */}
        <aside className="w-80 bg-white border-r border-slate-100 flex flex-col p-6 space-y-8 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Search Filters</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Origin</label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary" />
                  <Input placeholder="Origin city or port" className="pl-9 bg-slate-50 border-slate-100 rounded-xl focus:bg-white h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Destination</label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary" />
                  <Input placeholder="Destination" className="pl-9 bg-slate-50 border-slate-100 rounded-xl focus:bg-white h-11" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Shipment Details</h3>
            <div className="space-y-4">
              <Select defaultValue="flatbed">
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium">
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="flatbed">Flatbed / Reefer</SelectItem>
                  <SelectItem value="box">Box Truck</SelectItem>
                  <SelectItem value="container">Container Carrier</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-primary/20 transition-all">
                  <span className="text-sm font-medium text-slate-600">Weight Range</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-primary/20 transition-all">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Date: This Week</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold transition-all">
              Post Empty Truck
            </Button>
          </div>
        </aside>

        {/* Middle Section: Map */}
        <div className="flex-1 relative bg-slate-100">
          <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=6.5,12&zoom=6&size=1000x800&key=...')] bg-cover bg-center">
            {/* Map UI Elements */}
            <div className="absolute top-6 left-6 flex gap-4">
              <Badge className="bg-white/90 backdrop-blur shadow-lg border-none text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2">
                <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-black uppercase">Live Marketplace</span>
                <span className="font-black text-primary">1,284</span>
                <span className="text-[10px] text-emerald-500">+12% today</span>
              </Badge>
            </div>

            {/* Map Markers */}
            <MapMarker x="40%" y="60%" label="12 Loads" />
            <MapMarker x="65%" y="45%" label="4 Loads" xOffset />
            <MapMarker x="25%" y="75%" label="Douala" dot />

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <Button size="icon" className="h-10 w-10 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-600 hover:bg-slate-50">
                <Plus className="h-5 w-5" />
              </Button>
              <Button size="icon" className="h-10 w-10 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-600 hover:bg-slate-50">
                <div className="h-0.5 w-3 bg-slate-600"></div>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Available Loads List */}
        <aside className="w-[450px] bg-white border-l border-slate-100 flex flex-col">
          <header className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">Available Loads</h3>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase">Live</Badge>
            </div>
            <Select defaultValue="newest">
              <SelectTrigger className="w-fit h-8 border-none bg-transparent hover:bg-slate-50 font-bold text-slate-400 text-xs">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-high">Highest Price</SelectItem>
              </SelectContent>
            </Select>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <LoadCard
              type="INTERNATIONAL"
              refId="#LK-9021"
              origin="Douala Port, Cameroon"
              dest="N'Djamena, Chad"
              freight="General Cargo"
              weight="24.5 Tons"
              equip="Flatbed"
              price="1,450,000"
              currentBid="1,320,000"
              pickup="Tomorrow, 08:00"
              distance="1,240 km"
            />
            <LoadCard
              type="LOCAL CAMEROON"
              typeColor="text-orange-600 bg-orange-50"
              refId="#LK-4410"
              origin="Yaoundé (Industrial Zone)"
              dest="Bafoussam, Cameroon"
              freight="Perishables"
              weight="12.0 Tons"
              equip="Refrigerated"
              price="480,000"
              currentBid="400,000"
              pickup="Today, ASAP"
              distance="290 km"
              urgent
            />
            <LoadCard
              type="INTERNATIONAL"
              refId="#LK-5582"
              origin="Kribi Deep Sea Port, CM"
              dest="Bangui, CAR"
              freight="Heavy Machinery"
              weight="45.0 Tons"
              equip="Lowboy"
              price="2,800,000"
              currentBid="2,450,000"
              pickup="In 2 Days"
              distance="1,180 km"
            />
          </div>

          <footer className="p-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
            <p>Showing 3 of 1,284 available loads</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 rounded-lg border-slate-100">Previous</Button>
              <Button size="sm" className="h-8 rounded-lg bg-primary">Next Page</Button>
            </div>
          </footer>
        </aside>

      </div>
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

function LoadCard({ type, typeColor, refId, origin, dest, freight, weight, equip, price, currentBid, pickup, distance, urgent }: any) {
  return (
    <Card className="rounded-3xl border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all group overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <header className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Badge className={cn("bg-blue-50 text-primary border-none text-[9px] font-black px-2 py-0.5", typeColor)}>
              {type}
            </Badge>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
              Ref: <span className="text-slate-600">{refId}</span>
            </span>
          </div>
          {urgent && (
            <Badge className="bg-rose-50 text-rose-600 border-none text-[9px] font-black animate-pulse">
              EXPIRING IN 2H
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
                <Clock className="h-3 w-3" /> Pickup: {pickup}
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
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Type</span>
            <p className="text-[11px] font-bold text-slate-700">{freight}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">General Cargo</span>
            <p className="text-[11px] font-bold text-slate-700">{weight}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Equipment</span>
            <p className="text-[11px] font-bold text-slate-700">{equip}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-all">
            <div className="flex justify-between mb-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Buy It Now</span>
              <span className="text-[12px] font-black text-emerald-600">CFA {price}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Current Bid</span>
              <span className="text-[12px] font-bold text-slate-900">CFA {currentBid}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold border-slate-200">Details</Button>
          <Button className="flex-1 h-12 rounded-xl text-xs font-bold bg-primary shadow-lg shadow-primary/10">
            {price === currentBid ? "Accept Offer" : "Quick Bid"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}