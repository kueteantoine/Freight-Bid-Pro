'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign,
    TrendingUp,
    Users,
    FileText,
    CreditCard,
    BarChart3,
    Plus,
    Download,
    Mail,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import { getBrokerCommissionDashboard } from '@/actions/broker-commission-actions';
import { getClientInvoices } from '@/actions/broker-billing-actions';
import { getPendingCarrierPayments } from '@/actions/broker-carrier-payment-actions';
import { getCommissionAnalytics, getCommissionTrends } from '@/actions/broker-analytics-actions';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function CommissionsPage() {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [trends, setTrends] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [dashboardRes, invoicesRes, paymentsRes, analyticsRes, trendsRes] = await Promise.all([
                getBrokerCommissionDashboard(),
                getClientInvoices({ limit: 10 }),
                getPendingCarrierPayments(),
                getCommissionAnalytics(),
                getCommissionTrends('monthly', 12)
            ]);

            if (dashboardRes.data) setDashboardData(dashboardRes.data);
            if (invoicesRes.data) setInvoices(invoicesRes.data);
            if (paymentsRes.data) setPendingPayments(paymentsRes.data);
            if (analyticsRes.data) setAnalytics(analyticsRes.data);
            if (trendsRes.data) setTrends(trendsRes.data);
        } catch (error) {
            console.error('Error loading commission data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading commission data...</p>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const trendsChartData = {
        labels: trends?.data?.map((d: any) => d.date) || [],
        datasets: [
            {
                label: 'Total Commission',
                data: trends?.data?.map((d: any) => d.total_commission) || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const clientsChartData = {
        labels: dashboardData?.top_earning_clients?.map((c: any) => c.client_name) || [],
        datasets: [
            {
                label: 'Commission Earned',
                data: dashboardData?.top_earning_clients?.map((c: any) => c.total_commission) || [],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                ]
            }
        ]
    };

    const commissionTypeData = {
        labels: ['Shipper Side', 'Carrier Side'],
        datasets: [
            {
                data: [
                    dashboardData?.commission_as_shipper || 0,
                    dashboardData?.commission_as_carrier || 0
                ],
                backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)']
            }
        ]
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Commission Management</h1>
                    <p className="text-muted-foreground">Track earnings, manage billing, and analyze performance</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'XAF' }).format(
                                dashboardData?.total_commissions_earned || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">All-time earnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'XAF' }).format(
                                dashboardData?.total_commissions_this_month || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Current month earnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Per Transaction</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'XAF' }).format(
                                dashboardData?.average_commission_per_transaction || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Average commission</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'XAF' }).format(
                                dashboardData?.pending_commissions || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting payment</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="invoices">Client Invoices</TabsTrigger>
                    <TabsTrigger value="payments">Carrier Payments</TabsTrigger>
                    <TabsTrigger value="rates">Commission Rates</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Commission Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Commission Trends</CardTitle>
                                <CardDescription>Last 12 months performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Line
                                    data={trendsChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context: any) => {
                                                        return `Commission: ${new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'XAF'
                                                        }).format(context.parsed.y)}`;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: (value: any) => {
                                                        return new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'XAF',
                                                            notation: 'compact'
                                                        }).format(value as number);
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Top Earning Clients */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Earning Clients</CardTitle>
                                <CardDescription>Clients generating most commission</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Bar
                                    data={clientsChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { display: false }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: (value) => {
                                                        return new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'XAF',
                                                            notation: 'compact'
                                                        }).format(value as number);
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Commission by Type */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Commission by Role</CardTitle>
                                <CardDescription>Breakdown by shipper/carrier side</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <div className="w-64 h-64">
                                    <Pie
                                        data={commissionTypeData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            plugins: {
                                                legend: { position: 'bottom' }
                                            }
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Latest commission transactions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {dashboardData?.top_earning_clients?.slice(0, 5).map((client: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{client.client_name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {client.transaction_count} transactions
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">
                                                    {new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: 'XAF'
                                                    }).format(client.total_commission)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Client Invoices Tab */}
                <TabsContent value="invoices" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Client Invoices</h2>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Generate Invoice
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Invoice #</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Due Date</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {invoices.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                    No invoices found. Generate your first invoice to get started.
                                                </td>
                                            </tr>
                                        ) : (
                                            invoices.map((invoice) => (
                                                <tr key={invoice.id} className="hover:bg-muted/50">
                                                    <td className="px-4 py-3 font-mono text-sm">{invoice.invoice_number}</td>
                                                    <td className="px-4 py-3">Client Name</td>
                                                    <td className="px-4 py-3 font-semibold">
                                                        {new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'XAF'
                                                        }).format(invoice.total_amount)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {new Date(invoice.due_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant={
                                                                invoice.payment_status === 'paid'
                                                                    ? 'default'
                                                                    : invoice.payment_status === 'pending'
                                                                        ? 'secondary'
                                                                        : 'destructive'
                                                            }
                                                        >
                                                            {invoice.payment_status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="ghost">
                                                                <Mail className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Carrier Payments Tab */}
                <TabsContent value="payments" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Carrier Payments</h2>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="text-lg px-4 py-2">
                                <Clock className="mr-2 h-4 w-4" />
                                Pending: {pendingPayments.length}
                            </Badge>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Carrier</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Shipment</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Gross Amount</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Commission</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Net Payment</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {pendingPayments.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                                    No pending payments
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingPayments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-muted/50">
                                                    <td className="px-4 py-3">Carrier Name</td>
                                                    <td className="px-4 py-3 font-mono text-sm">
                                                        {payment.shipment_id?.substring(0, 8)}...
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'XAF'
                                                        }).format(payment.gross_shipment_amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-orange-600 font-semibold">
                                                        -{new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'XAF'
                                                        }).format(payment.broker_commission_amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-green-600 font-semibold">
                                                        {new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'XAF'
                                                        }).format(payment.net_carrier_payment)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="secondary">{payment.payment_status}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="outline">
                                                                <Calendar className="mr-2 h-4 w-4" />
                                                                Schedule
                                                            </Button>
                                                            <Button size="sm">
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Mark Paid
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Commission Rates Tab */}
                <TabsContent value="rates" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Commission Rates</h2>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Rate
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rate Configuration</CardTitle>
                            <CardDescription>
                                Configure commission rates for different clients, routes, and volume tiers
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No commission rates configured yet.</p>
                                <p className="text-sm">Add your first rate to get started.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4">
                    <h2 className="text-2xl font-bold">Commission Analytics</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Profitable Routes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Most Profitable Routes</CardTitle>
                                <CardDescription>Routes generating highest commissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics?.profitable_routes?.slice(0, 5).map((route: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{route.route}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {route.transaction_count} shipments
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">
                                                    {new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: 'XAF'
                                                    }).format(route.total_commission)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Avg: {new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: 'XAF'
                                                    }).format(route.average_commission)}
                                                </p>
                                            </div>
                                        </div>
                                    )) || (
                                            <p className="text-center text-muted-foreground py-4">No route data available</p>
                                        )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Commission by Freight Type */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Commission by Freight Type</CardTitle>
                                <CardDescription>Performance by cargo category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics?.commission_by_freight_type?.map((type: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium capitalize">{type.freight_type}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {type.transaction_count} shipments
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">
                                                    {new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: 'XAF'
                                                    }).format(type.total_commission)}
                                                </p>
                                            </div>
                                        </div>
                                    )) || (
                                            <p className="text-center text-muted-foreground py-4">No freight type data available</p>
                                        )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
