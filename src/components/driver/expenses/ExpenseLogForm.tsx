"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, Plus, X } from "lucide-react";
import { logExpense, ExpenseCategory } from "@/app/actions/driver-expense-actions";
import { toast } from "sonner";

interface ExpenseLogFormProps {
    shipments: { id: string, shipment_number: string }[];
    onSuccess?: () => void;
}

export function ExpenseLogForm({ shipments, onSuccess }: ExpenseLogFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [receipt, setReceipt] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceipt(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeReceipt = () => {
        setReceipt(null);
        setPreview(null);
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            if (receipt) {
                formData.set('receipt', receipt);
            }

            const result = await logExpense(formData);
            if (result.success) {
                toast.success("Expense logged successfully");
                (e.target as HTMLFormElement).reset();
                removeReceipt();
                onSuccess?.();
            } else {
                toast.error(result.error || "Failed to log expense");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Log New Expense</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select name="category" required defaultValue="other">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fuel">Fuel</SelectItem>
                                    <SelectItem value="tolls">Tolls</SelectItem>
                                    <SelectItem value="parking">Parking</SelectItem>
                                    <SelectItem value="meals">Meals</SelectItem>
                                    <SelectItem value="lodging">Lodging</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="per_diem">Per Diem</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (XAF)</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expenseDate">Date</Label>
                            <Input
                                id="expenseDate"
                                name="expenseDate"
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shipmentId">Related Job (Optional)</Label>
                            <Select name="shipmentId">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select job" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {shipments.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.shipment_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Add some details..."
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Receipt Photo</Label>
                        {!preview ? (
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Camera className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Tap to take photo or upload</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        capture="environment"
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                                <img
                                    src={preview}
                                    alt="Receipt preview"
                                    className="w-full h-full object-cover"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 rounded-full w-8 h-8"
                                    onClick={removeReceipt}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Logging...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Log Expense
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
