'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Notification } from '@/lib/types/database';
import { notificationService } from '@/lib/services/notification-service';
import {
    Bell,
    MessageSquare,
    Package,
    DollarSign,
    Award,
    Check,
    Filter,
    Search,
    Loader2,
    CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { PushNotificationManager } from '@/components/notifications/PushNotificationManager';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                await loadNotifications();

                const subscription = notificationService.subscribeToNotifications(user.id, (notification) => {
                    setNotifications(prev => [notification, ...prev]);
                });

                return () => {
                    subscription.unsubscribe();
                };
            }
        };

        init();
    }, []);

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            const data = await notificationService.fetchNotifications(100);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        try {
            await notificationService.markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.is_read;
        return n.notification_type === filter;
    });

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'message_received': return <MessageSquare className="h-5 w-5 text-blue-500" />;
            case 'shipment_update': return <Package className="h-5 w-5 text-orange-500" />;
            case 'payment_received': return <DollarSign className="h-5 w-5 text-green-500" />;
            case 'bid_awarded': return <Award className="h-5 w-5 text-purple-500" />;
            case 'dispute_created': return <Bell className="h-5 w-5 text-red-500" />;
            case 'dispute_resolved': return <Check className="h-5 w-5 text-green-500" />;
            case 'bid_rejected': return <MessageSquare className="h-5 w-5 text-gray-500" />;
            default: return <Bell className="h-5 w-5 text-muted-foreground" />;
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">Manage your alerts and stay updated with your shipment activities.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={!notifications.some(n => !n.is_read)}
                    >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark all as read
                    </Button>
                </div>
            </div>

            <PushNotificationManager />

            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Notifications</SelectItem>
                                <SelectItem value="unread">Unread Only</SelectItem>
                                <SelectItem value="shipment_update">Shipment Updates</SelectItem>
                                <SelectItem value="bid_awarded">Bids & Awards</SelectItem>
                                <SelectItem value="message_received">Messages</SelectItem>
                                <SelectItem value="payment_received">Payments</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Badge variant="secondary">
                        {filteredNotifications.length} items
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading your notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold">No notifications found</h3>
                            <p className="text-sm text-muted-foreground max-w-[300px] mt-1">
                                {filter === 'unread'
                                    ? "You've read all your notifications! Great job."
                                    : "We couldn't find any notifications matching your selection."}
                            </p>
                            {filter !== 'all' && (
                                <Button variant="link" onClick={() => setFilter('all')} className="mt-2">
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredNotifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-6 transition-all hover:bg-muted/30 relative group",
                                        !n.is_read && "bg-primary/5 dark:bg-primary/10"
                                    )}
                                >
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0 bg-background border rounded-2xl p-3 shadow-sm group-hover:shadow-md transition-shadow">
                                            {getNotificationIcon(n.notification_type)}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <h4 className={cn("text-base font-semibold", !n.is_read && "text-primary")}>
                                                    {n.title}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                    </span>
                                                    {!n.is_read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => handleMarkAsRead(n.id)}
                                                            title="Mark as read"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-3 pt-1">
                                                {n.related_entity_type && (
                                                    <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-wider">
                                                        View {n.related_entity_type}
                                                    </Button>
                                                )}
                                                {!n.is_read && (
                                                    <Badge className="bg-primary text-primary-foreground text-[10px] h-5">New</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
