"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  DollarSign,
  Search,
  MapPin,
  ChevronRight,
  LayoutGrid,
  Zap,
  Quote,
  FileText,
  Truck,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ShipperDashboardPage() {
  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">
            Welcome back, Dangote Cement. You have 4 shipments arriving today.
          </p>
        </div>
        <Button className="rounded-xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold transition-all">
          <Plus className="h-5 w-5 mr-2" />
          Create New Shipment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Shipments"
          value="18"
          trend="4 arriving today"
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trendColor="text-blue-500"
        />
        <StatsCard
          title="Pending Bookings"
          value="5"
          trend="2 requiring attention"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          trendColor="text-amber-600"
          statusDot="bg-amber-500"
        />
        <StatsCard
          title="Total Spent (Mo)"
          value="XAF 4.2M"
          trend="+12% vs last mo"
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trendColor="text-emerald-500"
          trendUp
        />
        <StatsCard
          title="Avg. Transit Time"
          value="2.1 days"
          trend="-0.4 days improvement"
          icon={TrendingUp}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          trendColor="text-emerald-500"
        />
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions & Distribution Map */}
        <div className="space-y-8">
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <ActionButton icon={Zap} label="Book Load" color="bg-blue-50 text-blue-600" />
              <ActionButton icon={MapPin} label="Track" color="bg-emerald-50 text-emerald-600" />
              <ActionButton icon={Quote} label="Request Quote" color="bg-amber-50 text-amber-600" />
              <ActionButton icon={FileText} label="Invoices" color="bg-slate-50 text-slate-600" />
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Distribution</h3>
              <Maximize2 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="h-48 bg-slate-100 rounded-2xl bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=5,12&zoom=5&size=400x300&key=...')] bg-cover relative">
              <div className="absolute top-1/2 left-1/2 h-3 w-3 bg-primary border-2 border-white rounded-full shadow-lg"></div>
            </div>
          </Card>
        </div>

        {/* Recent Shipments Table */}
        <div className="lg:col-span-2">
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold">Recent Shipments</CardTitle>
              <Button variant="link" className="text-primary font-bold h-auto p-0">View All</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-6 font-bold text-slate-400 text-[10px] uppercase py-4">Ref / Route</TableHead>
                    <TableHead className="font-bold text-slate-400 text-[10px] uppercase">Carrier</TableHead>
                    <TableHead className="font-bold text-slate-400 text-[10px] uppercase text-center">Status</TableHead>
                    <TableHead className="px-6 text-right font-bold text-slate-400 text-[10px] uppercase">Est. Arrival</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <ShipmentRow
                    id="#CM-8812"
                    route="Douala → Garoua"
                    carrier="TransCam Logistics"
                    status="In-Transit"
                    statusColor="bg-blue-100 text-blue-700"
                    progress={65}
                    eta="Today, 18:30"
                  />
                  <ShipmentRow
                    id="#CM-7721"
                    route="Kribi → Yaoundé"
                    carrier="DHL Afrique"
                    status="Delivered"
                    statusColor="bg-emerald-100 text-emerald-700"
                    progress={100}
                    eta="Completed"
                  />
                  <ShipmentRow
                    id="#CM-9011"
                    route="Douala → Bamenda"
                    carrier="Moussa Log."
                    status="Delayed"
                    statusColor="bg-rose-100 text-rose-700"
                    progress={40}
                    eta="Tomorrow, 09:00"
                  />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, trend, trendUp, icon: Icon, iconBg, iconColor, trendColor, statusDot }: any) {
  return (
    <Card className="rounded-3xl border-slate-50 shadow-sm transition-all hover:shadow-lg group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110", iconBg)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          {statusDot ? (
            <span className={cn("h-2 w-2 rounded-full", statusDot)}></span>
          ) : (
            <Badge variant="outline" className={cn("rounded-lg border-none text-[10px] font-bold px-2 py-1", trendUp ? "bg-emerald-50 text-emerald-600" : iconBg.replace("bg-", "bg-").replace("50", "100"))}>
              {trendUp && <ArrowUpRight className="h-3 w-3 mr-1 inline" />}
              {trendUp === false && <ArrowDownRight className="h-3 w-3 mr-1 inline" />}
              {trend.split(" ")[0]}
            </Badge>
          )}
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <div className="flex flex-col">
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">{value}</h3>
            <p className={cn("text-[11px] font-bold", trendColor)}>{trend}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({ icon: Icon, label, color }: any) {
  return (
    <Button variant="ghost" className={cn("flex flex-col items-center justify-center h-28 rounded-2xl gap-3 transition-all hover:scale-105 active:scale-95 group border border-slate-50 shadow-sm", color)}>
      <div className="p-3 rounded-xl bg-white/50 group-hover:bg-white shadow-sm transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-xs font-black uppercase tracking-tighter">{label}</span>
    </Button>
  );
}

function ShipmentRow({ id, route, carrier, status, statusColor, progress, eta }: any) {
  return (
    <TableRow className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
      <TableCell className="px-6 py-5">
        <div className="space-y-1">
          <div className="text-sm font-bold text-primary hover:underline cursor-pointer">{id}</div>
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{route}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
            {carrier[0]}
          </div>
          <span className="text-sm font-bold text-slate-700">{carrier}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-2">
          <Badge variant="outline" className={cn("rounded-full border-none px-3 py-1 text-[10px] font-bold", statusColor)}>
            {status}
          </Badge>
          <div className="w-20">
            <Progress value={progress} className="h-1 bg-slate-100" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-6 text-right">
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-slate-900">{eta}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Arrival</span>
        </div>
      </TableCell>
    </TableRow>
  );
}