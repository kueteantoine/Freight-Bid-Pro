"use client";

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatTimeRemaining, cn } from '@/lib/utils';

interface CountdownTimerProps {
  expiryDate: string;
}

export function CountdownTimer({ expiryDate }: CountdownTimerProps) {
  const calculateTimeLeft = () => {
    const difference = +new Date(expiryDate) - +new Date();
    return difference > 0 ? difference : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  const isExpiring = timeLeft > 0 && timeLeft < 3600000; // Less than 1 hour
  const isExpired = timeLeft === 0;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs transition-colors",
      isExpired ? "bg-rose-100 text-rose-700" :
      isExpiring ? "bg-amber-100 text-amber-700 animate-pulse" :
      "bg-slate-100 text-slate-600"
    )}>
      <Clock className="h-3 w-3" />
      {isExpired ? "Bidding Closed" : formatTimeRemaining(timeLeft)}
    </div>
  );
}