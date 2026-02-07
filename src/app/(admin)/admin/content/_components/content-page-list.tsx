'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getContentPages, publishContentPage, unpublishContentPage } from '@/lib/services/admin/content';
import { Edit, Eye, EyeOff, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface ContentPageListProps {
    pageType?: 'legal' | 'help' | 'marketing';
}

export function ContentPageList({ pageType }: ContentPageListProps) {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchPages();
    }, [pageType]);

    async function fetchPages() {
        setLoading(true);
        const result = await getContentPages(pageType ? { page_type: pageType } : undefined);
        if (result.success) {
            setPages(result.data || []);
        }
        setLoading(false);
    }

    async function handlePublish(pageId: string) {
        const result = await publishContentPage(pageId);
        if (result.success) {
            toast({
                title: 'Page Published',
                description: 'The content page has been published.',
            });
            fetchPages();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to publish page',
                variant: 'destructive',
            });
        }
    }

    async function handleUnpublish(pageId: string) {
        const result = await unpublishContentPage(pageId);
        if (result.success) {
            toast({
                title: 'Page Unpublished',
                description: 'The content page has been unpublished.',
            });
            fetchPages();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to unpublish page',
                variant: 'destructive',
            });
        }
    }

    if (loading) {
        return <div>Loading content pages...</div>;
    }

    if (pages.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Content Pages</CardTitle>
                    <CardDescription>
                        {pageType ? `No ${pageType} pages found` : 'No content pages found'}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Content Pages</CardTitle>
                <CardDescription>
                    {pages.length} page{pages.length !== 1 ? 's' : ''} found
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pages.map((page) => (
                            <TableRow key={page.id}>
                                <TableCell className="font-medium">{page.title}</TableCell>
                                <TableCell>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {page.page_slug}
                                    </code>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{page.page_type}</Badge>
                                </TableCell>
                                <TableCell>{page.language?.toUpperCase()}</TableCell>
                                <TableCell>
                                    {page.is_published ? (
                                        <Badge>Published</Badge>
                                    ) : (
                                        <Badge variant="secondary">Draft</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(page.updated_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/admin/content/${page.id}/edit`}>
                                            <Button variant="ghost" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/admin/content/${page.id}/history`}>
                                            <Button variant="ghost" size="sm">
                                                <History className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {page.is_published ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUnpublish(page.id)}
                                            >
                                                <EyeOff className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePublish(page.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
