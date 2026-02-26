"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface Transaction {
    id: string;
    gross_amount: number;
    payment_status: string;
    payment_method: string;
    created_at: string;
    shipments?: {
        shipment_number: string;
    } | null;
    payer?: {
        email: string;
    } | null;
    payee?: {
        email: string;
    } | null;
}

interface RecentTransactionsTableProps {
    transactions: Transaction[];
}

export default function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            completed: { variant: "default", label: "Completed" },
            failed: { variant: "destructive", label: "Failed" },
            pending: { variant: "secondary", label: "Pending" },
            processing: { variant: "secondary", label: "Processing" }
        };

        const config = variants[status] || { variant: "secondary", label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-sm">Shipment</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Amount</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Method</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Date</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b hover:bg-muted/50">
                                        <td className="py-3 px-4">
                                            <div className="font-medium">
                                                {tx.shipments?.shipment_number || "N/A"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {tx.payer?.email}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-medium">
                                            {tx.gross_amount.toLocaleString()} XAF
                                        </td>
                                        <td className="py-3 px-4 capitalize">
                                            {tx.payment_method?.replace("_", " ")}
                                        </td>
                                        <td className="py-3 px-4">
                                            {getStatusBadge(tx.payment_status)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Link href={`/admin/payments/transactions/${tx.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
