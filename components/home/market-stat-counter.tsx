'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface MarketStatCounterProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  icon?: React.ReactNode;
}

/**
 * Market Stat Counter Component
 *
 * Animated counter for displaying Australian energy market statistics
 * - Animates from 0 to target value
 * - Supports currency, percentages, and large numbers
 * - Australian number formatting (commas)
 */
export function MarketStatCounter({
  label,
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2000,
  icon,
}: MarketStatCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-AU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-all hover:shadow-md">
      {icon && (
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          {icon}
        </div>
      )}

      <div className="flex items-baseline gap-1">
        {prefix && <span className="text-xl font-semibold">{prefix}</span>}
        <span className="text-4xl font-bold tabular-nums">
          {formatNumber(count)}
        </span>
        {suffix && <span className="text-xl font-semibold">{suffix}</span>}
      </div>

      <p className="text-center text-sm text-muted-foreground">{label}</p>

      <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <TrendingUp className="h-3 w-3" />
        <span>Growing</span>
      </div>
    </div>
  );
}
