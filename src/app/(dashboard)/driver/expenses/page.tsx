import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseLogForm } from "@/components/driver/expenses/ExpenseLogForm";
import { ExpenseList } from "@/components/driver/expenses/ExpenseList";
import { ClaimSubmissionWizard } from "@/components/driver/expenses/ClaimSubmissionWizard";
import { MileageLogForm } from "@/components/driver/expenses/MileageLogForm";
import { MileageLogList } from "@/components/driver/expenses/MileageLogList";
import {
    getDriverExpenses,
    getDriverClaims,
    getDriverTransporters,
    getMileageLogs
} from "@/app/actions/driver-expense-actions";
import { getDriverJobs, DriverJob } from "@/app/actions/driver-jobs";
import { Wallet, Receipt, History, Send, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
    title: "Expenses & Claims | Driver Dashboard",
};

export default async function ExpensesPage() {
    // Parallel fetch for server-side data
    const [
        { data: expenses },
        { data: claims },
        { data: transporters },
        { data: mileageLogs },
        { jobs }
    ] = await Promise.all([
        getDriverExpenses(),
        getDriverClaims(),
        getDriverTransporters(),
        getMileageLogs(),
        getDriverJobs("active")
    ]);

    const draftExpenses = expenses.filter((e: any) => e.status === 'draft');
    const totalDraftAmount = draftExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    return (
        <div className="container mx-auto p-4 space-y-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-primary" />
                    Expenses & Claims
                </h1>
                <p className="text-muted-foreground text-sm">
                    Manage your work-related expenses and submit reimbursement claims.
                </p>
            </header>

            <Tabs defaultValue="log" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="log" className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Log
                    </TabsTrigger>
                    <TabsTrigger value="mileage" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Mileage
                    </TabsTrigger>
                    <TabsTrigger value="claim" className="flex items-center gap-2 relative">
                        <Send className="w-4 h-4" />
                        Summarize
                        {draftExpenses.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] absolute -top-1 -right-1">
                                {draftExpenses.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="log" className="space-y-6">
                    <ExpenseLogForm
                        shipments={jobs.map((j: DriverJob) => ({ id: j.shipment_id, shipment_number: j.shipment.shipment_number }))}
                    />

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            Recent Activity
                        </h2>
                        <ExpenseList expenses={expenses} />
                    </div>
                </TabsContent>

                <TabsContent value="mileage" className="space-y-6">
                    <MileageLogForm
                        shipments={jobs.map((j: DriverJob) => ({ id: j.shipment_id, shipment_number: j.shipment.shipment_number }))}
                    />
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Mileage History</h2>
                        <MileageLogList logs={mileageLogs} />
                    </div>
                </TabsContent>

                <TabsContent value="claim" className="space-y-6">
                    {draftExpenses.length > 0 ? (
                        <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-muted/50 border text-center">
                                <p className="text-sm text-muted-foreground">You have</p>
                                <p className="text-2xl font-bold text-primary">{totalDraftAmount.toLocaleString()} XAF</p>
                                <p className="text-sm text-muted-foreground">in draft expenses ready for submission.</p>
                            </div>

                            <ClaimSubmissionWizard
                                draftExpenses={draftExpenses}
                                transporters={transporters}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
                            <Send className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                            <h3 className="mt-4 text-lg font-semibold">Ready to submit a claim?</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                First, log some expenses in the "Log" tab. Once they are saved as drafts, you can bundle them into a claim.
                            </p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    {claims.length > 0 ? (
                        <div className="grid gap-4">
                            {claims.map((claim: any) => (
                                <div key={claim.id} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-lg">{Number(claim.total_amount).toLocaleString()} XAF</p>
                                            <p className="text-xs text-muted-foreground">
                                                Submitted on {new Date(claim.submitted_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge className={
                                            claim.status === 'paid' ? 'bg-green-600' :
                                                claim.status === 'approved' ? 'bg-green-500' :
                                                    claim.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
                                        }>
                                            {claim.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Receipt className="w-3 h-3" />
                                            {claim.expenses?.length || 0} items
                                        </div>
                                    </div>
                                    {claim.admin_notes && (
                                        <div className="mt-3 p-2 rounded bg-muted text-xs italic">
                                            Note: {claim.admin_notes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <History className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                            <p className="mt-4 text-muted-foreground">No claim history yet.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
