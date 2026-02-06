import { getInvoiceDetail } from "@/app/actions/payment-actions";
import { InvoiceDetail } from "@/components/shipper/payments/InvoiceDetail";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TransporterInvoicePage(props: PageProps) {
    const params = await props.params;
    try {
        const invoice = await getInvoiceDetail(params.id);

        if (!invoice) {
            return notFound();
        }

        return (
            <div className="container mx-auto py-8">
                <InvoiceDetail
                    invoice={invoice}
                    backUrl="/transporter/payments"
                />
            </div>
        );
    } catch (error) {
        console.error("Error loading invoice:", error);
        return notFound();
    }
}
