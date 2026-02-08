"use client";

import { useState, useEffect } from "react";
import {
    getPendingCustomFreightTypes,
    getPendingCustomVehicleTypes,
    promoteCustomType,
    mergeCustomType,
    flagCustomType
} from "@/app/actions/admin-curation-actions";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    CheckCircle, Merge, Flag, ArrowUpRight, Loader2
} from "lucide-react";
import { toast } from "sonner";

export function CurationDashboard() {
    const [loading, setLoading] = useState(true);
    const [freightTypes, setFreightTypes] = useState<any[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [freight, vehicles] = await Promise.all([
                getPendingCustomFreightTypes(),
                getPendingCustomVehicleTypes()
            ]);
            setFreightTypes(freight);
            setVehicleTypes(vehicles);
        } catch (error) {
            toast.error("Failed to load custom types");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handlePromote = async (type: "freight" | "vehicle", item: any) => {
        const confirm = window.confirm(`Promote "${item.name}" to standard?`);
        if (!confirm) return;

        try {
            await promoteCustomType(type, item.id, {
                category_name: item.name, // Adjust based on actual table schema
                is_active: true
            });
            toast.success("Type promoted to standard");
            loadData();
        } catch (error) {
            toast.error("Promotion failed");
        }
    };

    const handleMerge = async (type: "freight" | "vehicle", item: any) => {
        const targetId = window.prompt(`Enter standard ID to merge "${item.name}" into:`);
        if (!targetId) return;

        try {
            await mergeCustomType(type, item.id, targetId, item.name);
            toast.success("Types merged");
            loadData();
        } catch (error) {
            toast.error("Merge failed");
        }
    };

    const handleFlag = async (type: "freight" | "vehicle", item: any) => {
        try {
            await flagCustomType(type, item.id);
            toast.success("Type flagged");
            loadData();
        } catch (error) {
            toast.error("Flag failed");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Custom Type Curation</h1>
                    <p className="text-muted-foreground">Review and standardize custom types entered by users.</p>
                </div>
                <Button onClick={loadData} variant="outline">Refresh</Button>
            </div>

            <Tabs defaultValue="freight">
                <TabsList className="mb-4">
                    <TabsTrigger value="freight">
                        Freight Types
                        <Badge variant="secondary" className="ml-2">{freightTypes.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="vehicle">
                        Vehicle Types
                        <Badge variant="secondary" className="ml-2">{vehicleTypes.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="freight">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Freight Types</CardTitle>
                            <CardDescription>Custom freight categories waiting for review.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CurationTable
                                items={freightTypes}
                                type="freight"
                                onPromote={handlePromote}
                                onMerge={handleMerge}
                                onFlag={handleFlag}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vehicle">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Vehicle Types</CardTitle>
                            <CardDescription>Custom vehicle types waiting for review.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CurationTable
                                items={vehicleTypes}
                                type="vehicle"
                                onPromote={handlePromote}
                                onMerge={handleMerge}
                                onFlag={handleFlag}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function CurationTable({ items, type, onPromote, onMerge, onFlag }: any) {
    if (items.length === 0) {
        return <p className="text-center py-8 text-muted-foreground">No pending types to review.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Suggested Name</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item: any) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                            <Badge variant={item.usage_count > 10 ? "destructive" : "secondary"}>
                                {item.usage_count} uses
                            </Badge>
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => onPromote(type, item)}>
                                <ArrowUpRight className="w-4 h-4 mr-1" /> Promote
                            </Button>
                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => onMerge(type, item)}>
                                <Merge className="w-4 h-4 mr-1" /> Merge
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => onFlag(type, item)}>
                                <Flag className="w-4 h-4 mr-1" /> Flag
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
