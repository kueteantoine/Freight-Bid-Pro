import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateList } from './_components/template-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function TemplatesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Template Management</h1>
                    <p className="text-muted-foreground">
                        Manage email and SMS templates with variable substitution
                    </p>
                </div>
                <Link href="/admin/templates/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Template
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="email" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="email">Email Templates</TabsTrigger>
                    <TabsTrigger value="sms">SMS Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <TemplateList templateType="email" />
                    </Suspense>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <TemplateList templateType="sms" />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
