"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Camera,
    CheckCircle2,
    MapPin,
    Clock,
    Box,
    ChevronLeft,
    Upload,
    User,
    ShieldCheck,
    AlertCircle,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Toaster, toast } from "sonner";

export default function ProofOfDeliveryPage() {
    const [step, setStep] = useState(1);
    const [checklist, setChecklist] = useState({
        condition: false,
        quantity: false,
        documents: false
    });

    const handleSubmit = () => {
        toast.success("Shipment #CM-8812 Delivered Successfully!");
        // In a real app, redirect after success
    };

    return (
        <div className="max-w-lg mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link href="/driver/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <ChevronLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                </Link>
                <div className="text-center flex-1 pr-10">
                    <h2 className="text-lg font-black text-slate-900 leading-none">Confirm Delivery</h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Job #CM-8812</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between px-10 relative">
                <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                <StepCircle num={1} active={step >= 1} done={step > 1} />
                <StepCircle num={2} active={step >= 2} done={step > 2} />
                <StepCircle num={3} active={step >= 3} done={step > 3} />
            </div>

            <div className="space-y-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <h3 className="text-xl font-black text-slate-900">Checklist</h3>
                        <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden bg-white">
                            <CardContent className="p-8 space-y-6">
                                <CheckItem
                                    label="Goods in good condition"
                                    checked={checklist.condition}
                                    onCheckedChange={(checked) => setChecklist({ ...checklist, condition: checked as boolean })}
                                />
                                <CheckItem
                                    label="Quantity verified"
                                    checked={checklist.quantity}
                                    onCheckedChange={(checked) => setChecklist({ ...checklist, quantity: checked as boolean })}
                                />
                                <CheckItem
                                    label="All documents signed"
                                    checked={checklist.documents}
                                    onCheckedChange={(checked) => setChecklist({ ...checklist, documents: checked as boolean })}
                                />
                            </CardContent>
                        </Card>
                        <Button
                            disabled={!checklist.condition || !checklist.quantity || !checklist.documents}
                            onClick={() => setStep(2)}
                            className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95"
                        >
                            Next Step
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xl font-black text-slate-900">Delivery Photo</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Min. 1 Required</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary">
                                    <Camera className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400">Take Photo</span>
                            </div>
                            <div className="aspect-square bg-slate-100 rounded-[32px] relative overflow-hidden ring-4 ring-white shadow-lg">
                                <img src="https://images.unsplash.com/photo-1586528116311-ad86d7c7173a?q=80&w=400&auto=format&fit=crop" className="h-full w-full object-cover" />
                                <div className="absolute top-3 right-3 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                    <CheckCircle2 className="h-3 w-3" />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setStep(3)}
                            className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95"
                        >
                            Continue to Signature
                        </Button>
                        <Button variant="ghost" onClick={() => setStep(1)} className="w-full font-bold text-slate-400">Back</Button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <h3 className="text-xl font-black text-slate-900">Recipient Signature</h3>
                        <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden bg-white">
                            <CardContent className="p-0">
                                <div className="p-8 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <input placeholder="Enter recipient name..." className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-slate-900" />
                                    </div>
                                </div>
                                <div className="h-60 bg-slate-50 relative flex items-center justify-center group overflow-hidden">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pointer-events-none group-hover:opacity-0 transition-opacity">Sign Here</p>
                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                        <Button variant="outline" size="sm" className="h-8 rounded-lg bg-white border-slate-100 text-xs font-bold">Clear</Button>
                                    </div>
                                    {/* Placeholder for Signature Canvas */}
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            onClick={handleSubmit}
                            className="w-full h-16 rounded-[24px] bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <ShieldCheck className="h-6 w-6" />
                            Complete Delivery
                        </Button>
                        <Button variant="ghost" onClick={() => setStep(2)} className="w-full font-bold text-slate-400">Back</Button>
                    </div>
                )}
            </div>

            <div className="bg-amber-50 rounded-3xl p-6 flex gap-4 border border-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    Ensure the POD is clear and the recipient's name matches our records to avoid payment delays.
                </p>
            </div>
            <Toaster richColors position="bottom-center" />
        </div>
    );
}

function StepCircle({ num, active, done }: { num: number, active: boolean, done: boolean }) {
    return (
        <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center font-black text-sm z-10 transition-all duration-300",
            done ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" :
                active ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-white border-2 border-slate-100 text-slate-300"
        )}>
            {done ? <CheckCircle2 className="h-5 w-5" /> : num}
        </div>
    );
}

function CheckItem({ label, checked, onCheckedChange }: { label: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) {
    return (
        <div className={cn(
            "flex items-center space-x-4 p-4 rounded-2xl border transition-all cursor-pointer",
            checked ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100"
        )} onClick={() => onCheckedChange(!checked)}>
            <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="h-5 w-5 rounded-md data-[state=checked]:bg-emerald-500 border-slate-200" />
            <span className={cn("text-sm font-bold", checked ? "text-emerald-900" : "text-slate-600")}>{label}</span>
        </div>
    );
}
