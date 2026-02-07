"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createFAQ, updateFAQ, type FAQ } from "@/app/actions/faq-admin-actions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface FAQEditorProps {
    faq: FAQ | null;
    onClose: () => void;
    onSaved: () => void;
}

export function FAQEditor({ faq, onClose, onSaved }: FAQEditorProps) {
    const [question, setQuestion] = useState(faq?.question || "");
    const [answer, setAnswer] = useState(faq?.answer || "");
    const [category, setCategory] = useState(faq?.category || "general");
    const [language, setLanguage] = useState(faq?.language || "en");
    const [isPublished, setIsPublished] = useState(faq?.is_published ?? true);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!question.trim() || !answer.trim()) return;

        setSaving(true);

        if (faq) {
            await updateFAQ(faq.id, {
                question,
                answer,
                category,
                language,
                is_published: isPublished,
            });
        } else {
            await createFAQ({
                question,
                answer,
                category,
                language,
            });
        }

        setSaving(false);
        onSaved();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{faq ? "Edit FAQ" : "Create FAQ"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="question">Question *</Label>
                        <Input
                            id="question"
                            placeholder="Enter the question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="h-11 rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="answer">Answer *</Label>
                        <Textarea
                            id="answer"
                            placeholder="Enter the answer..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="min-h-[150px] rounded-xl resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category" className="h-11 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="account">Account</SelectItem>
                                    <SelectItem value="billing">Billing</SelectItem>
                                    <SelectItem value="shipment">Shipment</SelectItem>
                                    <SelectItem value="technical">Technical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger id="language" className="h-11 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {faq && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="published"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                                className="rounded"
                            />
                            <Label htmlFor="published" className="cursor-pointer">
                                Published
                            </Label>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose} className="rounded-xl">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="rounded-xl"
                        disabled={!question.trim() || !answer.trim() || saving}
                    >
                        {saving ? "Saving..." : "Save FAQ"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
