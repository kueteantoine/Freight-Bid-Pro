'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getAdminAuditLog } from '@/lib/services/admin/admin-permissions';
import { Search } from 'lucide-react';

export function AuditLogViewer() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action_type: '',
        entity_type: '',
        limit: 50,
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        setLoading(true);
        const result = await getAdminAuditLog(filters);
        if (result.success) {
            setLogs(result.data || []);
        }
        setLoading(false);
    }

    function handleSearch() {
        fetchLogs();
    }

    if (loading) {
        return <div>Loading audit log...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Audit Log</CardTitle>
                <CardDescription>Track all administrative actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Action Type</Label>
                        <Select
                            value={filters.action_type}
                            onValueChange={(value) => setFilters({ ...filters, action_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All actions</SelectItem>
                                <SelectItem value="approve_advertisement">Approve Ad</SelectItem>
                                <SelectItem value="reject_advertisement">Reject Ad</SelectItem>
                                <SelectItem value="publish_content">Publish Content</SelectItem>
                                <SelectItem value="assign_role">Assign Role</SelectItem>
                                <SelectItem value="revoke_role">Revoke Role</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Entity Type</Label>
                        <Select
                            value={filters.entity_type}
                            onValueChange={(value) => setFilters({ ...filters, entity_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All entities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All entities</SelectItem>
                                <SelectItem value="advertisement">Advertisement</SelectItem>
                                <SelectItem value="content_page">Content Page</SelectItem>
                                <SelectItem value="template">Template</SelectItem>
                                <SelectItem value="admin_role">Admin Role</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Limit</Label>
                        <Select
                            value={filters.limit.toString()}
                            onValueChange={(value) => setFilters({ ...filters, limit: parseInt(value) })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="200">200</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button onClick={handleSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                </Button>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No audit logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm">
                                            {new Date(log.performed_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {log.user_id?.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {log.action_type}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-sm">{log.entity_type}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                            {JSON.stringify(log.action_details)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
