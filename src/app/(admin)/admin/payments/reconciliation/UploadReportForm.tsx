"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { uploadReconciliationReport } from "@/app/actions/admin-payment-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function UploadReportForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [reportName, setReportName] = useState("");
    const [aggregatorName, setAggregatorName] = useState("");
    const [periodStart, setPeriodStart] = useState("");
    const [periodEnd, setPeriodEnd] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file || !reportName || !aggregatorName || !periodStart || !periodEnd) {
            toast({
                title: "Missing Information",
                description: "Please fill in all fields and select a file",
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("reportName", reportName);
            formData.append("aggregatorName", aggregatorName);
            formData.append("periodStart", periodStart);
            formData.append("periodEnd", periodEnd);

            await uploadReconciliationReport(formData);

            toast({
                title: "Report Uploaded",
                description: "Reconciliation report has been uploaded successfully"
            });

            // Reset form
            setFile(null);
            setReportName("");
            setAggregatorName("");
            setPeriodStart("");
            setPeriodEnd("");
            router.refresh();
        } catch (error) {
            toast({
                title: "Upload Failed",
                description: "Failed to upload reconciliation report",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Reconciliation Report</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="reportName">Report Name</Label>
                            <Input
                                id="reportName"
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                                placeholder="e.g., January 2026 Reconciliation"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="aggregator">Payment Aggregator</Label>
                            <Select value={aggregatorName} onValueChange={setAggregatorName}>
                                <SelectTrigger id="aggregator">
                                    <SelectValue placeholder="Select aggregator" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="orange_money">Orange Money</SelectItem>
                                    <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="periodStart">Period Start</Label>
                            <Input
                                id="periodStart"
                                type="date"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="periodEnd">Period End</Label>
                            <Input
                                id="periodEnd"
                                type="date"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file">Report File (CSV or Excel)</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    <Button type="submit" disabled={isUploading} className="w-full">
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Report
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
