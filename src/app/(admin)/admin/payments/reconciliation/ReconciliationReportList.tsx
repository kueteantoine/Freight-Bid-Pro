"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Play } from "lucide-react";
import { runReconciliation } from "@/app/actions/admin-payment-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ReconciliationReportListProps {
    reports: Array<{
        id: string;
        report_name: string;
        aggregator_name: string;
        report_period_start: string;
        report_period_end: string;
        reconciliation_status: string;
        total_discrepancies: number;
        created_at: string;
    }>;
}

export default function ReconciliationReportList({ reports }: ReconciliationReportListProps) {
    const { toast } = useToast();
    const router = useRouter();

    const handleRunReconciliation = async (reportId: string) => {
        try {
            const result = await runReconciliation(reportId);
            toast({
                title: "Reconciliation Complete",
                description: `Found ${result.discrepanciesFound} discrepancies`
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Reconciliation Failed",
                description: "Failed to run reconciliation",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            completed: { variant: "default", icon: CheckCircle2, label: "Completed" },
            failed: { variant: "destructive", icon: XCircle, label: "Failed" },
            pending: { variant: "secondary", icon: Clock, label: "Pending" },
            in_progress: { variant: "secondary", icon: Clock, label: "In Progress" }
        };

        const config = variants[status] || { variant: "secondary", icon: Clock, label: status };
        const Icon = config.icon;

        return (
            <Badge variant={config.variant}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reconciliation Reports</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {reports.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No reconciliation reports yet
                        </p>
                    ) : (
                        reports.map((report) => (
                            <div
                                key={report.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                            >
                                <div className="flex-1">
                                    <h4 className="font-semibold">{report.report_name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {report.aggregator_name.replace("_", " ")} • {" "}
                                        {new Date(report.report_period_start).toLocaleDateString()} - {" "}
                                        {new Date(report.report_period_end).toLocaleDateString()}
                                    </p>
                                    {report.total_discrepancies > 0 && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {report.total_discrepancies} discrepancies found
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {getStatusBadge(report.reconciliation_status)}

                                    {report.reconciliation_status === "pending" && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleRunReconciliation(report.id)}
                                        >
                                            <Play className="h-4 w-4 mr-1" />
                                            Run
                                        </Button>
                                    )}

                                    {report.reconciliation_status === "completed" && report.total_discrepancies > 0 && (
                                        <Link href={`/admin/payments/reconciliation/${report.id}`}>
                                            <Button size="sm" variant="outline">
                                                View Discrepancies
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
