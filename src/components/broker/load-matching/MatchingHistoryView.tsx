'use client';

import { useEffect, useState } from 'react';
import { History, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { getBrokerMatches, type LoadMatch } from '@/actions/broker-load-matching-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MatchingHistoryViewProps {
    brokerId: string;
}

export default function MatchingHistoryView({ brokerId }: MatchingHistoryViewProps) {
    const [matches, setMatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMatches();
    }, [brokerId]);

    async function loadMatches() {
        setIsLoading(true);
        try {
            const result = await getBrokerMatches(brokerId);
            if (result.data) {
                setMatches(result.data);
            }
        } catch (error) {
            console.error('Error loading matches:', error);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const stats = {
        total: matches.length,
        confirmed: matches.filter(m => m.match_status === 'confirmed').length,
        completed: matches.filter(m => m.match_status === 'completed').length,
        avgScore: matches.length > 0
            ? matches.reduce((sum, m) => sum + (m.match_score || 0), 0) / matches.length
            : 0,
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Total Matches</div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Confirmed</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Completed</div>
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Avg Match Score</div>
                        <div className="text-2xl font-bold">{stats.avgScore.toFixed(0)}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Matches List */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <History className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Match History</h2>
                    </div>

                    {matches.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No matches yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {matches.map((match) => (
                                <MatchHistoryCard key={match.id} match={match} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function MatchHistoryCard({ match }: { match: any }) {
    const statusConfig = {
        confirmed: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Confirmed' },
        completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
        cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' },
        rejected: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Rejected' },
    };

    const config = statusConfig[match.match_status as keyof typeof statusConfig] || statusConfig.confirmed;
    const Icon = config.icon;

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">
                        {match.shipments?.shipment_number || 'Unknown Shipment'}
                    </div>
                    <div className="text-xs text-gray-600">
                        {match.shipments?.pickup_location} → {match.shipments?.delivery_location}
                    </div>
                </div>
                <Badge variant="outline" className={`${config.bg} ${config.color} border-0`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                <div>
                    <div className="text-gray-500">Match Score</div>
                    <div className="font-semibold">{match.match_score?.toFixed(0) || 0}%</div>
                </div>
                <div>
                    <div className="text-gray-500">Type</div>
                    <div className="font-semibold capitalize">{match.match_type.replace('_', ' ')}</div>
                </div>
                <div>
                    <div className="text-gray-500">Date</div>
                    <div className="font-semibold">
                        {new Date(match.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
