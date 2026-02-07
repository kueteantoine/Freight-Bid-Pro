"use client";

import React, { useState, useEffect } from "react";
import {
    ShieldAlert,
    History,
    MoreHorizontal,
    Send,
    FileText,
    User,
    Calendar,
    Package,
    DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    getDisputeById,
    type DisputeDetails,
    updateDisputeStatus,
    assignDisputeToAdmin,
    addDisputeMessage,
} from "@/app/actions/dispute-actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DisputeResolutionForm } from "./DisputeResolutionForm";

interface DisputeDetailViewProps {
    disputeId: string;
    onClose?: () => void;
}

export function DisputeDetailView({ disputeId, onClose }: DisputeDetailViewProps) {
    const [dispute, setDispute] = useState<DisputeDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [showResolutionForm, setShowResolutionForm] = useState(false);

    useEffect(() => {
        loadDispute();
    }, [disputeId]);

    const loadDispute = async () => {
        setLoading(true);
        const { data, error } = await getDisputeById(disputeId);
        if (data) {
            setDispute(data);
        }
        setLoading(false);
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!dispute) return;

        const { success } = await updateDisputeStatus(dispute.id, newStatus);
        if (success) {
            loadDispute();
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !dispute) return;

        setSending(true);
        const { success } = await addDisputeMessage(dispute.id, message);
        if (success) {
            setMessage("");
            loadDispute();
        }
        setSending(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (!dispute) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Dispute not found</p>
            </div>
        );
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent":
                return "border-rose-100 bg-rose-50 text-rose-600";
            case "high":
                return "border-orange-100 bg-orange-50 text-orange-600";
            case "medium":
                return "border-yellow-100 bg-yellow-50 text-yellow-600";
            default:
                return "border-slate-100 bg-slate-50 text-slate-600";
        }
    };

    // Extract messages from evidence
    const messages = (dispute.evidence_urls_json as any[])?.filter(
        (item) => item.type === "message"
    ) || [];

    return (
        <div className="flex flex-col h-full bg-slate-50/30">
            {/* Header */}
            <header className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                        <ShieldAlert className="h-7 w-7 text-rose-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-extrabold text-slate-900">
                                Dispute #{dispute.dispute_number}
                            </h3>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "rounded-full font-bold px-3 py-0.5",
                                    getPriorityColor(dispute.priority)
                                )}
                            >
                                {dispute.priority.toUpperCase()} PRIORITY
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            <span className="font-bold text-slate-700">
                                {dispute.raised_by_email}
                            </span>{" "}
                            vs.{" "}
                            <span className="font-bold text-slate-700">
                                {dispute.against_email}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Select value={dispute.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-40 rounded-xl h-11 border-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 flex flex-col border-r border-slate-100">
                    {/* Dispute Info */}
                    <div className="p-6 bg-white border-b border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Package className="h-5 w-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Shipment
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                        {dispute.shipment_number}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Created
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                        {new Date(dispute.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Dispute Type
                            </p>
                            <Badge variant="outline" className="rounded-lg">
                                {dispute.dispute_type}
                            </Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Description
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {dispute.dispute_description}
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-8">
                        <div className="space-y-8">
                            <SystemMessage
                                text={`Dispute opened on ${new Date(
                                    dispute.created_at
                                ).toLocaleDateString()}`}
                            />
                            {messages.map((msg: any, idx: number) => (
                                <ChatMessage
                                    key={idx}
                                    text={msg.text}
                                    time={new Date(msg.timestamp).toLocaleTimeString()}
                                    attachments={msg.attachments}
                                />
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <footer className="p-6 bg-white border-t border-slate-100">
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Type your message..."
                                className="min-h-[60px] bg-slate-50 border-slate-100 rounded-2xl focus:bg-white resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <Button
                                className="h-[60px] px-6 bg-primary rounded-xl font-bold"
                                onClick={handleSendMessage}
                                disabled={sending || !message.trim()}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Send
                            </Button>
                        </div>
                    </footer>
                </div>

                {/* Sidebar */}
                <aside className="w-96 bg-white flex flex-col pt-8">
                    <div className="px-8 space-y-8">
                        {dispute.transaction_id && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">
                                    Financial Overview
                                </h4>
                                <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">
                                            Transaction ID
                                        </span>
                                        <span className="font-bold text-slate-900 text-xs">
                                            {dispute.transaction_id.slice(0, 8)}...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4">
                            <Button
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 rounded-2xl font-black"
                                onClick={() => setShowResolutionForm(true)}
                                disabled={dispute.status === "resolved" || dispute.status === "closed"}
                            >
                                Resolve Dispute
                            </Button>
                            <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed px-4">
                                By resolving this dispute, all parties will be notified of the decision.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Resolution Form Modal */}
            {showResolutionForm && (
                <DisputeResolutionForm
                    dispute={dispute}
                    onClose={() => setShowResolutionForm(false)}
                    onResolved={() => {
                        setShowResolutionForm(false);
                        loadDispute();
                    }}
                />
            )}
        </div>
    );
}

function ChatMessage({ text, time, attachments }: any) {
    return (
        <div className="flex flex-col max-w-[80%] items-start">
            <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[11px] font-black text-slate-900">Admin</span>
                <span className="text-[10px] text-slate-400 ml-2">{time}</span>
            </div>
            <div className="rounded-3xl p-5 text-sm leading-relaxed shadow-sm bg-white border border-slate-100 text-slate-700">
                {text}
            </div>
            {attachments && attachments.length > 0 && (
                <div className="flex gap-2 mt-3">
                    {attachments.map((file: string, idx: number) => (
                        <div
                            key={idx}
                            className="bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-50 transition-all"
                        >
                            <FileText className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-bold text-slate-600">{file}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SystemMessage({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 px-4 py-1 rounded-full border border-slate-100">
                {text}
            </span>
            <div className="flex-1 h-px bg-slate-100" />
        </div>
    );
}
