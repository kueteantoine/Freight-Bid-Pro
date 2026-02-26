"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    CreditCard,
    Smartphone,
    Building,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { DollarSign } from "lucide-react"; // Import from lucide instead of local SVG if possible, or keep local if styling is specific

interface PaymentInitiationProps {
    bidAmount: number;
    onPaymentComplete: (method: string) => void;
    onCancel: () => void;
}

export function PaymentInitiation({ bidAmount, onPaymentComplete, onCancel }: PaymentInitiationProps) {
    const { convert, format } = useCurrency();
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Cameroon specific fees (estimations based on Prompt 17)
    const platformCommissionRate = 0.05; // 5%
    const aggregatorFeeRate = 0.01; // 1%
    const mobileMoneyFeeRate = 0.01; // 1%

    const platformCommission = bidAmount * platformCommissionRate;
    const aggregatorFee = bidAmount * aggregatorFeeRate;
    const mobileMoneyFee = bidAmount * mobileMoneyFeeRate;
    const totalPayable = bidAmount + platformCommission + aggregatorFee + mobileMoneyFee;

    const handlePayment = async () => {
        if (!selectedMethod) return;

        setIsProcessing(true);
        // Simulate payment redirection and webhook processing
        setTimeout(() => {
            setIsProcessing(false);
            onPaymentComplete(selectedMethod);
        }, 2000);
    };

    return (
        <Card className="rounded-3xl border-slate-100 shadow-2xl overflow-hidden max-w-2xl mx-auto">
            <CardHeader className="p-8 border-b bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black text-slate-900">Payment Breakdown</CardTitle>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Review totals and select payment method</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8">
                {/* Cost Breakdown */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-bold">Base Bid Amount</span>
                        <span className="font-extrabold text-slate-900">{format(convert(bidAmount))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-bold">Platform Commission (5%)</span>
                        <span className="font-extrabold text-slate-900">{format(convert(platformCommission))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-bold">Aggregator Fee (1%)</span>
                        <span className="font-extrabold text-slate-900">{format(convert(aggregatorFee))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-bold">Mobile Money Fee (1%)</span>
                        <span className="font-extrabold text-slate-900">{format(convert(mobileMoneyFee))}</span>
                    </div>

                    <Separator className="bg-slate-100 my-2" />

                    <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        <span className="text-sm font-black text-primary uppercase tracking-wider">Total Payable Amount</span>
                        <span className="text-2xl font-black text-primary">{format(convert(totalPayable))}</span>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Select Payment Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PaymentMethodCard
                            id="orange_money"
                            title="Orange Money"
                            icon={Smartphone}
                            color="bg-[#FF6600]"
                            selected={selectedMethod === 'orange_money'}
                            onClick={() => setSelectedMethod('orange_money')}
                        />
                        <PaymentMethodCard
                            id="mtn_momo"
                            title="MTN MoMo"
                            icon={Smartphone}
                            color="bg-[#FFCC00]"
                            selected={selectedMethod === 'mtn_momo'}
                            onClick={() => setSelectedMethod('mtn_momo')}
                        />
                        <PaymentMethodCard
                            id="card"
                            title="Credit / Debit Card"
                            icon={CreditCard}
                            color="bg-slate-900"
                            selected={selectedMethod === 'card'}
                            onClick={() => setSelectedMethod('card')}
                        />
                        <PaymentMethodCard
                            id="bank_transfer"
                            title="Bank Transfer"
                            icon={Building}
                            color="bg-primary"
                            selected={selectedMethod === 'bank_transfer'}
                            onClick={() => setSelectedMethod('bank_transfer')}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 pt-4">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1 h-12 rounded-xl font-bold border-slate-200"
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePayment}
                        className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 transition-all"
                        disabled={!selectedMethod || isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Pay Now <ArrowRight className="h-5 w-5 ml-2" />
                            </>
                        )}
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Shield className="h-3 w-3" />
                    Secure encrypted payment processing
                </div>
            </CardContent>
        </Card>
    );
}

function PaymentMethodCard({ id, title, icon: Icon, color, selected, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-4",
                selected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-slate-100 bg-white hover:border-slate-200"
            )}
        >
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white", color)}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-black text-slate-900">{title}</p>
                {selected && <p className="text-[10px] text-primary font-bold uppercase mt-0.5">Selected</p>}
            </div>
            {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
        </div>
    );
}


function Shield(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
    );
}
