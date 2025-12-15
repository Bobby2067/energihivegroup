'use client';

import { MapPin, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StateData {
  code: 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';
  name: string;
  rebateAmount: number;
  installations: number;
  averageSavings: number;
}

const statesData: StateData[] = [
  { code: 'NSW', name: 'New South Wales', rebateAmount: 9000, installations: 12500, averageSavings: 185 },
  { code: 'VIC', name: 'Victoria', rebateAmount: 3500, installations: 18200, averageSavings: 210 },
  { code: 'QLD', name: 'Queensland', rebateAmount: 3000, installations: 15800, averageSavings: 195 },
  { code: 'SA', name: 'South Australia', rebateAmount: 2000, installations: 8500, averageSavings: 225 },
  { code: 'WA', name: 'Western Australia', rebateAmount: 0, installations: 6200, averageSavings: 175 },
  { code: 'TAS', name: 'Tasmania', rebateAmount: 0, installations: 1200, averageSavings: 165 },
  { code: 'NT', name: 'Northern Territory', rebateAmount: 0, installations: 450, averageSavings: 155 },
  { code: 'ACT', name: 'Australian Capital Territory', rebateAmount: 3500, installations: 2800, averageSavings: 190 },
];

/**
 * Australian Energy Map Component
 *
 * Interactive map showing battery adoption across Australian states
 * - State-specific rebate information
 * - Installation numbers
 * - Average savings by state
 * - Highlights rebate-eligible states
 */
export function AustralianEnergyMap() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Battery Energy Storage Across Australia
        </CardTitle>
        <CardDescription>
          State-by-state rebates and adoption rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {statesData.map((state) => (
            <div
              key={state.code}
              className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary"
            >
              {/* State Header */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{state.code}</h3>
                  <p className="text-xs text-muted-foreground">{state.name}</p>
                </div>
                {state.rebateAmount > 0 && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    Rebate
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-2 text-sm">
                {/* Rebate Amount */}
                {state.rebateAmount > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rebate</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${state.rebateAmount.toLocaleString('en-AU')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rebate</span>
                    <span className="text-xs text-muted-foreground">Not available</span>
                  </div>
                )}

                {/* Installations */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Systems</span>
                  <span className="font-semibold">
                    {state.installations.toLocaleString('en-AU')}
                  </span>
                </div>

                {/* Average Savings */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg. Savings</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    ${state.averageSavings}/mo
                  </span>
                </div>
              </div>

              {/* Hover Indicator */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-green-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg bg-muted/50 p-4 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              Total installations: <span className="font-semibold">
                {statesData.reduce((sum, state) => sum + state.installations, 0).toLocaleString('en-AU')}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
              Rebate
            </Badge>
            <span className="text-muted-foreground">
              = Government rebate available
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
