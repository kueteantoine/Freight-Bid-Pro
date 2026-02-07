'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllAdminRoles, getPermissionsByCategory } from '@/lib/services/admin/admin-permissions';
import { Check } from 'lucide-react';

export function PermissionMatrix() {
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const [rolesResult, permissionsResult] = await Promise.all([
                getAllAdminRoles(),
                getPermissionsByCategory(),
            ]);

            if (rolesResult.success) {
                setRoles(rolesResult.data || []);
            }
            if (permissionsResult.success) {
                setPermissions(permissionsResult.data || {});
            }
            setLoading(false);
        }

        fetchData();
    }, []);

    if (loading) {
        return <div>Loading permission matrix...</div>;
    }

    return (
        <div className="space-y-6">
            {Object.entries(permissions).map(([category, perms]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
                        <CardDescription>{perms.length} permissions in this category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-4 font-medium">Permission</th>
                                        {roles.map((role) => (
                                            <th key={role.role_name} className="text-center py-2 px-4 font-medium">
                                                {role.display_name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {perms.map((permission) => (
                                        <tr key={permission.permission_key} className="border-b">
                                            <td className="py-2 px-4">
                                                <div>
                                                    <p className="font-medium">{permission.permission_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                            </td>
                                            {roles.map((role) => (
                                                <td key={role.role_name} className="text-center py-2 px-4">
                                                    {/* This would need to be populated from role_permissions data */}
                                                    <Check className="h-4 w-4 mx-auto text-green-600" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
