"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Truck,
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
    Loader2
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { vehicleService } from "@/lib/services/vehicle-service";
import { Vehicle } from "@/lib/types/database";
import { AddVehicleDialog } from "@/components/transporter/fleet/AddVehicleDialog";
import { BulkVehicleImport } from "@/components/transporter/fleet/BulkVehicleImport";
import { toast } from "sonner";

export default function FleetManagementPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchVehicles = async () => {
        setIsLoading(true);
        try {
            const data = await vehicleService.getMyVehicles();
            setVehicles(data);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
            toast.error("Failed to load fleet data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const filteredVehicles = vehicles.filter(v => {
        const matchesStatus = filterStatus === "all" || v.status === filterStatus;
        const matchesSearch = v.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.model.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: vehicles.length,
        active: vehicles.filter(v => v.status === "active").length,
        maintenance: vehicles.filter(v => v.status === "maintenance").length,
        inactive: vehicles.filter(v => v.status === "inactive").length,
    };

    if (isLoading && vehicles.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-slate-500 font-medium">Loading your fleet...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Fleet Overview</h2>
                    <p className="text-slate-500 mt-1">
                        Manage your {stats.total} registered vehicles and their current deployment.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200 hover:bg-slate-50 transition-all">
                        <Download className="h-4 w-4 mr-2 text-slate-500" />
                        Export Data
                    </Button>
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="rounded-xl h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vehicle
                    </Button>
                </div>
            </div>

            {/* Fleet Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <FleetStatsCard
                    title="Total Trucks"
                    value={stats.total.toString()}
                    trend="Fleet size"
                    trendUp={true}
                    icon={Truck}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <FleetStatsCard
                    title="Active"
                    value={stats.active.toString()}
                    trend="Ready for loads"
                    trendUp={true}
                    icon={CheckCircle2}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                />
                <FleetStatsCard
                    title="Available"
                    value={stats.active.toString()} // Simplified for now
                    trend="Not on trip"
                    trendUp={true}
                    icon={Clock}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                />
                <FleetStatsCard
                    title="Maintenance"
                    value={stats.maintenance.toString()}
                    trend="In service"
                    trendUp={false}
                    icon={AlertCircle}
                    iconBg="bg-rose-50"
                    iconColor="text-rose-600"
                />
            </div>

            {/* Vehicle Table Section */}
            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-6">
                    <Tabs defaultValue="all" onValueChange={setFilterStatus} className="w-full md:w-auto">
                        <TabsList className="bg-slate-100/50 p-1 rounded-xl h-12">
                            <TabsTrigger value="all" className="rounded-lg px-6 font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white transition-all">All Status</TabsTrigger>
                            <TabsTrigger value="active" className="rounded-lg px-6 font-bold text-xs transition-all">Active</TabsTrigger>
                            <TabsTrigger value="maintenance" className="rounded-lg px-6 font-bold text-xs transition-all">Maintenance</TabsTrigger>
                            <TabsTrigger value="inactive" className="rounded-lg px-6 font-bold text-xs transition-all">Inactive</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search plate, model..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-11 w-64 bg-slate-50 border-slate-100 rounded-xl focus:bg-white"
                            />
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
                                <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Type</TableHead>
                                <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Status</TableHead>
                                <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Capacity</TableHead>
                                <TableHead className="px-8 text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVehicles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                                        No vehicles found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredVehicles.map((vehicle) => (
                                    <VehicleRow
                                        key={vehicle.id}
                                        vehicle={vehicle}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <div className="p-6 border-t border-slate-50 flex items-center justify-between text-sm text-slate-400">
                        <p>Showing {filteredVehicles.length} of {stats.total} vehicles</p>
                    </div>
                </CardContent>
            </Card>

            <AddVehicleDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={fetchVehicles}
            />

            <div className="mt-12">
                <BulkVehicleImport onImportSuccess={fetchVehicles} />
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

function VehicleRow({ vehicle }: { vehicle: Vehicle }) {
    const statusConfig = {
        active: { color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
        maintenance: { color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
        inactive: { color: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
    };

    const config = statusConfig[vehicle.status as keyof typeof statusConfig] || statusConfig.inactive;

    return (
        <TableRow className="hover:bg-slate-50/50 transition-colors border-slate-50 group">
            <TableCell className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-primary/10 transition-colors">
                        <Truck className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">{vehicle.license_plate}</div>
                        <div className="text-[12px] text-slate-500 font-medium mt-0.5">{vehicle.make} {vehicle.model} ({vehicle.year})</div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <span className="text-sm italic text-slate-400">Unassigned</span>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                    {vehicle.vehicle_type}
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className={cn("rounded-full border-none px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 w-fit", config.color)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)}></span>
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="w-24 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400">{vehicle.capacity_kg.toLocaleString()} kg</span>
                </div>
            </TableCell>
            <TableCell className="px-8 text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
}
