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
import { getEmailTemplates, getSmsTemplates } from '@/lib/services/admin/templates';
import { Edit, Eye } from 'lucide-react';
import Link from 'next/link';

interface TemplateListProps {
    templateType: 'email' | 'sms';
}

export function TemplateList({ templateType }: TemplateListProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, [templateType]);

    async function fetchTemplates() {
        setLoading(true);
        const result =
            templateType === 'email' ? await getEmailTemplates() : await getSmsTemplates();
        if (result.success) {
            setTemplates(result.data || []);
        }
        setLoading(false);
    }

    if (loading) {
        return <div>Loading templates...</div>;
    }

    if (templates.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Templates</CardTitle>
                    <CardDescription>
                        No {templateType} templates found. Create your first template to get started.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{templateType === 'email' ? 'Email' : 'SMS'} Templates</CardTitle>
                <CardDescription>
                    {templates.length} template{templates.length !== 1 ? 's' : ''} found
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Template Key</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Variables</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell className="font-medium">{template.template_name}</TableCell>
                                <TableCell>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {template.template_key}
                                    </code>
                                </TableCell>
                                <TableCell>{template.language?.toUpperCase()}</TableCell>
                                <TableCell>
                                    {template.category && <Badge variant="outline">{template.category}</Badge>}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {template.variables_schema?.length || 0} variables
                                </TableCell>
                                <TableCell>
                                    {template.is_active ? (
                                        <Badge>Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/admin/templates/${templateType}/${template.id}/edit`}>
                                            <Button variant="ghost" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/admin/templates/${templateType}/${template.id}/preview`}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
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
