import React from "react";
import { getInvoiceDetail } from "@/app/actions/payment-actions";
import { InvoiceDetail } from "@/components/shipper/payments/InvoiceDetail";
import { notFound } from "next/navigation";

interface PageProps {
    params: { id: string };
}

export default async function ShipperInvoicePage({ params }: PageProps) {
    try {
        const invoice = await getInvoiceDetail(params.id);

        if (!invoice) {
            return notFound();
        }

        return (
            <div className="container mx-auto py-8">
                <InvoiceDetail
                    invoice={invoice}
                    backUrl="/shipper/payments"
                />
            </div>
        );
    } catch (error) {
        console.error("Error loading invoice:", error);
        return notFound();
    }
}
