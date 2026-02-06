"use client";

import React, { useState, useEffect } from "react";
import { getUserDetails, getUserActivity } from "@/actions/admin-user-actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    Mail,
    Phone,
    Calendar,
    Shield,
    TrendingUp,
    Package,
    CreditCard,
    Star,
    Activity,
    FileText,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserDetailModalProps {
    userId: string | null;
    open: boolean;
    onClose: () => void;
    onSuspend: () => void;
    onResetPassword: () => void;
}

export default function UserDetailModal({
    userId,
    open,
    onClose,
    onSuspend,
    onResetPassword,
}: UserDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [userActivity, setUserActivity] = useState<any>(null);

    useEffect(() => {
        if (userId && open) {
            fetchUserData();
        }
    }, [userId, open]);

    const fetchUserData = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const [details, activity] = await Promise.all([
                getUserDetails(userId),
                getUserActivity(userId),
            ]);
            setUserDetails(details);
            setUserActivity(activity);
        } catch (error: any) {
            toast.error("Failed to load user details");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!open || !userId) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">User Details</DialogTitle>
                    <DialogDescription>
                        Complete profile and activity information
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        <p className="text-sm text-muted-foreground">Loading user data...</p>
                    </div>
                ) : (
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                            <TabsTrigger value="stats">Statistics</TabsTrigger>
                        </TabsList>

                        {/* Profile Tab */}
                        <TabsContent value="profile" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Account Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-muted-foreground">
                                                Email
                                            </label>
                                            <p className="text-base">{userDetails?.profile?.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-muted-foreground">
                                                Phone
                                            </label>
                                            <p className="text-base">
                                                {userDetails?.profile?.phone_number || 'Not provided'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-muted-foreground">
                                                Account Status
                                            </label>
                                            <div className="mt-1">
                                                <Badge
                                                    variant={
                                                        userDetails?.profile?.account_status === 'active'
                                                            ? 'default'
                                                            : 'destructive'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {userDetails?.profile?.account_status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-muted-foreground">
                                                Joined
                                            </label>
                                            <p className="text-base flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                {format(
                                                    new Date(userDetails?.profile?.created_at),
                                                    'MMM dd, yyyy'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Roles & Verification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {userDetails?.roles?.map((role: any) => (
                                            <div
                                                key={role.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="capitalize">
                                                        {role.role_type}
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            role.verification_status === 'verified'
                                                                ? 'default'
                                                                : role.verification_status === 'pending'
                                                                    ? 'secondary'
                                                                    : 'destructive'
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {role.verification_status}
                                                    </Badge>
                                                    {!role.is_active && (
                                                        <Badge variant="destructive">Inactive</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Created {format(new Date(role.created_at), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex gap-2">
                                <Button variant="destructive" onClick={onSuspend}>
                                    Suspend Account
                                </Button>
                                <Button variant="outline" onClick={onResetPassword}>
                                    Reset Password
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Activity Tab */}
                        <TabsContent value="activity" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Recent Shipments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {userActivity?.recent_shipments?.length > 0 ? (
                                        <div className="space-y-2">
                                            {userActivity.recent_shipments.map((shipment: any) => (
                                                <div
                                                    key={shipment.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg"
                                                >
                                                    <div>
                                                        <p className="font-semibold">{shipment.shipment_number}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {shipment.pickup_location} → {shipment.delivery_location}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="capitalize">
                                                        {shipment.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No shipments found
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Recent Transactions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {userActivity?.recent_transactions?.length > 0 ? (
                                        <div className="space-y-2">
                                            {userActivity.recent_transactions.map((txn: any) => (
                                                <div
                                                    key={txn.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg"
                                                >
                                                    <div>
                                                        <p className="font-semibold capitalize">
                                                            {txn.transaction_type.replace('_', ' ')}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(txn.created_at), 'MMM dd, yyyy HH:mm')}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">{txn.gross_amount} XAF</p>
                                                        <Badge variant="outline" className="capitalize">
                                                            {txn.payment_status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No transactions found
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Documents Tab */}
                        <TabsContent value="documents" className="space-y-4">
                            {userDetails?.roles?.map((role: any) => (
                                <Card key={role.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 capitalize">
                                            <FileText className="h-5 w-5" />
                                            {role.role_type} Documents
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {role.verification_documents &&
                                            Object.keys(role.verification_documents).length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(role.verification_documents).map(
                                                    ([key, url]) => (
                                                        <Card key={key} className="overflow-hidden">
                                                            <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                                                                <span className="text-xs font-bold uppercase">
                                                                    {key.replace('_', ' ')}
                                                                </span>
                                                                <a
                                                                    href={url as string}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                                >
                                                                    <ExternalLink className="h-3 w-3" />
                                                                    View
                                                                </a>
                                                            </div>
                                                            <div className="aspect-video bg-muted flex items-center justify-center">
                                                                {(url as string).endsWith('.pdf') ? (
                                                                    <FileText className="h-12 w-12 text-muted-foreground" />
                                                                ) : (
                                                                    <img
                                                                        src={url as string}
                                                                        alt={key}
                                                                        className="object-contain w-full h-full"
                                                                    />
                                                                )}
                                                            </div>
                                                        </Card>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                No documents uploaded
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Statistics Tab */}
                        <TabsContent value="stats" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            Shipments
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Total</span>
                                                <span className="font-bold">
                                                    {userDetails?.shipment_stats?.total_as_shipper || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Completed
                                                </span>
                                                <span className="font-bold">
                                                    {userDetails?.shipment_stats?.completed_as_shipper || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    In Progress
                                                </span>
                                                <span className="font-bold">
                                                    {userDetails?.shipment_stats?.in_progress || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Payments
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Paid</span>
                                                <span className="font-bold">
                                                    {userDetails?.payment_stats?.total_paid || 0} XAF
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Received
                                                </span>
                                                <span className="font-bold">
                                                    {userDetails?.payment_stats?.total_received || 0} XAF
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Transactions
                                                </span>
                                                <span className="font-bold">
                                                    {userDetails?.payment_stats?.transaction_count || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Star className="h-4 w-4" />
                                            Ratings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Average</span>
                                                <span className="font-bold flex items-center gap-1">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    {Number(userDetails?.rating_stats?.average_rating || 0).toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Total Reviews
                                                </span>
                                                <span className="font-bold">
                                                    {userDetails?.rating_stats?.total_reviews || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}
