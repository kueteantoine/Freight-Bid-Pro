import React from 'react';
import { getCarrierFinancialStats, getTransactions } from "@/app/actions/finance-actions";
import FinancialDashboard from "@/components/carrier/finance/FinancialDashboard";
import TransactionList from "@/components/carrier/finance/TransactionList";
import ExpenseTracker from "@/components/carrier/finance/ExpenseTracker";
import FeeCalculator from "@/components/carrier/finance/FeeCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign } from 'lucide-react';

export default async function CarrierFinancePage() {
    // Fetch initial data
    const stats = await getCarrierFinancialStats().catch(err => {
        console.error("Error fetching financial stats:", err);
        return {
            gross_earnings: 0,
            net_earnings: 0,
            pending_payments: 0,
            total_commissions: 0,
            total_aggregator_fees: 0,
            total_mobile_fees: 0,
            balance: 0
        };
    });

    // We can pass some initial transactions to the list if we want SSR there too, 
    // but the component fetches on mount. 
    // For the dashboard chart, we might want to fetch history actions. 
    // For now, I'll mock the chart data or leave it empty in the prop to FinancialDashboard.

    // Mock revenue trend data for the chart (would ideally come from an aggregation query)
    const revenueData = [
        { name: 'Jan', total: 0 },
        { name: 'Feb', total: 0 },
        { name: 'Mar', total: 0 },
        { name: 'Apr', total: 0 },
        { name: 'May', total: 0 },
        { name: 'Jun', total: 0 },
        { name: 'Jul', total: 0 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
                <p className="text-muted-foreground">
                    Track your earnings, manage expenses, and view payment history.
                </p>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions & Invoices</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="calculator">Fee Calculator</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    <FinancialDashboard stats={stats} revenueData={revenueData} />
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <TransactionList />
                </TabsContent>

                <TabsContent value="expenses" className="space-y-4">
                    <ExpenseTracker />
                </TabsContent>

                <TabsContent value="calculator" className="space-y-4">
                    <div className="max-w-2xl">
                        <FeeCalculator />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
