"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Minus, Maximize2, User, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { messageService } from "@/lib/services/message-service";
import { Message } from "@/lib/types/database";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const LiveChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        checkUser();
    }, []);

    useEffect(() => {
        if (isOpen && userId) {
            loadMessages();
            const subscription = messageService.subscribeToMessages("support", (msg) => {
                if (msg.conversation_type === 'support_ticket') {
                    setMessages(prev => [...prev, msg]);
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [isOpen, userId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isMinimized]);

    const loadMessages = async () => {
        try {
            setIsLoading(true);
            // For simplicity, we use a global 'support' filter or a specific ticket
            // In a real app, we'd probably have an active support ticket ID
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_type', 'support_ticket')
                .or(`sender_user_id.eq.${userId},receiver_user_id.eq.${userId}`)
                .order('sent_at', { ascending: true });

            if (error) throw error;
            setMessages(data as Message[]);
        } catch (error) {
            console.error("Failed to load support messages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId) return;

        try {
            await messageService.sendMessage({
                conversation_type: 'support_ticket',
                sender_user_id: userId,
                message_content: newMessage,
                message_type: 'text'
            });
            setNewMessage("");
            // Realtime subscription will handle adding the message to the list
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform z-50 flex items-center justify-center p-0"
            >
                <MessageCircle className="w-6 h-6" />
            </Button>
        );
    }

    return (
        <Card className={`fixed bottom-6 right-6 w-[350px] shadow-2xl z-50 transition-all duration-300 ${isMinimized ? 'h-14 overflow-hidden' : 'h-[500px]'}`}>
            <CardHeader className="bg-primary text-white p-4 cursor-pointer flex flex-row items-center justify-between" onClick={() => setIsMinimized(!isMinimized)}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center relative">
                        <Headset className="w-4 h-4" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-primary rounded-full" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold">Support Center</CardTitle>
                        <p className="text-[10px] text-white/70">Online • Typically replies in 5m</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 hover:bg-white/20 text-white p-0"
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                    >
                        {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 hover:bg-white/20 text-white p-0"
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </CardHeader>

            {!isMinimized && (
                <>
                    <CardContent
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth h-[380px]"
                    >
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6">
                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">How can we help you?</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Ask us anything about bookings, payments or tracking.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const isOwn = msg.sender_user_id === userId;
                                return (
                                    <div key={msg.id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        {!isOwn && (
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center mr-2 mt-1">
                                                <Headset className="w-3 h-3 text-slate-500" />
                                            </div>
                                        )}
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${isOwn
                                                ? 'bg-primary text-white rounded-tr-none'
                                                : 'bg-white border text-slate-700 rounded-tl-none shadow-sm'
                                            }`}>
                                            {msg.message_content}
                                            <p className={`text-[9px] mt-1 ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
                                                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>

                    <CardFooter className="p-3 border-t bg-white">
                        <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                            <Input
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 h-9 rounded-full bg-slate-100 border-none focus-visible:ring-primary/20 text-xs"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!newMessage.trim()}
                                className="h-9 w-9 rounded-full shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </>
            )}
        </Card>
    );
};
