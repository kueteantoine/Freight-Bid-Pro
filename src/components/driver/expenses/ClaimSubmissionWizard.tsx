"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DriverExpense, submitExpenseClaim } from "@/app/actions/driver-expense-actions";
import { toast } from "sonner";
import { Loader2, Send, ChevronRight, ChevronLeft, Building2 } from "lucide-react";

interface ClaimSubmissionWizardProps {
    draftExpenses: DriverExpense[];
    transporters: { id: string, company_name: string }[];
    onSuccess?: () => void;
}

export function ClaimSubmissionWizard({ draftExpenses, transporters, onSuccess }: ClaimSubmissionWizardProps) {
    const [step, setStep] = useState(1);
    const [selectedTransporter, setSelectedTransporter] = useState<string>("");
    const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalSelectedAmount = draftExpenses
        .filter(e => selectedExpenses.includes(e.id))
        .reduce((sum, e) => sum + Number(e.amount), 0);

    const toggleExpense = (id: string) => {
        setSelectedExpenses(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    async function handleSubmit() {
        if (!selectedTransporter) return toast.error("Please select a transporter");
        if (selectedExpenses.length === 0) return toast.error("Please select at least one expense");

        setIsSubmitting(true);
        try {
            const result = await submitExpenseClaim(selectedExpenses, selectedTransporter);
            if (result.success) {
                toast.success("Claim submitted successfully");
                onSuccess?.();
            } else {
                toast.error(result.error || "Failed to submit claim");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (draftExpenses.length === 0) return null;

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Submit Reimbursement Claim
                </CardTitle>
                <CardDescription>
                    Step {step} of 2: {step === 1 ? "Select Transporter & Expenses" : "Review & Confirm"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {step === 1 ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Transporter</label>
                            <Select onValueChange={setSelectedTransporter} value={selectedTransporter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose building" />
                                </SelectTrigger>
                                <SelectContent>
                                    {transporters.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4" />
                                                {t.company_name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">Select Expenses to Include</label>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {draftExpenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => toggleExpense(expense.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedExpenses.includes(expense.id)}
                                                onCheckedChange={() => toggleExpense(expense.id)}
                                            />
                                            <div>
                                                <p className="font-medium text-sm capitalize">{expense.category}</p>
                                                <p className="text-xs text-muted-foreground">{expense.expense_date}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-sm">{Number(expense.amount).toLocaleString()} XAF</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-between items-center border-t">
                            <div className="text-sm">
                                <span className="text-muted-foreground">Total: </span>
                                <span className="font-bold">{totalSelectedAmount.toLocaleString()} XAF</span>
                            </div>
                            <Button
                                onClick={() => setStep(2)}
                                disabled={selectedExpenses.length === 0 || !selectedTransporter}
                            >
                                Review Summary
                                <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Transporter</span>
                                    <span className="font-semibold">{transporters.find(t => t.id === selectedTransporter)?.company_name}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Expenses Count</span>
                                    <span className="font-semibold">{selectedExpenses.length}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                                    <span className="text-sm font-bold">Total Claim Amount</span>
                                    <span className="text-lg font-bold text-primary">{totalSelectedAmount.toLocaleString()} XAF</span>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground italic text-center">
                                By submitting, you confirm these expenses are work-related and accurate.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isSubmitting}>
                                <ChevronLeft className="mr-2 w-4 h-4" />
                                Back
                            </Button>
                            <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Confirm & Submit
                                        <Send className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
