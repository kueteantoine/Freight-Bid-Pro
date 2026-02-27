'use client';

import React, { useEffect, useState } from 'react';
import { notificationService } from '@/lib/services/notification-service';
import { Notification } from '@/lib/types/database';
import { Bell, Check, Loader2, MessageSquare, Package, DollarSign, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationCenterProps {
    userId: string;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const data = await notificationService.fetchNotifications();
                setNotifications(data);
                setIsLoading(false);
            } catch (error: any) {
                console.error('Error loading notifications:', error.message || error);
                setIsLoading(false);
            }
        };

        loadNotifications();

        const subscription = notificationService.subscribeToNotifications(userId, (notification) => {
            setNotifications(prev => [notification, ...prev]);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead(userId);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'message_received': return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'shipment_update': return <Package className="h-4 w-4 text-orange-500" />;
            case 'payment_received': return <DollarSign className="h-4 w-4 text-green-500" />;
            case 'bid_awarded': return <Award className="h-4 w-4 text-purple-500" />;
            case 'dispute_created': return <Bell className="h-4 w-4 text-red-500" />;
            case 'dispute_resolved': return <Check className="h-4 w-4 text-green-500" />;
            case 'bid_rejected': return <MessageSquare className="h-4 w-4 text-gray-500" />;
            default: return <Bell className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-background animate-pulse"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs h-7 px-2 hover:text-primary"
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-80">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-4 transition-colors hover:bg-muted/50 relative group",
                                        !n.is_read && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0 bg-background border p-2 rounded-full shadow-sm">
                                            {getNotificationIcon(n.notification_type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-xs font-medium leading-none", !n.is_read && "font-bold pr-4")}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    {!n.is_read && (
                                        <button
                                            onClick={() => handleMarkAsRead(n.id)}
                                            className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity"
                                            title="Mark as read"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Link
                        href="/notifications"
                        className="text-xs text-primary hover:underline font-medium"
                    >
                        View all notifications
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
