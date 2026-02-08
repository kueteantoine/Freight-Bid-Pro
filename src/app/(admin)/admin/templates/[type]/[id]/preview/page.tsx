import { notFound } from 'next/navigation';
import { getTemplateById } from '@/lib/services/admin/templates';
import { TemplatePreviewWrapper } from '../../_components/template-preview-wrapper';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface PreviewTemplatePageProps {
    params: Promise<{
        type: string;
        id: string;
    }>;
}

export default async function PreviewTemplatePage({ params }: PreviewTemplatePageProps) {
    const { type, id } = await params;

    if (type !== 'email' && type !== 'sms') {
        return notFound();
    }

    const result = await getTemplateById(id, type as 'email' | 'sms');

    if (!result.success || !result.data) {
        return notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Preview Template</h1>
                    <p className="text-muted-foreground">
                        {result.data.template_name} ({type.toUpperCase()})
                    </p>
                </div>
                <Link href="/admin/templates">
                    <Button variant="outline">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to List
                    </Button>
                </Link>
            </div>

            <TemplatePreviewWrapper
                template={result.data}
                type={type as 'email' | 'sms'}
            />
        </div>
    );
}
