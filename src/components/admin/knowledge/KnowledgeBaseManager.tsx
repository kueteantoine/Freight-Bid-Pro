"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    getAllFAQsAdmin,
    deleteFAQ,
    toggleFAQPublished,
    type FAQ,
} from "@/app/actions/faq-admin-actions";
import { FAQEditor } from "./FAQEditor";

export function KnowledgeBaseManager() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    useEffect(() => {
        loadFAQs();
    }, []);

    const loadFAQs = async () => {
        setLoading(true);
        const { data } = await getAllFAQsAdmin();
        if (data) setFaqs(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this FAQ?")) return;
        await deleteFAQ(id);
        loadFAQs();
    };

    const handleTogglePublished = async (id: string) => {
        await toggleFAQPublished(id);
        loadFAQs();
    };

    const handleEdit = (faq: FAQ) => {
        setSelectedFAQ(faq);
        setShowEditor(true);
    };

    const handleCreate = () => {
        setSelectedFAQ(null);
        setShowEditor(true);
    };

    const filteredFAQs = faqs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = [];
        acc[faq.category].push(faq);
        return acc;
    }, {} as Record<string, FAQ[]>);

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 bg-white border-b border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">Knowledge Base</h2>
                    <Button onClick={handleCreate} className="rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Add FAQ
                    </Button>
                </div>
                <Input
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50"
                />
            </div>

            <ScrollArea className="flex-1 p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
                            <div key={category}>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                                    {category}
                                </h3>
                                <div className="space-y-3">
                                    {categoryFAQs.map((faq) => (
                                        <div
                                            key={faq.id}
                                            className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="text-sm font-bold text-slate-900">
                                                            {faq.question}
                                                        </h4>
                                                        {!faq.is_published && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Draft
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 line-clamp-2">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleTogglePublished(faq.id)}
                                                    >
                                                        {faq.is_published ? (
                                                            <Eye className="h-4 w-4" />
                                                        ) : (
                                                            <EyeOff className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(faq)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(faq.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-rose-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {showEditor && (
                <FAQEditor
                    faq={selectedFAQ}
                    onClose={() => {
                        setShowEditor(false);
                        setSelectedFAQ(null);
                    }}
                    onSaved={() => {
                        setShowEditor(false);
                        setSelectedFAQ(null);
                        loadFAQs();
                    }}
                />
            )}
        </div>
    );
}
