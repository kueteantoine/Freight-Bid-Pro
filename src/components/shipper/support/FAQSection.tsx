"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { supportService, FAQ } from "@/lib/services/support-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const FAQSection = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFAQs();
    }, []);

    const loadFAQs = async () => {
        try {
            setLoading(true);
            const data = await supportService.fetchFAQs();
            setFaqs(data);
        } catch (error) {
            console.error("Failed to load FAQs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            loadFAQs();
            return;
        }
        try {
            setLoading(true);
            const data = await supportService.searchFAQs(searchQuery);
            setFaqs(data);
        } catch (error) {
            console.error("Failed to search FAQs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Group FAQs by category
    const categories = Array.from(new Set(faqs.map((f) => f.category)));

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-primary" />
                    Frequently Asked Questions
                </h2>
                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Input
                        placeholder="Search help articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Button type="submit" variant="ghost" className="hidden">Search</Button>
                </form>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : faqs.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-slate-900">No FAQs found</h3>
                            <p className="text-slate-500 max-w-sm">
                                We couldn't find any articles matching your search query. Try different keywords or contact support.
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => { setSearchQuery(""); loadFAQs(); }}>
                            Clear Search
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Categories</h3>
                        <div className="space-y-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        const element = document.getElementById(`category-${cat}`);
                                        element?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-between group"
                                >
                                    {cat}
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                </button>
                            ))}
                        </div>

                        <Card className="bg-primary/5 border-primary/10">
                            <CardContent className="p-6 space-y-4">
                                <h4 className="font-semibold text-primary">Still need help?</h4>
                                <p className="text-sm text-slate-600">
                                    Can't find what you're looking for? Our support team is here to help.
                                </p>
                                <div className="space-y-2">
                                    <Button className="w-full">Create a Ticket</Button>
                                    <Button variant="outline" className="w-full">Live Chat</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-10">
                        {categories.map((category) => (
                            <div key={category} id={`category-${category}`} className="space-y-4 scroll-mt-24">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-slate-900">{category}</h3>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                        {faqs.filter(f => f.category === category).length}
                                    </Badge>
                                </div>
                                <Accordion type="single" collapsible className="w-full space-y-3">
                                    {faqs
                                        .filter((faq) => faq.category === category)
                                        .map((faq) => (
                                            <AccordionItem
                                                key={faq.id}
                                                value={faq.id}
                                                className="bg-white border rounded-xl px-2 hover:border-primary/30 transition-colors"
                                            >
                                                <AccordionTrigger className="hover:no-underline font-medium text-left py-4 px-4 text-slate-700">
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-4 pt-1 text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                </Accordion>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
