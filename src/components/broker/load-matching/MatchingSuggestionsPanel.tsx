'use client';

import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, CheckCircle } from 'lucide-react';
import { type AvailableLoad, type MatchingSuggestion, getMatchingSuggestions, acceptMatchSuggestion } from '@/actions/broker-load-matching-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MatchingSuggestionsPanelProps {
    selectedLoad: AvailableLoad | null;
    brokerId: string;
    onMatchCreated: () => void;
}

export default function MatchingSuggestionsPanel({
    selectedLoad,
    brokerId,
    onMatchCreated,
}: MatchingSuggestionsPanelProps) {
    const [suggestions, setSuggestions] = useState<MatchingSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedLoad) {
            loadSuggestions();
        } else {
            setSuggestions([]);
        }
    }, [selectedLoad]);

    async function loadSuggestions() {
        if (!selectedLoad) return;

        setIsLoading(true);
        try {
            const result = await getMatchingSuggestions(selectedLoad.id, brokerId, 70);
            if (result.data) {
                setSuggestions(result.data);
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAcceptSuggestion(suggestion: MatchingSuggestion) {
        if (!selectedLoad) return;

        const result = await acceptMatchSuggestion(
            brokerId,
            selectedLoad.id,
            suggestion.carrier_user_id,
            suggestion.match_score,
            suggestion.score_breakdown
        );

        if (result.error) {
            toast.error(`Failed to create match: ${result.error}`);
        } else {
            toast.success(`Successfully matched to ${suggestion.carrier_name}`);
            onMatchCreated();
        }
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold">AI Suggestions</h2>
                </div>

                {!selectedLoad ? (
                    <div className="text-center py-12 text-gray-500">
                        <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Select a load to see matching suggestions</p>
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
                        ))}
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No suitable carriers found</p>
                        <p className="text-sm mt-1">Try adjusting your carrier network</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                            <SuggestionCard
                                key={suggestion.carrier_user_id}
                                suggestion={suggestion}
                                rank={index + 1}
                                onAccept={() => handleAcceptSuggestion(suggestion)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SuggestionCard({
    suggestion,
    rank,
    onAccept,
}: {
    suggestion: MatchingSuggestion;
    rank: number;
    onAccept: () => void;
}) {
    const scoreColor =
        suggestion.match_score >= 90 ? 'text-green-600' :
            suggestion.match_score >= 75 ? 'text-blue-600' :
                'text-yellow-600';

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">#{rank}</Badge>
                        <span className="font-semibold text-sm">{suggestion.carrier_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${scoreColor}`}>
                            {suggestion.match_score.toFixed(0)}%
                        </span>
                        <span className="text-xs text-gray-500">match score</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                    <div className="text-gray-500">Route</div>
                    <div className="font-medium">{suggestion.score_breakdown.route_compatibility.toFixed(0)}%</div>
                </div>
                <div>
                    <div className="text-gray-500">Capacity</div>
                    <div className="font-medium">{suggestion.score_breakdown.capacity_match.toFixed(0)}%</div>
                </div>
                <div>
                    <div className="text-gray-500">Vehicle</div>
                    <div className="font-medium">{suggestion.score_breakdown.vehicle_match.toFixed(0)}%</div>
                </div>
                <div>
                    <div className="text-gray-500">Reliability</div>
                    <div className="font-medium">{suggestion.score_breakdown.reliability_score.toFixed(0)}%</div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-600">
                    {suggestion.available_weight_kg}kg available
                </div>
                <Button
                    size="sm"
                    onClick={onAccept}
                    className="gap-1"
                >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Accept Match
                </Button>
            </div>
        </div>
    );
}
