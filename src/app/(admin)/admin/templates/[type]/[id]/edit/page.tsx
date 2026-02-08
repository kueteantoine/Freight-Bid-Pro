import { notFound } from 'next/navigation';
import { getTemplateById } from '@/lib/services/admin/templates';
import { TemplateForm } from '../../_components/template-form';

interface EditTemplatePageProps {
    params: Promise<{
        type: string;
        id: string;
    }>;
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
                <p className="text-muted-foreground">
                    Update the {type} template content and settings
                </p>
            </div>

            <TemplateForm
                initialData={result.data}
                type={type as 'email' | 'sms'}
                isEditing
            />
        </div>
    );
}
