import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ContentPageList } from './_components/content-page-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function ContentManagementPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
                    <p className="text-muted-foreground">
                        Manage content pages, legal documents, and help articles
                    </p>
                </div>
                <Link href="/admin/content/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Page
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Pages</TabsTrigger>
                    <TabsTrigger value="legal">Legal</TabsTrigger>
                    <TabsTrigger value="help">Help</TabsTrigger>
                    <TabsTrigger value="marketing">Marketing</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <ContentPageList />
                    </Suspense>
                </TabsContent>

                <TabsContent value="legal" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <ContentPageList pageType="legal" />
                    </Suspense>
                </TabsContent>

                <TabsContent value="help" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <ContentPageList pageType="help" />
                    </Suspense>
                </TabsContent>

                <TabsContent value="marketing" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <ContentPageList pageType="marketing" />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
