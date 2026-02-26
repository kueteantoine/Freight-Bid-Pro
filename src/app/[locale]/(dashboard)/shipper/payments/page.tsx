"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Receipt,
    Download,
    ExternalLink,
    History,
    Filter,
    Search,
    ChevronRight,
    Loader2,
    DollarSign,
    Calendar,
    ArrowUpRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getTransactionHistory } from "@/app/actions/payment-actions";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ShipperPaymentsPage() {
    const t = useTranslations("shipperSubPages");
    const tCommon = useTranslations("common");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getTransactionHistory();
                setTransactions(data);
            } catch (error) {
                console.error("Failed to load transactions", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">{tCommon("loading")}</p>
            </div>
        );
    }

    const totalSpent = transactions.reduce((acc, tx) => acc + (tx.gross_amount || 0), 0);
    const pendingCount = transactions.filter(tx => tx.payment_status === 'pending').length;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">{t("paymentHistory")}</h1>
                    <p className="text-slate-500 font-medium mt-1">{t("paymentHistoryDesc")}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl font-bold border-slate-200">
                        <Download className="h-4 w-4 mr-2" />
                        {tCommon("exportReport")}
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title={t("totalSpend")}
                    value={`XAF ${totalSpent.toLocaleString()}`}
                    icon={DollarSign}
                    color="text-primary"
                    bg="bg-primary/5"
                />
                <StatCard
                    title={t("activeInvoices")}
                    value={transactions.length.toString()}
                    icon={Receipt}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatCard
                    title={t("pendingPayments")}
                    value={pendingCount.toString()}
                    icon={History}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
            </div>

            {/* Transactions Table/List */}
            <Card className="rounded-3xl border-slate-100 shadow-xl overflow-hidden">
                <CardHeader className="p-6 border-b bg-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-xl font-bold">{t("recentTransactions")}</CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder={t("searchShipmentId")}
                                    className="pl-9 h-10 w-64 bg-slate-50 border-slate-100 rounded-xl"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="rounded-xl">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">{tCommon("transactionDetails")}</th>
                                    <th className="px-6 py-4">{tCommon("status")}</th>
                                    <th className="px-6 py-4">{tCommon("method")}</th>
                                    <th className="px-6 py-4 text-right">{tCommon("amount")}</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <Receipt className="h-12 w-12" />
                                                <p className="font-bold">{t("noTransactionsFound")}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                        <ArrowUpRight className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">
                                                            Shipment #{tx.shipments?.shipment_number || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(tx.created_at), 'MMM dd, yyyy • HH:mm')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={cn("rounded-full font-bold",
                                                    tx.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                                        tx.payment_status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                                            'bg-red-100 text-red-700 hover:bg-red-100'
                                                )}>
                                                    {tx.payment_status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-600 capitalize">
                                                    {tx.payment_method?.replace('_', ' ') || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-black text-slate-900">
                                                    XAF {tx.gross_amount.toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/shipper/payments/${tx.id}`}>
                                                        <Button variant="ghost" size="sm" className="rounded-xl h-8 text-primary font-bold">
                                                            {t("viewInvoice")}
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-slate-400">
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="rounded-3xl border-slate-100 shadow-lg border-none bg-white p-6">
            <div className="flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", bg, color)}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
                    <p className={cn("text-2xl font-black mt-1", color)}>{value}</p>
                </div>
            </div>
        </Card>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
