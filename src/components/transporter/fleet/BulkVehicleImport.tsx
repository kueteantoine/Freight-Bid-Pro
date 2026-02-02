"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileDown, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { vehicleService } from "@/lib/services/vehicle-service";

export function BulkVehicleImport({ onImportSuccess }: { onImportSuccess: () => void }) {
    const [isUploading, setIsUploading] = useState(false);
    const [importData, setImportData] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "text/csv") {
            toast.error("Please upload a CSV file");
            return;
        }

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            parseCSV(text);
        };
        reader.readAsText(file);
    };

    const parseCSV = (text: string) => {
        const lines = text.split("\n");
        const headers = lines[0].split(",").map(h => h.trim());

        const results = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = line.split(",").map(v => v.trim());
                const obj: any = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i];
                });
                return obj;
            });

        setImportData(results);
        toast.info(`Parsed ${results.length} vehicles from CSV`);
    };

    const handleImport = async () => {
        if (importData.length === 0) return;

        setIsUploading(true);
        try {
            // Map CSV fields to database fields
            const vehicles = importData.map(v => ({
                vehicle_type: v.type || "Semi-Trailer",
                make: v.make || "Unknown",
                model: v.model || "Unknown",
                year: parseInt(v.year) || new Date().getFullYear(),
                registration_number: v.reg_no || `BULK-${Math.random().toString(36).substr(2, 9)}`,
                license_plate: v.plate || `LP-${Math.random().toString(36).substr(2, 6)}`,
                capacity_kg: parseFloat(v.capacity) || 0,
                capacity_cubic_meters: null,
                insurance_policy_number: v.insurance_no || null,
                insurance_expiry_date: null,
                gps_device_id: null,
                last_maintenance_date: null,
                next_maintenance_due_date: null,
                status: "active" as const
            }));

            await vehicleService.bulkImportVehicles(vehicles);
            toast.success(`Successfully imported ${vehicles.length} vehicles`);
            setImportData([]);
            setFileName(null);
            onImportSuccess();
        } catch (error) {
            console.error("Bulk import error:", error);
            toast.error("Failed to import vehicles");
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "type,make,model,year,reg_no,plate,capacity,insurance_no";
        const example = "Semi-Trailer,Mercedes,Actros,2022,VIN12345,CE-123-LT,25000,POL-99";
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "vehicle_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Bulk Vehicle Import</CardTitle>
                            <CardDescription>Upload a CSV file to register multiple vehicles at once</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={downloadTemplate} className="font-bold text-xs text-primary">
                        <FileDown className="h-4 w-4 mr-2" />
                        Download Template
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-10 bg-slate-50/30 transition-colors hover:bg-slate-50">
                    {!fileName ? (
                        <>
                            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                <Upload className="h-8 w-8 text-slate-400" />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2">Select your fleet CSV file</h4>
                            <p className="text-sm text-slate-400 mb-6 text-center max-w-xs">
                                Drag and drop your file here, or click to browse your computer
                            </p>
                            <Input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                id="csv-upload"
                                onChange={handleFileChange}
                            />
                            <Button asChild className="rounded-xl h-12 px-8 font-bold">
                                <label htmlFor="csv-upload">Choose File</label>
                            </Button>
                        </>
                    ) : (
                        <div className="w-full">
                            <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 leading-tight">{fileName}</p>
                                        <p className="text-xs text-slate-400">{importData.length} records detected</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { setFileName(null); setImportData([]); }} className="text-slate-400 hover:text-rose-500">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => { setFileName(null); setImportData([]); }} className="rounded-xl h-11 font-bold">
                                    Cancel
                                </Button>
                                <Button disabled={isUploading} onClick={handleImport} className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20">
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        "Confirm Import"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex gap-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h5 className="text-sm font-bold text-amber-900">Important Instructions</h5>
                        <ul className="text-[12px] text-amber-700 mt-1 space-y-1 list-disc list-inside">
                            <li>Ensure your CSV follows the provided template headers exactly.</li>
                            <li>Registration numbers and license plates must be unique.</li>
                            <li>Capacity should be provided in kilograms (e.g. 25000 for 25 tons).</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
