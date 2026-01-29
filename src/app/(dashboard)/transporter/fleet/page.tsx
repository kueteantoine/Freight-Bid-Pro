"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Truck,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    MoreVertical,
    MapPin,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    Download,
    Fuel,
    ChevronRight
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function FleetManagementPage() {
    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Fleet Overview</h2>
                    <p className="text-slate-500 mt-1">
                        Manage your 42 registered vehicles and their current deployment.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200 hover:bg-slate-50 transition-all">
                        <Download className="h-4 w-4 mr-2 text-slate-500" />
                        Export Data
                    </Button>
                    <Button className="rounded-xl h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vehicle
                    </Button>
                </div>
            </div>

            {/* Fleet Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <FleetStatsCard
                    title="Total Trucks"
                    value="42"
                    trend="+2 this mo"
                    trendUp={true}
                    icon={Truck}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <FleetStatsCard
                    title="In-Transit"
                    value="28"
                    trend="+5% active"
                    trendUp={true}
                    icon={CheckCircle2}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                />
                <FleetStatsCard
                    title="Idle / Available"
                    value="10"
                    trend="-3% idle"
                    trendUp={false}
                    icon={Clock}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                />
                <FleetStatsCard
                    title="Maintenance"
                    value="4"
                    trend="4 pending"
                    trendUp={false}
                    icon={AlertCircle}
                    iconBg="bg-rose-50"
                    iconColor="text-rose-600"
                />
            </div>

            {/* Vehicle Table Section */}
            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-6">
                    <Tabs defaultValue="all" className="w-full md:w-auto">
                        <TabsList className="bg-slate-100/50 p-1 rounded-xl h-12">
                            <TabsTrigger value="all" className="rounded-lg px-6 font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white transition-all">All Status</TabsTrigger>
                            <TabsTrigger value="transit" className="rounded-lg px-6 font-bold text-xs transition-all">In-Transit</TabsTrigger>
                            <TabsTrigger value="idle" className="rounded-lg px-6 font-bold text-xs transition-all">Idle</TabsTrigger>
                            <TabsTrigger value="maintenance" className="rounded-lg px-6 font-bold text-xs transition-all">Maintenance</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input placeholder="Search plate, driver..." className="pl-9 h-11 w-64 bg-slate-50 border-slate-100 rounded-xl focus:bg-white" />
                        </div>
                        <Button variant="outline" className="h-11 rounded-xl border-slate-100 font-bold text-xs">
                            <Filter className="h-4 w-4 mr-2 text-slate-400" />
                            Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="px-8 font-bold text-slate-400 text-[10px] uppercase tracking-wider py-4">Vehicle Details</TableHead>
                                <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Assigned Driver</TableHead>
                                <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Current Location</TableHead>
                                <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Status</TableHead>
                                <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Activity</TableHead>
                                <TableHead className="px-8 text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <VehicleRow
                                plate="CE-234-LT"
                                model="Mercedes-Benz Actros 3340"
                                driverName="Samuel Moukandjo"
                                location="Douala, Cameroon"
                                status="In-Transit"
                                statusColor="bg-emerald-100 text-emerald-700"
                                progress={75}
                            />
                            <VehicleRow
                                plate="LT-982-AA"
                                model="Scania G400 6×4"
                                driverName="Unassigned"
                                location="Yaoundé Terminal"
                                status="Idle"
                                statusColor="bg-amber-100 text-amber-700"
                                activity="Parked since 14h"
                                canAssign
                            />
                            <VehicleRow
                                plate="OU-551-TR"
                                model="Howo Sinotruk 371"
                                driverName="Blaise Njoya"
                                location="N'Djamena, Chad"
                                status="Maintenance"
                                statusColor="bg-rose-100 text-rose-700"
                                activity="Engine Fault"
                                warning
                            />
                        </TableBody>
                    </Table>
                    <div className="p-6 border-t border-slate-50 flex items-center justify-between text-sm text-slate-400">
                        <p>Showing 10 of 42 vehicles</p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="rounded-lg h-9">Previous</Button>
                            <Button variant="outline" size="sm" className="rounded-lg h-9 border-slate-100">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Maintenance Reminders</h3>
                        <Button variant="link" className="text-primary font-bold h-auto p-0">View All</Button>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-4">
                            <div className="p-3 bg-white rounded-xl h-fit border border-rose-100">
                                <AlertCircle className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 leading-tight">CE-112-LT • Brake Inspection</h4>
                                <p className="text-xs font-bold text-rose-500 mt-1 uppercase">Overdue by 2 days</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4">
                            <div className="p-3 bg-white rounded-xl h-fit border border-slate-100">
                                <Fuel className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 leading-tight">QU-902-MK • Regular Oil Change</h4>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Scheduled for Oct 30</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold">Active Corridors</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Real-time GPS distribution</p>
                        </div>
                        <Button variant="outline" className="rounded-xl h-9 text-xs font-bold border-slate-100 text-primary">Open Full Map</Button>
                    </div>
                    <div className="h-48 bg-slate-100 rounded-2xl bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=10,15&zoom=4&size=600x400&key=...')] bg-cover relative">
                        <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-4 py-2 rounded-full border border-slate-100 shadow-sm">Cameroon-Chad Border Region</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function FleetStatsCard({ title, value, trend, trendUp, icon: Icon, iconBg, iconColor }: any) {
    return (
        <Card className="rounded-3xl border-slate-50 shadow-sm hover:shadow-lg transition-all group">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", iconBg)}>
                        <Icon className={cn("h-6 w-6", iconColor)} />
                    </div>
                    <Badge variant="outline" className={cn("rounded-lg border-none text-[10px] font-bold px-2 py-1", trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {trend}
                    </Badge>
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <div className="flex items-center gap-2">
                        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</h3>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function VehicleRow({ plate, model, driverName, location, status, statusColor, progress, activity, warning, canAssign }: any) {
    return (
        <TableRow className="hover:bg-slate-50/50 transition-colors border-slate-50 group">
            <TableCell className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-primary/10 transition-colors">
                        <Truck className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">{plate}</div>
                        <div className="text-[12px] text-slate-500 font-medium mt-0.5">{model}</div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                {driverName === "Unassigned" ? (
                    <span className="text-sm italic text-slate-400">{driverName}</span>
                ) : (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{driverName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-slate-700 leading-tight">{driverName}</span>
                    </div>
                )}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                    <MapPin className="h-4 w-4 text-primary" />
                    {location}
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className={cn("rounded-full border-none px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 w-fit", statusColor)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", statusColor.replace("bg-", "bg-").replace("100", "500"))}></span>
                    {status}
                </Badge>
            </TableCell>
            <TableCell>
                {progress ? (
                    <div className="w-24 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400">{progress}% of Route</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-slate-100" />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        {warning && <AlertCircle className="h-3 w-3 text-rose-500" />}
                        {activity}
                    </div>
                )}
            </TableCell>
            <TableCell className="px-8 text-right">
                {canAssign ? (
                    <Button variant="link" className="text-primary font-bold text-xs p-0 h-auto hover:underline">
                        Assign Driver
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}
