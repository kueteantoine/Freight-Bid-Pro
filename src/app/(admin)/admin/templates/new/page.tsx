import { TemplateForm } from '../_components/template-form';

export default function NewTemplatePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create New Template</h1>
                <p className="text-muted-foreground">
                    Design a new email or SMS template for system notifications
                </p>
            </div>

            <TemplateForm />
        </div>
    );
}
