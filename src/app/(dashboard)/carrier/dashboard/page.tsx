"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Truck,
  ArrowUpRight,
  Hourglass,
  Wrench,
  Search,
  Download,
  Share2,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function CarrierDashboardPage() {
  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, TransCam Logistics
          </h2>
          <p className="text-slate-500 mt-1">
            Here is what&apos;s happening with your fleet and bids today.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200 hover:bg-slate-50 group transition-all">
          <Download className="h-4 w-4 mr-2 text-slate-500 group-hover:text-primary transition-colors" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Fleet"
          value="45"
          trend="+2 new this month"
          icon={Truck}
          trendColor="text-emerald-500"
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <StatsCard
          title="In-Transit"
          value="28"
          trend="62% of fleet utilization"
          icon={Share2}
          trendColor="text-slate-400"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          statusDot="bg-emerald-500"
        />
        <StatsCard
          title="Idle"
          value="12"
          trend="Available for assignment"
          icon={Hourglass}
          trendColor="text-slate-400"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          statusDot="bg-amber-500"
        />
        <StatsCard
          title="Maintenance"
          value="5"
          trend="2 returning tomorrow"
          icon={Wrench}
          trendColor="text-slate-400"
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          statusDot="bg-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Quick Load Search</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search by city (e.g. Douala)"
                  className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white"
                />
              </div>
              <Select>
                <SelectTrigger className="h-14 md:w-[200px] rounded-2xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="All Truck Types" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                  <SelectItem value="box-truck">Box Truck</SelectItem>
                </SelectContent>
              </Select>
              <Button className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                Find Loads
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Active Bid Standings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-6 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Load ID / Route</TableHead>
                    <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center">Status</TableHead>
                    <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">My Bid (XAF)</TableHead>
                    <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">Top Bid (XAF)</TableHead>
                    <TableHead className="px-6 text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <BidRow
                    id="#CM-8821"
                    route="Douala → Yaoundé"
                    rank="2nd"
                    rankColor="bg-amber-50 text-amber-600"
                    myBid="450,000"
                    topBid="435,000"
                  />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold">Live Fleet Map</CardTitle>
              <Maximize2 className="h-4 w-4 text-slate-400 cursor-pointer" />
            </CardHeader>
            <CardContent className="p-0 relative">
              <div className="h-[280px] bg-slate-100 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=4.0511,9.7679&zoom=8&size=600x400&key=...')] bg-cover bg-center">
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden pb-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ActivityItem
                icon={CreditCard}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                title="Payment Received"
                sub="1,200,000 XAF for Load #CM-1029"
                time="2 hours ago"
              />
              <ActivityItem
                icon={AlertCircle}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                title="Outbid Alert"
                sub="You are no longer leading on #CM-8821"
                time="4 hours ago"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, trend, icon: Icon, trendColor, iconBg, iconColor, statusDot }: any) {
  return (
    <Card className="rounded-3xl border-slate-50 shadow-sm transition-all hover:shadow-lg group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110", iconBg)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          {statusDot && <span className={cn("h-2 w-2 rounded-full", statusDot)}></span>}
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">{value}</h3>
          <p className={cn("text-xs font-semibold", trendColor)}>{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BidRow({ id, route, rank, rankColor, myBid, topBid }: any) {
  return (
    <TableRow className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
      <TableCell className="px-6 py-5">
        <div className="space-y-1">
          <div className="text-sm font-bold text-primary hover:underline cursor-pointer">{id}</div>
          <div className="text-[12px] text-slate-500 font-medium">{route}</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className={cn("rounded-lg border-none font-bold text-[10px] px-2.5 py-1 uppercase tracking-tight", rankColor)}>
          Rank: {rank}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-bold text-slate-700">{myBid}</TableCell>
      <TableCell className="text-right font-black text-slate-900">{topBid}</TableCell>
      <TableCell className="px-6 text-right">
        <Button variant="link" className="text-primary font-bold h-auto p-0 hover:underline">Update Bid</Button>
      </TableCell>
    </TableRow>
  );
}

function ActivityItem({ icon: Icon, iconBg, iconColor, title, sub, time }: any) {
  return (
    <div className="flex gap-4">
      <div className={cn("p-3 rounded-xl h-fit shadow-sm", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-bold text-slate-900 leading-none">{title}</h4>
          <span className="text-[10px] font-medium text-slate-400">{time}</span>
        </div>
        <p className="text-[12px] text-slate-500 leading-[1.4]">{sub}</p>
      </div>
    </div>
  );
}