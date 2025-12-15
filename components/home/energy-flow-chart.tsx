'use client';

import { ArrowRight, Zap, Home, Battery, Sun } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Energy Flow Chart Component
 *
 * Displays an animated visualization of energy flow in a typical
 * Australian home battery system: Solar → Battery → Home → Grid
 */
export function EnergyFlowChart() {
  return (
    <Card className="w-full overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
      <CardContent className="p-8">
        <div className="flex items-center justify-between gap-4">
          {/* Solar Panel */}
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-yellow-500 p-4 shadow-lg animate-pulse">
              <Sun className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium">Solar</span>
            <span className="text-xs text-muted-foreground">5.2 kW</span>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />

          {/* Battery */}
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-green-500 p-4 shadow-lg">
              <Battery className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium">Battery</span>
            <span className="text-xs text-muted-foreground">85% (9.6 kWh)</span>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />

          {/* Home */}
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-blue-500 p-4 shadow-lg">
              <Home className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium">Home</span>
            <span className="text-xs text-muted-foreground">2.1 kW</span>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />

          {/* Grid */}
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-purple-500 p-4 shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium">Grid</span>
            <span className="text-xs text-muted-foreground">Export 1.8 kW</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Real-time energy flow visualization for Australian homes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
