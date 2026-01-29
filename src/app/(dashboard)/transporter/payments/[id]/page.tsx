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
    ArrowRight,
    Receipt,
    DownloadCloud,
    ExternalLink,
    Package
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

export default function InvoiceDetailPage() {
    return (
        <div className="space-y-10 pb-20">
            {/* Breadcrumbs & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/transporter/payments">
                        <Button variant="ghost" size="icon" className="rounded-xl border border-slate-100 bg-white shadow-sm">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invoice #INV-2026-0042</h2>
                            <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold px-3 py-1 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3" />
                                PAID
                            </Badge>
                        </div>
                        <p className="text-slate-400 text-sm font-medium mt-1">Generated on October 24, 2026</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 border-slate-200">
                        <Printer className="h-4 w-4 mr-2 text-slate-400" />
                        Print
                    </Button>
                    <Button variant="outline" className="rounded-xl h-11 border-slate-200">
                        <Share2 className="h-4 w-4 mr-2 text-slate-400" />
                        Share
                    </Button>
                    <Button className="rounded-xl h-11 px-6 bg-primary font-bold shadow-lg shadow-primary/20 transition-all">
                        <DownloadCloud className="h-4 w-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Parties */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PartyCard
                            title="Billed To"
                            name="Dangote Cement Cameroon"
                            address="Base Navale, Douala, Cameroon"
                            email="billing@dangote-cm.com"
                            icon={Building2}
                        />
                        <PartyCard
                            title="Payable To"
                            name="TransCam Logistics SA"
                            address="Avenue de Gaulle, Akwa, Douala"
                            email="finance@transcam.com"
                            icon={CreditCard}
                            primary
                        />
                    </div>

                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Shipment Details</CardTitle>
                                <p className="text-xs text-slate-400 font-medium mt-1">Load reference: #CM-8821-2026</p>
                            </div>
                            <Button variant="ghost" className="text-primary font-bold text-xs flex items-center gap-1 group">
                                View Load Board <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="px-8 font-bold text-slate-400 text-[10px] uppercase tracking-wider py-4">Description</TableHead>
                                        <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Weight/Qty</TableHead>
                                        <TableHead className="font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">Rate</TableHead>
                                        <TableHead className="px-8 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <InvoiceItem
                                        name="Industrial Cement Transport"
                                        desc="Douala Port → Yaoundé Warehouse"
                                        qty="24,500 kg"
                                        rate="XAF 45 / kg"
                                        total="1,125,000"
                                    />
                                    <InvoiceItem
                                        name="Port Loading Fee"
                                        desc="Standard loading & handling"
                                        qty="1 Flatbed"
                                        rate="XAF 50,000"
                                        total="50,000"
                                    />
                                    <InvoiceItem
                                        name="Fuel Surcharge"
                                        desc="Based on current market rates"
                                        qty="1,240 km"
                                        rate="XAF 250 / km"
                                        total="310,000"
                                    />
                                </TableBody>
                            </Table>
                            <div className="p-8 bg-slate-50 flex justify-end">
                                <div className="w-80 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Subtotal</span>
                                        <span className="font-bold text-slate-900 text-right">XAF 1,485,000</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">VAT (19.25%)</span>
                                        <span className="font-bold text-slate-900 text-right">XAF 285,862</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Discount</span>
                                        <span className="font-bold text-emerald-600 text-right">- XAF 10,000</span>
                                    </div>
                                    <Separator className="bg-slate-200" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-slate-900">Total Amount</span>
                                        <span className="text-2xl font-black text-primary">XAF 1,760,862</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Information */}
                <div className="space-y-8">
                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-8 space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Payment Summary</h3>
                        <div className="space-y-6">
                            <InfoRow icon={Calendar} label="Date Issued" value="Oct 24, 2026" />
                            <InfoRow icon={Calendar} label="Due Date" value="Nov 08, 2026" status="Net 15" />
                            <InfoRow icon={Receipt} label="Method" value="Direct Bank Transfer" />
                            <Separator className="bg-slate-100" />
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                                <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
                                    <CheckCircle2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-tight">Payment Confirmed</h4>
                                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Oct 26, 2026 • Ref: #BNK-88219</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-8 bg-slate-950 text-white space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold">Need Help?</h3>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            If you have any questions regarding this invoice or notice any discrepancies, please reach out to our billing department.
                        </p>
                        <Button className="w-full h-12 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all">
                            Contact Support
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function PartyCard({ title, name, address, email, icon: Icon, primary }: any) {
    return (
        <Card className={cn("rounded-3xl border-slate-100 shadow-sm p-8 space-y-4", primary && "border-primary/20 bg-primary/5")}>
            <div className="flex items-center gap-3 mb-2">
                <div className={cn("p-2.5 rounded-xl", primary ? "bg-primary text-white" : "bg-slate-100 text-slate-500")}>
                    <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h4>
            </div>
            <div className="space-y-1">
                <h5 className="font-extrabold text-slate-900">{name}</h5>
                <div className="flex items-start gap-2 mt-2">
                    <MapPin className="h-3 w-3 text-slate-400 mt-1" />
                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{address}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase whitespace-nowrap">Email:</span>
                    <span className="text-[12px] text-primary font-bold underline cursor-pointer truncate">{email}</span>
                </div>
            </div>
        </Card>
    );
}

function InvoiceItem({ name, desc, qty, rate, total }: any) {
    return (
        <TableRow className="border-slate-50 hover:bg-slate-50/50 transition-colors">
            <TableCell className="px-8 py-6">
                <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900 leading-tight">{name}</div>
                    <div className="text-[12px] text-slate-500 font-medium">{desc}</div>
                </div>
            </TableCell>
            <TableCell className="text-slate-600 font-bold text-sm">{qty}</TableCell>
            <TableCell className="text-slate-600 font-bold text-sm text-right">{rate}</TableCell>
            <TableCell className="px-8 text-right font-extrabold text-slate-900">XAF {total}</TableCell>
        </TableRow>
    );
}

function InfoRow({ icon: Icon, label, value, status }: any) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-500">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900">{value}</span>
                {status && <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-400 rounded-md h-5">{status}</Badge>}
            </div>
        </div>
    );
}
