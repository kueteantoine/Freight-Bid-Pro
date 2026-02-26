import { Metadata } from "next";
import { getReconciliationReports } from "@/app/actions/admin-payment-actions";
import ReconciliationReportList from "./ReconciliationReportList";
import UploadReportForm from "./UploadReportForm";

export const metadata: Metadata = {
    title: "Reconciliation | Admin",
    description: "Match platform transactions with aggregator reports"
};

export default async function ReconciliationPage() {
    const reports = await getReconciliationReports();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Payment Reconciliation</h1>
                <p className="text-muted-foreground mt-2">
                    Upload aggregator reports and match with platform transactions
                </p>
            </div>

            <UploadReportForm />

            <ReconciliationReportList reports={reports} />
        </div>
    );
}
