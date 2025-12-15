'use client';

/**
 * Energy Flow Diagram Component
 *
 * Displays real-time energy flow visualization showing:
 * - Solar generation
 * - Battery charge/discharge
 * - Grid import/export
 * - Home consumption
 */

import React from 'react';
import { ZapIcon, BatteryChargingIcon, HomeIcon, GridIcon } from 'lucide-react';

interface EnergyFlowDiagramProps {
  systemId: string | null;
}

export function EnergyFlowDiagram({ systemId }: EnergyFlowDiagramProps) {
  // TODO: Implement real-time energy flow visualization
  // This is a placeholder component

  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <ZapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Energy Flow Diagram</p>
        <p className="text-xs mt-2">Coming soon...</p>
      </div>
    </div>
  );
}
