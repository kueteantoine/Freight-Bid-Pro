"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Fuel,
    Receipt,
    Trash2,
    Eye,
    MapPin,
    Utensils,
    Home,
    Wrench,
    Clock,
    MoreHorizontal
} from "lucide-react";
import { DriverExpense, deleteExpense } from "@/app/actions/driver-expense-actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface ExpenseListProps {
    expenses: DriverExpense[];
    onDelete?: () => void;
}

const categoryIcons = {
    fuel: <Fuel className="w-4 h-4" />,
    tolls: <MapPin className="w-4 h-4" />,
    parking: <Clock className="w-4 h-4" />,
    meals: <Utensils className="w-4 h-4" />,
    lodging: <Home className="w-4 h-4" />,
    maintenance: <Wrench className="w-4 h-4" />,
    per_diem: <Clock className="w-4 h-4" />,
    other: <MoreHorizontal className="w-4 h-4" />,
};

const statusColors = {
    draft: "bg-slate-500",
    submitted: "bg-blue-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
};

export function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this expense?")) return;

        const result = await deleteExpense(id);
        if (result.success) {
            toast.success("Expense deleted");
            onDelete?.();
        } else {
            toast.error(result.error || "Failed to delete expense");
        }
    }

    if (expenses.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-semibold">No expenses found</h3>
                <p className="text-sm text-muted-foreground">Start logging your expenses to track your spending.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-muted rounded-full">
                                        {categoryIcons[expense.category as keyof typeof categoryIcons] || categoryIcons.other}
                                    </div>
                                    <span className="capitalize">{expense.category.replace('_', ' ')}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {format(new Date(expense.expense_date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                                {Number(expense.amount).toLocaleString()} XAF
                            </TableCell>
                            <TableCell>
                                <Badge className={statusColors[expense.status as keyof typeof statusColors]}>
                                    {expense.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    {expense.receipt_url && (
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={`https://kgrvlyrxgqlyvqzqzqzq.supabase.co/storage/v1/object/public/expense-receipts/${expense.receipt_url}`} target="_blank" rel="noreferrer">
                                                <Eye className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    )}
                                    {expense.status === 'draft' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(expense.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
