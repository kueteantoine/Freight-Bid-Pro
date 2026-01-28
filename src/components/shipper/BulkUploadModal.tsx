"use client";

import React, { useState } from "react";
import { Upload, FileText, X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { bulkCreateShipments } from "@/app/actions/shipment-actions";
import { toast } from "sonner";

export function BulkUploadModal() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const parseCSV = (text: string) => {
        const lines = text.split("\n");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

        return lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(",").map(v => v.trim());
            const entry: any = {};
            headers.forEach((header, i) => {
                // Simple mapping
                if (header === "weight") entry.weight_kg = Number(values[i]);
                else if (header === "pickup") entry.pickup_location = values[i];
                else if (header === "delivery") entry.delivery_location = values[i];
                else if (header === "type") entry.freight_type = values[i];
                else if (header === "date") entry.scheduled_pickup_date = values[i];
                else entry[header] = values[i];
            });
            return entry;
        });
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            const text = await file.text();
            const shipments = parseCSV(text);

            if (shipments.length === 0) throw new Error("No valid shipments found in CSV.");

            await bulkCreateShipments(shipments);
            toast.success(`Successfully uploaded ${shipments.length} shipments!`);
            setIsOpen(false);
            setFile(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to upload bulk shipments.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-dashed border-2 px-8 py-6 h-auto transition-all hover:bg-primary/5 hover:border-primary">
                    <Upload className="h-5 w-5 text-primary" />
                    <div className="text-left">
                        <div className="font-bold">Bulk Shipment Upload</div>
                        <div className="text-xs text-muted-foreground">Import from CSV or Excel</div>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Shipment Upload</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file containing your shipment details.
                        <a href="#" className="text-primary hover:underline ml-1">Download Template</a>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {!file ? (
                        <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center space-y-4 bg-muted/30 transition-colors hover:bg-muted/50 cursor-pointer relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="p-4 bg-background rounded-full shadow-sm">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground">CSV files only (max 5MB)</p>
                        </div>
                    ) : (
                        <div className="border rounded-xl p-4 flex items-center justify-between bg-primary/5 border-primary/20 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => setFile(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-700 leading-normal">
                            Ensure column headers match: <strong>pickup, delivery, date, type, weight</strong>.
                            Date format should be YYYY-MM-DDTHH:MM.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isUploading}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={!file || isUploading} className="min-w-[100px]">
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload Shipments"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
