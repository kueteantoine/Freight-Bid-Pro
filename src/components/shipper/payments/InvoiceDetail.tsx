"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Download,
    Share2,
    Printer,
    ChevronLeft,
    Calendar,
    CreditCard,
    Building2,
    MapPin,
    CheckCircle2,
    ExternalLink,
    Package,
    Shield,
    Receipt,
    DownloadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { RefundRequestDialog } from "./RefundRequestDialog";
import { toast } from "sonner";

interface InvoiceDetailProps {
    invoice: any;
    backUrl: string;
}

export function InvoiceDetail({ invoice, backUrl }: InvoiceDetailProps) {
    const [showRefundDialog, setShowRefundDialog] = React.useState(false);
    const { transactions: tx } = invoice;
    const shipment = tx.shipments;
    const payer = tx.payer;
    const payee = tx.payee;

    return (
        <div className="space-y-10 pb-20">
            {/* Breadcrumbs & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href={backUrl}>
                        <Button variant="ghost" size="icon" className="rounded-xl border border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Invoice #{invoice.invoice_number}</h2>
                            <Badge className={cn(
                                "border-none font-bold px-3 py-1 flex items-center gap-1.5",
                                tx.payment_status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                                {tx.payment_status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                                {tx.payment_status.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">
                            {format(new Date(invoice.issued_at), 'MMMM dd, yyyy')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 border-slate-200 font-bold">
                        <Printer className="h-4 w-4 mr-2 text-slate-400" />
                        Print
                    </Button>
                    <Button className="rounded-xl h-11 px-6 bg-primary font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                        <DownloadCloud className="h-4 w-4 mr-2" />
                        Download PDF
                    </Button>
                    {backUrl.includes('shipper') && tx.payment_status === 'completed' && (
                        <Button
                            variant="outline"
                            className="rounded-xl h-11 border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold transition-all"
                            onClick={() => setShowRefundDialog(true)}
                        >
                            Request Refund
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Parties */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PartyCard
                            title="Billed To"
                            name={`${payer?.first_name} ${payer?.last_name}`}
                            address={payer?.profiles?.company_name || 'Individual Shipper'}
                            email={payer?.email}
                            icon={Building2}
                        />
                        <PartyCard
                            title="Payable To"
                            name={`${payee?.first_name} ${payee?.last_name}`}
                            address={payee?.profiles?.company_name || 'Individual Transporter'}
                            email={payee?.email}
                            icon={CreditCard}
                            primary
                        />
                    </div>

                    <Card className="rounded-3xl border-slate-100 shadow-xl overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900">Shipment Details</CardTitle>
                                <p className="text-xs text-slate-400 font-black mt-1 uppercase tracking-widest">
                                    Load reference: #{shipment?.shipment_number}
                                </p>
                            </div>
                            <Button variant="ghost" className="text-primary font-bold text-xs flex items-center gap-1 group">
                                View Shipment <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="px-8 font-black text-slate-400 text-[10px] uppercase tracking-wider py-4">Description</TableHead>
                                        <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-wider text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <InvoiceItem
                                        name="Base Bid Amount"
                                        desc={`Freight transport for shipment #${shipment?.shipment_number}`}
                                        total={tx.gross_amount.toLocaleString()}
                                    />
                                    {tx.platform_commission_amount > 0 && (
                                        <InvoiceItem
                                            name="Platform Commission"
                                            desc={`Service fee (${tx.platform_commission_percentage}%)`}
                                            total={tx.platform_commission_amount.toLocaleString()}
                                        />
                                    )}
                                    {tx.aggregator_fee_amount > 0 && (
                                        <InvoiceItem
                                            name="Aggregator Fee"
                                            desc={`Payment gateway processing (${tx.aggregator_fee_percentage}%)`}
                                            total={tx.aggregator_fee_amount.toLocaleString()}
                                        />
                                    )}
                                    {tx.mobile_money_fee_amount > 0 && (
                                        <InvoiceItem
                                            name="Mobile Money Fee"
                                            desc={`Momo network fee (${tx.mobile_money_fee_percentage}%)`}
                                            total={tx.mobile_money_fee_amount.toLocaleString()}
                                        />
                                    )}
                                </TableBody>
                            </Table>
                            <div className="p-8 bg-slate-50 flex justify-end">
                                <div className="w-80 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                                        <span className="font-black text-slate-900 text-right">XAF {tx.gross_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Total Fees</span>
                                        <span className="font-black text-slate-900 text-right">XAF {tx.total_deductions.toLocaleString()}</span>
                                    </div>
                                    <Separator className="bg-slate-200" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total Amount</span>
                                        <span className="text-2xl font-black text-primary">XAF {(tx.gross_amount + tx.total_deductions).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Information */}
                <div className="space-y-8">
                    <Card className="rounded-3xl border-slate-100 shadow-xl overflow-hidden p-8 space-y-6 bg-white">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Summary</h3>
                        <div className="space-y-6">
                            <InfoRow icon={Calendar} label="Date Issued" value={format(new Date(invoice.issued_at), 'MMM dd, yyyy')} />
                            <InfoRow icon={Receipt} label="Method" value={tx.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'} />
                            <InfoRow icon={Shield} label="Transaction ID" value={tx.aggregator_transaction_id?.slice(0, 15) + '...'} />
                            <Separator className="bg-slate-100" />
                            {tx.payment_status === 'completed' && (
                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-tight">Payment Confirmed</h4>
                                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{format(new Date(tx.payment_completed_at), 'MMM dd, HH:mm')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="rounded-3xl shadow-2xl overflow-hidden p-8 bg-slate-900 text-white space-y-6 border-none">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-black tracking-tight">Need Help?</h3>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed font-bold">
                            If you have any questions regarding this invoice or notice any discrepancies, please reach out to our billing department.
                        </p>
                        <Button className="w-full h-12 rounded-xl bg-white text-slate-900 font-black hover:bg-slate-100 transition-all">
                            Contact Support
                        </Button>
                    </Card>
                </div>
            </div>

            <RefundRequestDialog
                transactionId={tx.id}
                isOpen={showRefundDialog}
                onClose={() => setShowRefundDialog(false)}
                onSuccess={() => {
                    toast.success("Refund request submitted successfully");
                }}
            />
        </div>
    );
}

function PartyCard({ title, name, address, email, icon: Icon, primary }: any) {
    return (
        <Card className={cn("rounded-3xl border-slate-100 shadow-xl p-8 space-y-4 bg-white", primary && "border-primary/20 bg-primary/5")}>
            <div className="flex items-center gap-3 mb-2">
                <div className={cn("p-2.5 rounded-xl", primary ? "bg-primary text-white" : "bg-slate-100 text-slate-500")}>
                    <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h4>
            </div>
            <div className="space-y-1">
                <h5 className="text-lg font-black text-slate-900">{name}</h5>
                <div className="flex items-start gap-2 mt-2">
                    <MapPin className="h-3 w-3 text-slate-400 mt-1" />
                    <p className="text-[12px] text-slate-500 font-bold leading-relaxed">{address}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Email:</span>
                    <span className="text-[12px] text-primary font-black underline cursor-pointer truncate">{email}</span>
                </div>
            </div>
        </Card>
    );
}

function InvoiceItem({ name, desc, total }: any) {
    return (
        <TableRow className="border-slate-50 hover:bg-slate-50/50 transition-colors">
            <TableCell className="px-8 py-6">
                <div className="space-y-1">
                    <div className="text-sm font-black text-slate-900 leading-tight">{name}</div>
                    <div className="text-[12px] text-slate-500 font-bold italic">{desc}</div>
                </div>
            </TableCell>
            <TableCell className="px-8 text-right font-black text-slate-900">XAF {total}</TableCell>
        </TableRow>
    );
}

function InfoRow({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-500">{label}</span>
            </div>
            <span className="text-sm font-black text-slate-900">{value}</span>
        </div>
    );
}
