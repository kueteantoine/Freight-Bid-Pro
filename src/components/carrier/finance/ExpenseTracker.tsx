"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { logExpense, getExpenses, ExpenseData } from "@/app/actions/finance-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2, Tag } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ExpenseTracker() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<ExpenseData>({
        expense_date: new Date().toISOString().split('T')[0],
        category: 'fuel',
        amount: 0,
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            const data = await getExpenses({
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), // This month by default
                endDate: new Date().toISOString()
            });
            setExpenses(data || []);
        } catch (error) {
            console.error("Failed to load expenses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await logExpense(formData);
            toast.success("Expense logged successfully");
            loadExpenses();
            setFormData({
                ...formData,
                amount: 0,
                description: ''
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to log expense");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* Expense Form */}
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Log Expense</CardTitle>
                    <CardDescription>Track fuel, maintenance, etc.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.expense_date}
                                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fuel">Fuel</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="tolls">Tolls / Parking</SelectItem>
                                    <SelectItem value="insurance">Insurance</SelectItem>
                                    <SelectItem value="permits">Permits / Legal</SelectItem>
                                    <SelectItem value="salary">Driver Salary</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (XAF)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                required
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Description (Optional)</Label>
                            <Input
                                id="desc"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? "Logging..." : "Add Expense"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Recent list */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Recent Expenses (This Month)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">No expenses logged this month.</TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((exp) => (
                                    <TableRow key={exp.id}>
                                        <TableCell>{formatDate(exp.expense_date)}</TableCell>
                                        <TableCell className="capitalize">
                                            <Badge variant="secondary">{exp.category}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">{exp.description || "-"}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(exp.amount)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
