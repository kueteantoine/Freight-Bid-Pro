"use client";

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Download,
    Search,
    FileText,
    Filter,
    MoreHorizontal
} from 'lucide-react';
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getTransactions, TransactionFilters } from "@/app/actions/finance-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function TransactionList() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all_time");

    useEffect(() => {
        loadTransactions();
    }, [statusFilter, dateFilter]);

    async function loadTransactions() {
        setLoading(true);
        try {
            const filters: TransactionFilters = {};
            if (statusFilter !== "all") filters.status = statusFilter;

            // Date logic
            const now = new Date();
            if (dateFilter === "this_month") {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                filters.startDate = start.toISOString();
            } else if (dateFilter === "last_month") {
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const end = new Date(now.getFullYear(), now.getMonth(), 0);
                filters.startDate = start.toISOString();
                filters.endDate = end.toISOString();
            }

            const { data } = await getTransactions(filters);
            setTransactions(data || []);
        } catch (error) {
            console.error("Failed to load transactions", error);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    }

    const downloadInvoice = (invoiceId: string) => {
        toast.info("Invoice download started...");
        // Logic to download PDF would go here
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-emerald-600">Completed</Badge>;
            case 'pending': return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
            case 'processing': return <Badge variant="outline" className="text-blue-600 border-blue-600">Processing</Badge>;
            case 'failed': return <Badge variant="destructive">Failed</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle>Transaction History</CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_time">All Time</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_month">Last Month</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Fees</TableHead>
                                <TableHead>Net</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Loading transactions...
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-medium">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(tx.created_at).toLocaleTimeString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>Payment for Shipment</span>
                                                {tx.shipments && (
                                                    <span className="text-xs text-muted-foreground">
                                                        #{tx.shipments.shipment_number} • {tx.shipments.pickup_location}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{tx.payment_method?.replace('_', ' ')}</TableCell>
                                        <TableCell>{formatCurrency(tx.gross_amount)}</TableCell>
                                        <TableCell className="text-red-600">-{formatCurrency(Number(tx.total_deductions))}</TableCell>
                                        <TableCell className="font-bold text-emerald-600">{formatCurrency(tx.net_amount)}</TableCell>
                                        <TableCell>{getStatusBadge(tx.payment_status)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => downloadInvoice(tx.id)}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        Download Invoice
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
