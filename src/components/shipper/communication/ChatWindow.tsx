'use client';

import React, { useEffect, useState, useRef } from 'react';
import { messageService } from '@/lib/services/message-service';
import { Message, Profile } from '@/lib/types/database';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
    shipmentId: string;
    currentUserId: string;
    transporterId?: string;
    driverId?: string;
}

export function ChatWindow({ shipmentId, currentUserId, transporterId, driverId }: ChatWindowProps) {
    const [messages, setMessages] = useState<(Message & { sender_profile?: Profile })[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const data = await messageService.fetchMessages({ shipment_id: shipmentId });
                setMessages(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading messages:', error);
                setIsLoading(false);
            }
        };

        loadMessages();

        const subscription = messageService.subscribeToMessages(shipmentId, (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [shipmentId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await messageService.sendMessage({
                conversation_type: 'shipment_chat',
                related_shipment_id: shipmentId,
                sender_user_id: currentUserId,
                message_content: newMessage.trim(),
                message_type: 'text',
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleQuickAction = (text: string) => {
        setNewMessage(text);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-muted/30">
                <h3 className="font-semibold text-lg">Shipment Chat</h3>
                <p className="text-xs text-muted-foreground">Real-time communication for shipment #{shipmentId.slice(0, 8)}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {[
                        { label: "ETA?", text: "What is your current ETA?" },
                        { label: "Loaded?", text: "Is the load ready and secured?" },
                        { label: "POD?", text: "Please upload the Proof of Delivery document." },
                        { label: "Location?", text: "Can you confirm your current location?" },
                    ].map((action) => (
                        <Button
                            key={action.label}
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => handleQuickAction(action.text)}
                            className="whitespace-nowrap rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] font-bold uppercase tracking-wider h-7 border-none"
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>

                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.sender_user_id === currentUserId;
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-end gap-2 max-w-[85%]",
                                    isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                {!isMe && (
                                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                        <AvatarImage src={msg.sender_profile?.avatar_url || ''} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                            {msg.sender_profile?.first_name?.[0] || msg.sender_profile?.last_name?.[0] || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className="flex flex-col gap-1">
                                    <div
                                        className={cn(
                                            "px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all",
                                            isMe
                                                ? "bg-slate-900 text-white rounded-br-none"
                                                : "bg-white border text-slate-900 rounded-bl-none"
                                        )}
                                    >
                                        {msg.message_content}
                                    </div>
                                    <span className={cn("text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1", isMe && "text-right")}>
                                        {format(new Date(msg.sent_at), 'HH:mm')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/30 flex gap-2">
                <Button variant="outline" size="icon" type="button" className="shrink-0 rounded-full">
                    <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" type="button" className="shrink-0 rounded-full">
                    <FileText className="h-4 w-4" />
                </Button>
                <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 rounded-full bg-background"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending} className="shrink-0 rounded-full">
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </form>
        </div>
    );
}
