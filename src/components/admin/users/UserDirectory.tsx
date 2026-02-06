"use client";

import React, { useState, useEffect } from "react";
import { getAllUsers, type UserFilters } from "@/actions/admin-user-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Search,
    Eye,
    UserX,
    RefreshCw,
    Download,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserDirectoryProps {
    onViewUser: (userId: string) => void;
    onSuspendUser: (userId: string) => void;
    selectedUsers: string[];
    onSelectUser: (userId: string, selected: boolean) => void;
    onSelectAll: (selected: boolean) => void;
}

export default function UserDirectory({
    onViewUser,
    onSuspendUser,
    selectedUsers,
    onSelectUser,
    onSelectAll,
}: UserDirectoryProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<UserFilters>({
        searchQuery: '',
        roleFilter: null,
        statusFilter: null,
        verificationFilter: null,
        limit: 50,
        offset: 0,
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers(filters);
            setUsers(data.users || []);
            setTotalCount(data.total_count || 0);
        } catch (error: any) {
            toast.error("Failed to load users");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    const handleSearch = (value: string) => {
        setFilters(prev => ({ ...prev, searchQuery: value, offset: 0 }));
    };

    const handleRoleFilter = (value: string) => {
        setFilters(prev => ({
            ...prev,
            roleFilter: value === 'all' ? null : value,
            offset: 0
        }));
    };

    const handleStatusFilter = (value: string) => {
        setFilters(prev => ({
            ...prev,
            statusFilter: value === 'all' ? null : value,
            offset: 0
        }));
    };

    const handleVerificationFilter = (value: string) => {
        setFilters(prev => ({
            ...prev,
            verificationFilter: value === 'all' ? null : value,
            offset: 0
        }));
    };

    const handlePrevPage = () => {
        setFilters(prev => ({
            ...prev,
            offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50))
        }));
    };

    const handleNextPage = () => {
        setFilters(prev => ({
            ...prev,
            offset: (prev.offset || 0) + (prev.limit || 50)
        }));
    };

    const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
    const totalPages = Math.ceil(totalCount / (filters.limit || 50));
    const allSelected = users.length > 0 && users.every(u => selectedUsers.includes(u.id));

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Search & Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email or phone..."
                                className="pl-9"
                                value={filters.searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        {/* Role Filter */}
                        <Select onValueChange={handleRoleFilter} defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="shipper">Shipper</SelectItem>
                                <SelectItem value="carrier">Carrier</SelectItem>
                                <SelectItem value="driver">Driver</SelectItem>
                                <SelectItem value="broker">Broker</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select onValueChange={handleStatusFilter} defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="deactivated">Deactivated</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Verification Filter */}
                        <Select onValueChange={handleVerificationFilter} defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="All Verifications" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Verifications</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="verified">Verified</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchUsers}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        {selectedUsers.length > 0 && (
                            <Badge variant="secondary">
                                {selectedUsers.length} selected
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* User Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                            <p className="text-sm text-muted-foreground">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <p className="text-lg font-semibold">No users found</p>
                            <p className="text-sm text-muted-foreground">
                                Try adjusting your filters
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={allSelected}
                                                onCheckedChange={(checked) => onSelectAll(!!checked)}
                                            />
                                        </TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Roles</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedUsers.includes(user.id)}
                                                    onCheckedChange={(checked) =>
                                                        onSelectUser(user.id, !!checked)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{user.email}</span>
                                                    {user.phone_number && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {user.phone_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles?.map((role: any) => (
                                                        <Badge
                                                            key={role.id}
                                                            variant={role.is_active ? "default" : "secondary"}
                                                            className="text-xs capitalize"
                                                        >
                                                            {role.role_type}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        user.account_status === 'active'
                                                            ? 'default'
                                                            : user.account_status === 'suspended'
                                                                ? 'destructive'
                                                                : 'secondary'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {user.account_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(user.created_at), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onViewUser(user.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {user.account_status !== 'suspended' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onSuspendUser(user.id)}
                                                        >
                                                            <UserX className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-6 py-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Showing {(filters.offset || 0) + 1} to{' '}
                                    {Math.min((filters.offset || 0) + (filters.limit || 50), totalCount)} of{' '}
                                    {totalCount} users
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
