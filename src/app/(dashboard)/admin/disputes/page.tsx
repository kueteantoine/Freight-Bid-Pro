"use client";

import React, { useState } from "react";
import {
    Search,
    MoreHorizontal,
    ShieldAlert,
    History,
    Send,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function DisputeCenterPage() {
    const [selectedDispute, setSelectedDispute] = useState<string>("#CM-8821");

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden -m-6 md:-m-10">
            <div className="flex flex-1 min-h-0 bg-white">
                <aside className="w-96 border-r border-slate-100 flex flex-col pt-6">
                    <div className="px-6 space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Dispute Center</h2>
                            <Badge className="bg-primary/10 text-primary border-none font-bold">12 Open</Badge>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input placeholder="Search Load ID or Party..." className="pl-9 h-11 bg-slate-50 border-slate-100 rounded-xl focus:bg-white" />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="divide-y divide-slate-50">
                            <DisputeListItem
                                id="#CM-8821"
                                parties="TransCam vs. Dangote"
                                status="Under Review"
                                statusColor="bg-amber-100 text-amber-600"
                                lastMsg="Waiting for site photos..."
                                time="24m ago"
                                priority="high"
                                selected={selectedDispute === "#CM-8821"}
                                onClick={() => setSelectedDispute("#CM-8821")}
                            />
                        </div>
                    </ScrollArea>
                </aside>

                <div className="flex-1 flex flex-col bg-slate-50/30">
                    <header className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                                <ShieldAlert className="h-7 w-7 text-rose-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-extrabold text-slate-900">Load {selectedDispute}</h3>
                                    <Badge variant="outline" className="rounded-full border-rose-100 bg-rose-50 text-rose-600 font-bold px-3 py-0.5">HIGH PRIORITY</Badge>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    Dispute between <span className="font-bold text-slate-700">TransCam Logistics</span> (Carrier) and <span className="font-bold text-slate-700">Dangote Cement</span> (Shipper)
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="rounded-xl h-11 border-slate-200">
                                <History className="h-4 w-4 mr-2 text-slate-400" />
                                Case History
                            </Button>
                            <Button variant="outline" className="rounded-xl h-11 border-slate-200">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </header>

                    <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 flex flex-col border-r border-slate-100">
                            <ScrollArea className="flex-1 p-8">
                                <div className="space-y-8">
                                    <SystemMessage text="Dispute opened on Oct 27, 2026 - Claims: Incorrect Weight recorded at Weighbridge" />
                                    <ChatMessage
                                        sender="Dangote Cement"
                                        role="Shipper"
                                        text="The warehouse weighbridge says 24.5 tons, but the driver recorded 25.2 tons on the waybill. We need an adjustment of 0.7 tons."
                                        time="10:42 AM"
                                        isMe={false}
                                    />
                                    <ChatMessage
                                        sender="TransCam Logistics"
                                        role="Carrier"
                                        text="Our driver reported that the scales were not calibrated. We have a photo of the dashboard reading."
                                        time="11:15 AM"
                                        isMe={false}
                                        attachments={["dashboard_scale.jpg"]}
                                    />
                                    <ChatMessage
                                        sender="Admin"
                                        role="Platform Admin"
                                        text="I&apos;ve reviewed the documents. The Kribi weighbridge is usually more accurate. TransCam, can you provide the Kribi exit slip?"
                                        time="11:45 AM"
                                        isMe={true}
                                    />
                                </div>
                            </ScrollArea>
                            <footer className="p-6 bg-white border-t border-slate-100">
                                <div className="relative group flex gap-2">
                                    <Input
                                        placeholder="Type your message..."
                                        className="h-16 pl-6 pr-32 bg-slate-50 border-slate-100 rounded-2xl focus:bg-white transition-all text-sm"
                                    />
                                    <Button className="h-16 px-6 bg-primary rounded-xl font-bold flex items-center gap-2">
                                        <Send className="h-4 w-4" /> Send
                                    </Button>
                                </div>
                            </footer>
                        </div>

                        <aside className="w-96 bg-white flex flex-col pt-8">
                            <div className="px-8 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Financial Overview</h4>
                                    <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Original Amount</span>
                                            <span className="font-bold text-slate-900">XAF 1,450,000</span>
                                        </div>
                                        <Separator className="bg-slate-200" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-900">Total Escrow</span>
                                            <span className="text-lg font-black text-primary">XAF 1,377,500</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4">
                                    <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 rounded-2xl font-black transition-all">
                                        Resolve Dispute
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed px-4">
                                        By resolving this dispute, funds will be released to both parties&apos; wallets immediately.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DisputeListItem({ id, parties, status, statusColor, lastMsg, time, priority, selected, onClick }: any) {
    return (
        <div
            className={cn(
                "p-6 cursor-pointer transition-all border-l-4",
                selected ? "bg-primary/5 border-primary shadow-inner" : "hover:bg-slate-50 border-transparent"
            )}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {priority === "high" && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>}
                    <span className="text-sm font-bold text-slate-900">{id}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{time}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-700 truncate mb-2">{parties}</h3>
            <div className="flex justify-between items-center">
                <Badge variant="outline" className={cn("rounded-lg border-none text-[9px] font-black px-2 py-0.5", statusColor)}>
                    {status}
                </Badge>
            </div>
        </div>
    );
}

function ChatMessage({ sender, role, text, time, isMe, attachments }: any) {
    return (
        <div className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
            <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[11px] font-black text-slate-900">{sender}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{role}</span>
                <span className="text-[10px] text-slate-400 ml-2">{time}</span>
            </div>
            <div className={cn(
                "rounded-3xl p-5 text-sm leading-relaxed shadow-sm",
                isMe ? "bg-primary text-white" : "bg-white border border-slate-100 text-slate-700"
            )}>
                {text}
            </div>
            {attachments && (
                <div className="flex gap-2 mt-3">
                    {attachments.map((file: string) => (
                        <div key={file} className="bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
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
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 px-4 py-1 rounded-full border border-slate-100">{text}</span>
            <div className="flex-1 h-px bg-slate-100"></div>
        </div>
    );
}