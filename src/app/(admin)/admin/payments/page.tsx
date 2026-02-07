import { Metadata } from "next";
import Link from "next/link";
import {
    CreditCard,
    TrendingUp,
    FileText,
    RefreshCw,
    DollarSign,
    AlertCircle
} from "lucide-react";

export const metadata: Metadata = {
    title: "Payment Administration | Admin Dashboard",
    description: "Manage payment aggregators, monitor transactions, and process refunds"
};

const paymentSections = [
    {
        title: "Payment Aggregators",
        description: "Configure mobile payment providers and fee structures",
        href: "/admin/payments/aggregators",
        icon: CreditCard,
        color: "bg-blue-500"
    },
    {
        title: "Payment Monitoring",
        description: "Real-time payment flow statistics and transaction tracking",
        href: "/admin/payments/monitoring",
        icon: TrendingUp,
        color: "bg-green-500"
    },
    {
        title: "Transactions",
        description: "Search and view detailed transaction information",
        href: "/admin/payments/transactions",
        icon: FileText,
        color: "bg-purple-500"
    },
    {
        title: "Reconciliation",
        description: "Match platform transactions with aggregator reports",
        href: "/admin/payments/reconciliation",
        icon: RefreshCw,
        color: "bg-orange-500"
    },
    {
        title: "Financial Reports",
        description: "Platform revenue, commission, and fee analytics",
        href: "/admin/payments/reports",
        icon: DollarSign,
        color: "bg-indigo-500"
    },
    {
        title: "Refund Processing",
        description: "Review and process refund requests",
        href: "/admin/payments/refunds",
        icon: AlertCircle,
        color: "bg-red-500"
    }
];

export default function PaymentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Payment Administration</h1>
                <p className="text-muted-foreground mt-2">
                    Manage payment processing, monitor transactions, and oversee financial operations
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {paymentSections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="block p-6 bg-card border rounded-lg hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${section.color}`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">
                                        {section.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {section.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
