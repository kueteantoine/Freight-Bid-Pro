'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TierLevel = 'bronze' | 'silver' | 'gold';

interface FeaturedBadgeProps {
    tierSlug: TierLevel;
    className?: string;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const tierConfig = {
    bronze: {
        label: 'Featured',
        icon: Star,
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        iconColor: 'text-amber-600',
    },
    silver: {
        label: 'Premium Partner',
        icon: Award,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        iconColor: 'text-slate-500',
    },
    gold: {
        label: 'Elite Partner',
        icon: Trophy,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        iconColor: 'text-yellow-600',
    },
};

export function FeaturedBadge({
    tierSlug,
    className,
    showIcon = true,
    size = 'md',
}: FeaturedBadgeProps) {
    const config = tierConfig[tierSlug] || tierConfig.bronze;
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'text-[9px] px-1.5 py-0.5 gap-1',
        md: 'text-[10px] px-2 py-1 gap-1.5',
        lg: 'text-[12px] px-3 py-1.5 gap-2',
    };

    const iconSizes = {
        sm: 'h-2.5 w-2.5',
        md: 'h-3 w-3',
        lg: 'h-4 w-4',
    };

    return (
        <Badge
            variant="outline"
            className={cn(
                'font-black uppercase tracking-wider shadow-sm flex items-center',
                config.color,
                sizeClasses[size],
                className
            )}
        >
            {showIcon && <Icon className={cn(iconSizes[size], config.iconColor)} />}
            {config.label}
        </Badge>
    );
}

