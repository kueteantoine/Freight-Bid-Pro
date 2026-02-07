import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUserList } from './_components/admin-user-list';
import { PermissionMatrix } from './_components/permission-matrix';
import { AuditLogViewer } from './_components/audit-log-viewer';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminRolesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Role Management</h1>
                <p className="text-muted-foreground">
                    Manage admin users, roles, permissions, and view audit logs
                </p>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">Admin Users</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <AdminUserList />
                    </Suspense>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <PermissionMatrix />
                    </Suspense>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <AuditLogViewer />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
