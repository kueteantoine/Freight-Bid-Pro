"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, FileText, ClipboardList, Wallet, UserCheck, Calendar as CalendarIcon } from "lucide-react";
import { driverService } from "@/lib/services/driver-service";
import { DriverInvitation, Profile, DriverPayment } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteDriverDialog } from "./InviteDriverDialog";
import { AssignDriverDialog } from "./AssignDriverDialog";

export function DriverManagement() {
    const [drivers, setDrivers] = useState<Profile[]>([]);
    const [invitations, setInvitations] = useState<DriverInvitation[]>([]);
    const [payments, setPayments] = useState<(DriverPayment & { profiles: Profile | null })[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [driversData, invitationsData, paymentsData] = await Promise.all([
                driverService.getMyDrivers(),
                driverService.getMyInvitations(),
                driverService.getMyDriverPayments(),
            ]);
            setDrivers(driversData || []);
            setInvitations(invitationsData || []);
            setPayments(paymentsData || []);
        } catch (error) {
            console.error("Error fetching driver data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <AssignDriverDialog onAssign={fetchData} />
                <InviteDriverDialog onInvite={fetchData} />
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-[850px]">
                    <TabsTrigger value="active">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Active Drivers
                    </TabsTrigger>
                    <TabsTrigger value="invitations">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invitations
                    </TabsTrigger>
                    <TabsTrigger value="performance">
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Performance
                    </TabsTrigger>
                    <TabsTrigger value="availability">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Availability
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                        <Wallet className="w-4 h-4 mr-2" />
                        Payments
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Drivers</CardTitle>
                            <CardDescription>
                                List of drivers currently associated with your company.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {drivers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No active drivers found. Invite one to get started.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Driver</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Relationship</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {drivers.map((driver) => (
                                            <TableRow key={driver.id}>
                                                <TableCell className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={driver.avatar_url || ""} />
                                                        <AvatarFallback>
                                                            {driver.first_name?.[0] || ""}{driver.last_name?.[0] || "D"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">
                                                            {driver.first_name} {driver.last_name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">ID: {driver.id.slice(0, 8)}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                                                        Active
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    Direct Assignment
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">
                                                        View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invitations" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Invitations</CardTitle>
                            <CardDescription>
                                Invitations sent to drivers who haven't accepted yet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {invitations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No pending invitations.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Recipient</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Sent At</TableHead>
                                            <TableHead>Expires</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invitations.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell>
                                                    {inv.email || inv.phone_number}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            inv.status === 'accepted' ? 'bg-green-500/10 text-green-500' :
                                                                'bg-red-500/10 text-red-500'
                                                    }>
                                                        {inv.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(inv.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(inv.expires_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Overview</CardTitle>
                            <CardDescription>
                                Key metrics for your drivers' performance and reliability.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Rating</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">4.8 / 5.0</div>
                                        <div className="text-xs text-muted-foreground">+0.2 from last month</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">On-Time Rate</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">96%</div>
                                        <div className="text-xs text-muted-foreground text-green-500">Above average</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Trips Completed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">124</div>
                                        <div className="text-xs text-muted-foreground">Across all drivers</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="availability" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Driver Availability</CardTitle>
                            <CardDescription>
                                Weekly schedules and time-off requests for your drivers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {drivers.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No drivers found.
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {drivers.map(driver => (
                                            <div key={driver.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={driver.avatar_url || ""} />
                                                        <AvatarFallback>{driver.first_name?.[0] || ""}{driver.last_name?.[0] || ""}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{driver.first_name} {driver.last_name}</div>
                                                        <div className="text-xs text-muted-foreground">Standard Shift: Mon-Fri, 08:00 - 18:00</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-500">Available Now</Badge>
                                                    <Button variant="ghost" size="sm">View Schedule</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Driver Compensation</CardTitle>
                            <CardDescription>
                                Track and manage payments to your drivers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {payments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No payment records found.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Driver</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell>
                                                    {p.profiles?.first_name} {p.profiles?.last_name}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {p.amount.toLocaleString()} {p.currency}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        p.payment_status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                            p.payment_status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                'bg-red-500/10 text-red-500'
                                                    }>
                                                        {p.payment_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
