import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface RatingBreakdownProps {
    data: {
        reviews: any[];
        breakdown: {
            timeliness: number;
            communication: number;
            handling: number;
        };
    };
}

export function RatingBreakdown({ data }: RatingBreakdownProps) {
    const categories = [
        { label: "Timeliness", value: data.breakdown.timeliness },
        { label: "Communication", value: data.breakdown.communication },
        { label: "Freight Handling", value: data.breakdown.handling },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Rating Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {categories.map((cat) => (
                        <div key={cat.label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{cat.label}</span>
                                <span className="font-medium">{(cat.value || 0).toFixed(1)} / 5.0</span>
                            </div>
                            <Progress value={(cat.value || 0) * 20} className="h-1.5" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h3 className="font-semibold text-lg px-1">Recent Feedback</h3>
                <div className="space-y-3">
                    {data.reviews.length > 0 ? (
                        data.reviews.map((review) => (
                            <Card key={review.id} className="bg-muted/30 border-none">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={review.reviewer?.avatar_url} />
                                                <AvatarFallback>
                                                    {review.reviewer?.first_name?.[0]}
                                                    {review.reviewer?.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {review.reviewer?.first_name} {review.reviewer?.last_name}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {format(new Date(review.created_at), "MMM d, yyyy")}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                            <Star className="h-2.5 w-2.5 fill-current mr-1" />
                                            {review.rating_overall}.0
                                        </div>
                                    </div>
                                    {review.review_text && (
                                        <p className="text-sm text-muted-foreground italic leading-tight">
                                            "{review.review_text}"
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                            No reviews yet. Complete more trips to get feedback!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
