import { Suspense } from 'react';
import { getAdminTranslations } from '@/app/actions/translations/translation-actions';
import { TranslationsManager } from '@/components/admin/settings/TranslationsManager';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations } from 'next-intl/server';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'admin' });
    return {
        title: t('translations', { fallback: 'Translation Management' }),
    };
}

export default async function TranslationsPage() {
    const { translations, error } = await getAdminTranslations();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Translation Management</h1>
                <p className="text-muted-foreground mt-2">
                    Manage dynamic translations that override static application text. Changes here are applied immediately across the site.
                </p>
            </div>

            {error ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Translations</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>}>
                    <TranslationsManager initialTranslations={translations || []} />
                </Suspense>
            )}
        </div>
    );
}
