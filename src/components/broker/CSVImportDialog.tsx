"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
    bulkImportShippers,
    bulkImportCarriers,
    generateCSVTemplate,
    type ImportResult,
} from "@/lib/services/csv-import-service";
import { toast } from "sonner";

interface CSVImportDialogProps {
    type: "shipper" | "carrier";
    onClose: () => void;
    onSuccess: () => void;
}

export function CSVImportDialog({ type, onClose, onSuccess }: CSVImportDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDownloadTemplate = () => {
        const template = generateCSVTemplate(type);
        const blob = new Blob([template], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}-import-template.csv`;
        a.click();
        toast.success("Template downloaded!");
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const csvContent = e.target?.result as string;

            try {
                const { data, error } = type === "shipper"
                    ? await bulkImportShippers(csvContent)
                    : await bulkImportCarriers(csvContent);

                if (error) {
                    toast.error("Import failed: " + error);
                } else if (data) {
                    setResult(data);
                    if (data.success) {
                        toast.success(`Successfully imported ${data.successful_imports} ${type}s!`);
                        setTimeout(() => {
                            onSuccess();
                            onClose();
                        }, 2000);
                    } else {
                        toast.warning(
                            `Imported ${data.successful_imports} ${type}s, ${data.failed_imports} failed`
                        );
                    }
                }
            } catch (error: any) {
                toast.error("Error processing file: " + error.message);
            } finally {
                setImporting(false);
            }
        };

        reader.readAsText(file);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        Import {type === "shipper" ? "Shippers" : "Carriers"} from CSV
                    </DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to bulk import {type}s to your network
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Download Template */}
                    <div className="p-4 bg-accent/10 rounded-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-medium mb-1">Need a template?</h4>
                                <p className="text-sm text-muted-foreground">
                                    Download our CSV template to get started
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label>Upload CSV File</Label>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label htmlFor="csv-upload" className="cursor-pointer">
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">
                                    {file ? file.name : "Click to upload CSV file"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    CSV files only
                                </p>
                            </label>
                        </div>
                    </div>

                    {/* Import Results */}
                    {result && (
                        <div className="space-y-3">
                            <div className="p-4 bg-accent/10 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium">Import Results</h4>
                                    {result.success ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-orange-500" />
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Total Rows</p>
                                        <p className="text-2xl font-bold">{result.total_rows}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Successful</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {result.successful_imports}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Failed</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {result.failed_imports}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Errors */}
                            {result.errors.length > 0 && (
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    <h5 className="font-medium text-sm">Errors:</h5>
                                    {result.errors.map((error, index) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-destructive/10 rounded-lg text-sm"
                                        >
                                            <div className="flex items-start gap-2">
                                                <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                                                <div>
                                                    <p className="font-medium">Row {error.row}: {error.email}</p>
                                                    <p className="text-muted-foreground">{error.error}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleImport} disabled={!file || importing}>
                            {importing ? "Importing..." : "Import"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
