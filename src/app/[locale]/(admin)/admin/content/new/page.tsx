'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createContentPage } from '@/lib/services/admin/content';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function NewContentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        page_slug: '',
        page_type: 'help' as 'legal' | 'help' | 'marketing',
        title: '',
        content: '',
        content_format: 'html' as 'html' | 'markdown' | 'plain_text',
        language: 'en',
        meta_description: '',
        meta_keywords: '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        const result = await createContentPage({
            ...formData,
            meta_keywords: formData.meta_keywords ? formData.meta_keywords.split(',').map(k => k.trim()) : undefined,
        });

        if (result.success) {
            toast({
                title: 'Content Page Created',
                description: 'The content page has been created successfully.',
            });
            router.push(`/admin/content/${result.data.id}/edit`);
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to create content page',
                variant: 'destructive',
            });
        }
        setSubmitting(false);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Content Page</h1>
                <p className="text-muted-foreground">Create a new content page</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Page Information</CardTitle>
                        <CardDescription>Basic information about the content page</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug *</Label>
                                <Input
                                    id="slug"
                                    value={formData.page_slug}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            page_slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                                        })
                                    }
                                    placeholder="terms-of-service"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Page Type *</Label>
                                <Select
                                    value={formData.page_type}
                                    onValueChange={(value: any) => setFormData({ ...formData, page_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="legal">Legal</SelectItem>
                                        <SelectItem value="help">Help</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="language">Language *</Label>
                                <Select
                                    value={formData.language}
                                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="format">Content Format *</Label>
                                <Select
                                    value={formData.content_format}
                                    onValueChange={(value: any) =>
                                        setFormData({ ...formData, content_format: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="html">HTML</SelectItem>
                                        <SelectItem value="markdown">Markdown</SelectItem>
                                        <SelectItem value="plain_text">Plain Text</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Content *</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={15}
                                className="font-mono text-sm"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                You can edit this with a rich text editor after creating the page
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="meta_description">Meta Description</Label>
                            <Textarea
                                id="meta_description"
                                value={formData.meta_description}
                                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                rows={3}
                                placeholder="SEO meta description"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="meta_keywords">Meta Keywords</Label>
                            <Input
                                id="meta_keywords"
                                value={formData.meta_keywords}
                                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                                placeholder="keyword1, keyword2, keyword3"
                            />
                            <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={submitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {submitting ? 'Creating...' : 'Create Page'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
