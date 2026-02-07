"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, AlertCircle, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getAllDisputes, type Dispute } from "@/app/actions/dispute-actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DisputeDashboardProps {
    onSelectDispute: (dispute: Dispute) => void;
    selectedDisputeId?: string;
}

export function DisputeDashboard({ onSelectDispute, selectedDisputeId }: DisputeDashboardProps) {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");

    useEffect(() => {
        loadDisputes();
    }, [statusFilter, priorityFilter, searchQuery]);

    const loadDisputes = async () => {
        setLoading(true);
        const { data, error } = await getAllDisputes({
            status: statusFilter === "all" ? undefined : statusFilter,
            priority: priorityFilter === "all" ? undefined : priorityFilter,
            search: searchQuery || undefined,
        });

        if (data) {
            setDisputes(data);
        }
        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "open":
                return "bg-blue-100 text-blue-600";
            case "under_review":
                return "bg-amber-100 text-amber-600";
            case "resolved":
                return "bg-emerald-100 text-emerald-600";
            case "escalated":
                return "bg-rose-100 text-rose-600";
            case "closed":
                return "bg-slate-100 text-slate-600";
            default:
                return "bg-slate-100 text-slate-600";
        }
    };

    const getPriorityIndicator = (priority: string) => {
        switch (priority) {
            case "urgent":
                return <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />;
            case "high":
                return <div className="h-2 w-2 rounded-full bg-orange-500" />;
            case "medium":
                return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
            default:
                return null;
        }
    };

    const openCount = disputes.filter((d) => d.status === "open").length;

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 pt-6 space-y-4 mb-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Dispute Center</h2>
                    <Badge className="bg-primary/10 text-primary border-none font-bold">
                        {openCount} Open
                    </Badge>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search Load ID or Party..."
                        className="pl-9 h-11 bg-slate-50 border-slate-100 rounded-xl focus:bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 rounded-lg bg-slate-50 border-slate-100">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="h-9 rounded-lg bg-slate-50 border-slate-100">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : disputes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-500">No disputes found</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Try adjusting your filters
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {disputes.map((dispute) => (
                            <DisputeListItem
                                key={dispute.id}
                                dispute={dispute}
                                selected={selectedDisputeId === dispute.id}
                                onClick={() => onSelectDispute(dispute)}
                                getStatusColor={getStatusColor}
                                getPriorityIndicator={getPriorityIndicator}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

interface DisputeListItemProps {
    dispute: Dispute;
    selected: boolean;
    onClick: () => void;
    getStatusColor: (status: string) => string;
    getPriorityIndicator: (priority: string) => React.ReactNode;
}

function DisputeListItem({
    dispute,
    selected,
    onClick,
    getStatusColor,
    getPriorityIndicator,
}: DisputeListItemProps) {
    const formatTimeAgo = (hours: number) => {
        if (hours < 1) return `${Math.round(hours * 60)}m ago`;
        if (hours < 24) return `${Math.round(hours)}h ago`;
        return `${Math.round(hours / 24)}d ago`;
    };

    return (
        <div
            className={cn(
                "p-6 cursor-pointer transition-all border-l-4",
                selected
                    ? "bg-primary/5 border-primary shadow-inner"
                    : "hover:bg-slate-50 border-transparent"
            )}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {getPriorityIndicator(dispute.priority)}
                    <span className="text-sm font-bold text-slate-900">
                        #{dispute.dispute_number}
                    </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                    {formatTimeAgo(dispute.age_hours)}
                </span>
            </div>

            <h3 className="text-sm font-bold text-slate-700 truncate mb-2">
                {dispute.raised_by_email} vs. {dispute.against_email}
            </h3>

            <div className="flex items-center gap-2 mb-2">
                <Badge
                    variant="outline"
                    className={cn(
                        "rounded-lg border-none text-[9px] font-black px-2 py-0.5",
                        getStatusColor(dispute.status)
                    )}
                >
                    {dispute.status.replace("_", " ").toUpperCase()}
                </Badge>
                <span className="text-[10px] text-slate-500 font-medium">
                    {dispute.dispute_type}
                </span>
            </div>

            {dispute.assigned_admin_email && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <User className="h-3 w-3" />
                    <span>{dispute.assigned_admin_email}</span>
                </div>
            )}
        </div>
    );
}
