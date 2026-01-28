"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Clock,
  Wallet,
  Navigation,
  Bell,
  Menu,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  Box,
  Map as MapIcon,
  Phone,
  MessageCircle,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DriverDashboardPage() {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="max-w-lg mx-auto space-y-8 pb-20">
      {/* Driver Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/10 shadow-sm">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-none">Hello, Amadou!</h2>
            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Driver #D-9021 • TransCam Logistics</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-black text-[10px] border-none transition-all", isOnline ? "bg-emerald-50 text-emerald-600 animate-pulse" : "bg-slate-100 text-slate-400")}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Badge>
          <Switch checked={isOnline} onCheckedChange={setIsOnline} className="data-[state=checked]:bg-emerald-500" />
        </div>
      </div>

      {/* Current Job Card */}
      <Card className="rounded-[40px] border-slate-100 shadow-xl overflow-hidden bg-white group border-2 border-primary/5">
        <CardContent className="p-0">
          <div className="bg-primary p-8 text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] h-40 w-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <Badge className="bg-white/20 text-white border-none font-black text-[10px] px-2">ACTIVE TRIP</Badge>
                <h3 className="text-2xl font-black tracking-tighter">Load #CM-8812</h3>
              </div>
              <Button size="icon" className="rounded-2xl bg-white text-primary hover:bg-slate-50 shadow-xl">
                <QrCode className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex gap-4 relative z-10">
              <div className="flex flex-col items-center py-1">
                <div className="h-3 w-3 rounded-full bg-white ring-4 ring-white/20"></div>
                <div className="flex-1 w-px border-l-2 border-dotted border-white/40 my-1"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"></div>
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-white/60 mb-1">Pickup</p>
                  <h4 className="text-sm font-bold leading-tight">Douala Port, Berth 4</h4>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/60 mb-1">Destination</p>
                  <h4 className="text-sm font-bold leading-tight">Yaoundé Industrial Zone</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Est. Delivery</p>
                  <p className="text-sm font-black text-slate-900">Today, 17:45</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-400">
                  <Navigation className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Distance Left</p>
                  <p className="text-sm font-black text-slate-900">142 km</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-14 rounded-3xl border-slate-200 font-bold text-slate-600">
                <Phone className="h-4 w-4 mr-2" /> Call
              </Button>
              <Link href="/driver/pod" className="flex-1">
                <Button className="w-full h-14 rounded-3xl bg-primary shadow-lg shadow-primary/20 font-black tracking-tight transition-all active:scale-95">
                  Update Status
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-6">
        <SmallStat label="Month Trips" value="24" icon={Truck} color="text-blue-500" bg="bg-blue-50" />
        <SmallStat label="Earned (Mo)" value="XAF 125K" icon={Wallet} color="text-emerald-500" bg="bg-emerald-50" />
      </div>

      {/* Upcoming Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-slate-900">Upcoming Assignments</h3>
          <Button variant="link" className="text-primary font-bold text-xs">View All</Button>
        </div>
        <div className="space-y-4">
          <JobItem id="#CM-9021" route="Yaoundé → Douala" time="Tom, 08:00" />
          <JobItem id="#CM-9042" route="Douala → Kribi" time="Oct 30, 09:00" />
        </div>
      </div>
    </div>
  );
}

function SmallStat({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={cn("p-3 rounded-2xl shrink-0", bg)}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-0.5">{label}</p>
        <p className="text-sm font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function JobItem({ id, route, time }: any) {
  return (
    <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Box className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 leading-none">{id}</h4>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{route}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-black text-slate-900">{time}</p>
        <ChevronRight className="h-4 w-4 text-slate-200 ml-auto mt-1 group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
}