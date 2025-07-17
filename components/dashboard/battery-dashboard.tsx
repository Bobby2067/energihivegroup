"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend,
  ReferenceLine
} from "recharts";
import { 
  BatteryChargingIcon, 
  BatteryIcon, 
  BatteryLowIcon, 
  BatteryMediumIcon, 
  BatteryFullIcon, 
  ZapIcon, 
  HomeIcon, 
  CloudIcon, 
  ThermometerIcon, 
  ActivityIcon, 
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RefreshCwIcon,
  ClockIcon,
  DollarSignIcon,
  BarChart3Icon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { 
  getBatteryLevelClass, 
  getBatteryLevelColor, 
  formatEnergy, 
  formatPowerFlow,
  formatAUD,
  formatDateTime,
  formatRelativeTime,
  getCurrentTOU,
  calculateEnergyCost,
  isDuringPeakHours,
  isDuringShoulderHours,
  isDuringOffPeakHours
} from "@/lib/utils";

import { queryKeys } from "@/components/providers/query-provider";

// Battery Dashboard Props
interface BatteryDashboardProps {
  systemId: string;
  className?: string;
  compact?: boolean;
}

// Battery Status types
interface BatteryStatus {
  serialNumber: string;
  lastUpdated: string;
  batteryLevel: number;
  batteryPower: number;
  gridPower: number;
  solarPower: number;
  loadPower: number;
  systemMode: string;
  isCharging: boolean;
  isDischarging: boolean;
  isExporting: boolean;
  isImporting: boolean;
  systemStatus: string;
  batteryTemperature?: number;
  inverterTemperature?: number;
  gridVoltage?: number;
  gridFrequency?: number;
  alerts: BatteryAlert[];
  isSimulated: boolean;
  rawData?: Record<string, any>;
  apiError?: string;
  cellBalancing?: boolean;
  batteryModules?: number;
  moduleTemperatures?: number[];
  dcLinkVoltage?: number;
  cellVoltageDeviation?: number;
  batteryType?: string;
}

interface BatteryAlert {
  code: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  isActive: boolean;
}

interface BatteryHistoryEntry {
  timestamp: string;
  batteryLevel: number;
  batteryPower?: number;
  gridPower?: number;
  solarPower?: number;
  loadPower?: number;
  energyCharged: number;
  energyDischarged: number;
  solarGeneration: number;
  gridImport: number;
  gridExport: number;
  homeConsumption: number;
  isSimulated: boolean;
  cellBalancingDuration?: number;
  minCellVoltage?: number;
  maxCellVoltage?: number;
  cycleCount?: number;
  australianMarket?: {
    timeOfUseCategory: 'peak' | 'shoulder' | 'off-peak';
    currentRate: number;
    feedInRate: number;
    selfConsumptionSavings: number;
    batteryDischargeSavings: number;
    exportIncome: number;
    importCost: number;
    cellBalancingImpact: number;
    netSavings: number;
  };
}

// Australian electricity rates (cents per kWh)
const AUSTRALIAN_ELECTRICITY_RATES = {
  peak: 40, // 40c/kWh during peak (2pm-8pm)
  shoulder: 25, // 25c/kWh during shoulder (7am-2pm, 8pm-10pm)
  offPeak: 15, // 15c/kWh during off-peak (10pm-7am)
  feedIn: 5, // 5c/kWh feed-in tariff
};

// Main Battery Dashboard Component
export function BatteryDashboard({ systemId, className, compact = false }: BatteryDashboardProps) {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds by default
  const [showCellDetails, setShowCellDetails] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState<'day' | 'week' | 'month'>('day');
  
  // Fetch real-time battery status
  const { 
    data: batteryStatus, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus,
    dataUpdatedAt: statusUpdatedAt
  } = useQuery({
    queryKey: queryKeys.batteries.monitoring(systemId),
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: true,
  });
  
  // Fetch historical battery data
  const { 
    data: batteryHistory, 
    isLoading: historyLoading, 
    error: historyError 
  } = useQuery({
    queryKey: [...queryKeys.batteries.monitoring(systemId), 'history', historyPeriod],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
  
  // Handle manual refresh
  const handleRefresh = () => {
    refetchStatus();
  };
  
  // Get current time-of-use period
  const currentTOU = getCurrentTOU();
  
  // Get current electricity rate
  const getCurrentRate = () => {
    if (isDuringPeakHours(new Date())) return AUSTRALIAN_ELECTRICITY_RATES.peak;
    if (isDuringShoulderHours(new Date())) return AUSTRALIAN_ELECTRICITY_RATES.shoulder;
    return AUSTRALIAN_ELECTRICITY_RATES.offPeak;
  };
  
  // Calculate estimated savings
  const calculateSavings = (status: BatteryStatus | undefined) => {
    if (!status) return { daily: 0, monthly: 0, annual: 0 };
    
    // Simple estimation based on battery usage
    const currentRate = getCurrentRate();
    const dailyBatteryUsage = 8; // kWh, average daily battery discharge
    const dailySavings = (dailyBatteryUsage * currentRate) / 100; // Convert cents to dollars
    
    return {
      daily: dailySavings,
      monthly: dailySavings * 30,
      annual: dailySavings * 365
    };
  };
  
  const savings = calculateSavings(batteryStatus);
  
  // If loading, show skeleton
  if (statusLoading && !batteryStatus) {
    return <BatteryDashboardSkeleton compact={compact} />;
  }
  
  // If error, show error message
  if (statusError) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error loading battery data</AlertTitle>
        <AlertDescription>
          {statusError instanceof Error ? statusError.message : 'Failed to load battery status'}
        </AlertDescription>
      </Alert>
    );
  }
  
  // If no data, show message
  if (!batteryStatus) {
    return (
      <Alert>
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>No battery data available</AlertTitle>
        <AlertDescription>
          No data is available for this battery system. Please check your connection or system ID.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Determine battery icon based on level and charging state
  const getBatteryIcon = () => {
    if (batteryStatus.isCharging) return <BatteryChargingIcon className="h-6 w-6 text-[hsl(var(--energy-primary))] animate-charging" />;
    
    if (batteryStatus.batteryLevel <= 20) return <BatteryLowIcon className="h-6 w-6 text-[hsl(var(--battery-critical))]" />;
    if (batteryStatus.batteryLevel <= 50) return <BatteryMediumIcon className="h-6 w-6 text-[hsl(var(--battery-medium))]" />;
    if (batteryStatus.batteryLevel <= 90) return <BatteryIcon className="h-6 w-6 text-[hsl(var(--battery-high))]" />;
    return <BatteryFullIcon className="h-6 w-6 text-[hsl(var(--battery-full))]" />;
  };
  
  // Get battery level class
  const batteryLevelClass = getBatteryLevelClass(batteryStatus.batteryLevel);
  
  // Get time-of-use badge
  const getTOUBadge = () => {
    switch (currentTOU) {
      case 'peak':
        return <Badge variant="destructive">Peak Rate: {AUSTRALIAN_ELECTRICITY_RATES.peak}¢/kWh</Badge>;
      case 'shoulder':
        return <Badge variant="warning">Shoulder Rate: {AUSTRALIAN_ELECTRICITY_RATES.shoulder}¢/kWh</Badge>;
      case 'off-peak':
        return <Badge variant="success">Off-Peak Rate: {AUSTRALIAN_ELECTRICITY_RATES.offPeak}¢/kWh</Badge>;
    }
  };
  
  // Format for historical data chart
  const formatHistoryData = (data: BatteryHistoryEntry[] | undefined) => {
    if (!data) return [];
    
    return data.map(entry => ({
      time: new Date(entry.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      batteryLevel: entry.batteryLevel,
      solarPower: entry.solarPower || 0,
      gridPower: entry.gridPower || 0,
      loadPower: entry.loadPower || 0,
      batteryPower: entry.batteryPower || 0,
      solarGeneration: entry.solarGeneration,
      gridImport: entry.gridImport,
      gridExport: entry.gridExport,
      homeConsumption: entry.homeConsumption,
      savings: entry.australianMarket?.netSavings || 0,
      touCategory: entry.australianMarket?.timeOfUseCategory || 'off-peak',
    }));
  };
  
  const historyData = formatHistoryData(batteryHistory);
  
  // Determine if we should show cell-level information (LG RESU specific)
  const showLgResuDetails = batteryStatus.batteryType?.includes('RESU') || 
                           batteryStatus.moduleTemperatures?.length > 0 || 
                           batteryStatus.cellVoltageDeviation !== undefined;
  
  // Compact view for smaller spaces
  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {getBatteryIcon()}
            <div className="ml-2">
              <h3 className="text-sm font-medium">{batteryStatus.batteryType || 'Battery'}</h3>
              <p className="text-xs text-muted-foreground">
                {batteryStatus.isCharging ? 'Charging' : batteryStatus.isDischarging ? 'Discharging' : 'Idle'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{batteryStatus.batteryLevel}%</p>
            <p className="text-xs text-muted-foreground">
              {formatPowerFlow(batteryStatus.batteryPower)}
            </p>
          </div>
        </div>
        
        <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div 
            className={`absolute left-0 top-0 h-full ${batteryLevelClass}`}
            style={{ width: `${batteryStatus.batteryLevel}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${batteryStatus.batteryLevel}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
          <div>
            <p className="font-medium">Solar</p>
            <p>{formatEnergy(batteryStatus.solarPower, 'w')}</p>
          </div>
          <div>
            <p className="font-medium">Grid</p>
            <p>{formatEnergy(Math.abs(batteryStatus.gridPower), 'w')}</p>
          </div>
          <div>
            <p className="font-medium">Home</p>
            <p>{formatEnergy(batteryStatus.loadPower, 'w')}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Full dashboard view
  return (
    <div className={className}>
      {/* Main Status Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Battery Level Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Battery Status</CardTitle>
              {getTOUBadge()}
            </div>
            <CardDescription>
              Last updated: {formatRelativeTime(batteryStatus.lastUpdated)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center mb-4">
              <div className="relative mb-2">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ 
                    scale: batteryStatus.isCharging || batteryStatus.isDischarging ? [1, 1.05, 1] : 1
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                  className="relative"
                >
                  {getBatteryIcon()}
                  <span className="absolute -top-1 -right-1">
                    {batteryStatus.isCharging && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ZapIcon className="h-3 w-3 text-[hsl(var(--energy-success))]" />
                      </motion.div>
                    )}
                  </span>
                </motion.div>
                
                <h2 className="text-3xl font-bold mt-2">{batteryStatus.batteryLevel}%</h2>
                <p className="text-sm text-muted-foreground">
                  {batteryStatus.isCharging 
                    ? `Charging at ${formatEnergy(Math.abs(batteryStatus.batteryPower), 'w')}` 
                    : batteryStatus.isDischarging 
                      ? `Discharging at ${formatEnergy(Math.abs(batteryStatus.batteryPower), 'w')}` 
                      : 'Idle'}
                </p>
              </div>
              
              <div className="w-full mt-4">
                <div className="relative h-6 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className={`absolute left-0 top-0 h-full ${batteryLevelClass}`}
                    style={{ width: `${batteryStatus.batteryLevel}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${batteryStatus.batteryLevel}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                
                <div className="flex justify-between text-xs mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-6">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">System Type</p>
                  <p className="font-medium">{batteryStatus.batteryType || 'Unknown'}</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">System Mode</p>
                  <p className="font-medium">{batteryStatus.systemMode}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              leftIcon={<RefreshCwIcon className="h-4 w-4" />}
            >
              Refresh
            </Button>
          </CardFooter>
        </Card>
        
        {/* Energy Flow Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Energy Flow</CardTitle>
            <CardDescription>Current power distribution in your system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[200px] flex items-center justify-center">
              {/* Energy Flow Diagram */}
              <div className="grid grid-cols-3 w-full h-full">
                {/* Solar */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className={`rounded-full p-3 ${batteryStatus.solarPower > 0 ? 'bg-[hsl(var(--solar-active)/0.2)] animate-solar' : 'bg-[hsl(var(--solar-inactive)/0.1)]'}`}>
                    <CloudIcon className={`h-8 w-8 ${batteryStatus.solarPower > 0 ? 'text-[hsl(var(--solar-active))]' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="mt-2 font-medium">Solar</p>
                  <p className="text-sm">{formatEnergy(batteryStatus.solarPower, 'w')}</p>
                  
                  {/* Solar to Battery Flow */}
                  {batteryStatus.solarPower > 0 && batteryStatus.isCharging && (
                    <div className="absolute top-1/2 left-[25%] w-[25%] h-1 bg-[hsl(var(--solar-active)/0.3)] overflow-hidden">
                      <motion.div 
                        className="absolute top-0 left-0 h-full w-6 bg-[hsl(var(--solar-active))]"
                        animate={{ x: ['0%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                  
                  {/* Solar to Grid Flow */}
                  {batteryStatus.solarPower > 0 && batteryStatus.isExporting && (
                    <div className="absolute top-1/3 left-[25%] w-[50%] h-1 bg-[hsl(var(--solar-active)/0.3)] overflow-hidden">
                      <motion.div 
                        className="absolute top-0 left-0 h-full w-6 bg-[hsl(var(--solar-active))]"
                        animate={{ x: ['0%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Battery */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className={`rounded-full p-3 ${
                    batteryStatus.isCharging 
                      ? 'bg-[hsl(var(--energy-success)/0.2)] animate-charging' 
                      : batteryStatus.isDischarging 
                        ? 'bg-[hsl(var(--energy-accent)/0.2)] animate-discharging' 
                        : 'bg-muted'
                  }`}>
                    {getBatteryIcon()}
                  </div>
                  <p className="mt-2 font-medium">Battery</p>
                  <p className="text-sm">{batteryStatus.batteryLevel}%</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPowerFlow(batteryStatus.batteryPower)}
                  </p>
                  
                  {/* Battery to Home Flow */}
                  {batteryStatus.isDischarging && (
                    <div className="absolute top-1/2 left-[42%] w-[25%] h-1 bg-[hsl(var(--energy-accent)/0.3)] overflow-hidden">
                      <motion.div 
                        className="absolute top-0 left-0 h-full w-6 bg-[hsl(var(--energy-accent))]"
                        animate={{ x: ['0%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Home */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full p-3 bg-muted">
                    <HomeIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="mt-2 font-medium">Home</p>
                  <p className="text-sm">{formatEnergy(batteryStatus.loadPower, 'w')}</p>
                </div>
              </div>
              
              {/* Grid Connection */}
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center text-center">
                <div className="grid grid-cols-3 w-full">
                  <div></div>
                  <div>
                    <div className={`rounded-full p-2 mx-auto ${
                      batteryStatus.isImporting 
                        ? 'bg-[hsl(var(--grid-import)/0.2)]' 
                        : batteryStatus.isExporting 
                          ? 'bg-[hsl(var(--grid-export)/0.2)]' 
                          : 'bg-muted'
                    }`}>
                      <ZapIcon className={`h-6 w-6 ${
                        batteryStatus.isImporting 
                          ? 'text-[hsl(var(--grid-import))]' 
                          : batteryStatus.isExporting 
                            ? 'text-[hsl(var(--grid-export))]' 
                            : 'text-muted-foreground'
                      }`} />
                    </div>
                    <p className="mt-1 font-medium">Grid</p>
                    <p className="text-sm">{formatEnergy(Math.abs(batteryStatus.gridPower), 'w')}</p>
                    <p className="text-xs text-muted-foreground">
                      {batteryStatus.isImporting ? 'Importing' : batteryStatus.isExporting ? 'Exporting' : 'No flow'}
                    </p>
                  </div>
                  <div></div>
                </div>
                
                {/* Grid to Battery Flow */}
                {batteryStatus.isImporting && batteryStatus.isCharging && (
                  <div className="absolute top-1/2 left-[42%] w-[16%] h-1 bg-[hsl(var(--grid-import)/0.3)] overflow-hidden">
                    <motion.div 
                      className="absolute top-0 left-0 h-full w-6 bg-[hsl(var(--grid-import))]"
                      animate={{ x: ['0%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}
                
                {/* Grid to Home Flow */}
                {batteryStatus.isImporting && batteryStatus.loadPower > 0 && (
                  <div className="absolute top-1/3 left-[58%] w-[16%] h-1 bg-[hsl(var(--grid-import)/0.3)] overflow-hidden">
                    <motion.div 
                      className="absolute top-0 left-0 h-full w-6 bg-[hsl(var(--grid-import))]"
                      animate={{ x: ['0%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Australian Energy Market Info */}
            <div className="mt-4 p-3 rounded-lg bg-[hsl(var(--aus-green)/0.1)] border border-[hsl(var(--aus-green)/0.2)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-[hsl(var(--aus-green))] mr-2" />
                  <span className="text-sm font-medium">Current TOU Period:</span>
                </div>
                {getTOUBadge()}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Today's Savings</p>
                  <p className="text-sm font-medium">{formatAUD(savings.daily)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Monthly Est.</p>
                  <p className="text-sm font-medium">{formatAUD(savings.monthly)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Feed-in Rate</p>
                  <p className="text-sm font-medium">{AUSTRALIAN_ELECTRICITY_RATES.feedIn}¢/kWh</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Export Today</p>
                  <p className="text-sm font-medium">
                    {batteryHistory && batteryHistory.length > 0 
                      ? formatEnergy(batteryHistory.reduce((sum, entry) => sum + entry.gridExport, 0), 'kwh')
                      : '0 kWh'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Battery Details and Charts */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Energy History</TabsTrigger>
          <TabsTrigger value="details">Battery Details</TabsTrigger>
          <TabsTrigger value="savings">Savings Analysis</TabsTrigger>
        </TabsList>
        
        {/* Energy History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Energy Flow History</h3>
            <div className="flex space-x-2">
              <Button 
                variant={historyPeriod === 'day' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setHistoryPeriod('day')}
              >
                Day
              </Button>
              <Button 
                variant={historyPeriod === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setHistoryPeriod('week')}
              >
                Week
              </Button>
              <Button 
                variant={historyPeriod === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setHistoryPeriod('month')}
              >
                Month
              </Button>
            </div>
          </div>
          
          {historyLoading ? (
            <div className="h-[300px] w-full bg-muted rounded-lg animate-pulse" />
          ) : historyData.length === 0 ? (
            <div className="h-[300px] w-full flex items-center justify-center border rounded-lg">
              <p className="text-muted-foreground">No historical data available</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      switch (name) {
                        case 'solarPower': return [`${value} W`, 'Solar'];
                        case 'gridPower': return [`${value} W`, 'Grid'];
                        case 'batteryPower': return [`${value} W`, 'Battery'];
                        case 'loadPower': return [`${value} W`, 'Home'];
                        default: return [value, name];
                      }
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="solarPower" 
                    stackId="1"
                    stroke="hsl(var(--solar-active))" 
                    fill="hsl(var(--solar-active)/0.5)" 
                    name="Solar"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="batteryPower" 
                    stackId="2"
                    stroke="hsl(var(--energy-primary))" 
                    fill="hsl(var(--energy-primary)/0.5)" 
                    name="Battery"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gridPower" 
                    stackId="3"
                    stroke="hsl(var(--energy-secondary))" 
                    fill="hsl(var(--energy-secondary)/0.5)" 
                    name="Grid"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="loadPower" 
                    stackId="4"
                    stroke="hsl(var(--energy-accent))" 
                    fill="hsl(var(--energy-accent)/0.5)" 
                    name="Home"
                  />
                  
                  {/* Reference lines for TOU periods */}
                  {historyPeriod === 'day' && (
                    <>
                      <ReferenceLine x="14:00" stroke="hsl(var(--energy-danger)/0.7)" label="Peak Start" />
                      <ReferenceLine x="20:00" stroke="hsl(var(--energy-warning)/0.7)" label="Shoulder Start" />
                      <ReferenceLine x="22:00" stroke="hsl(var(--energy-success)/0.7)" label="Off-Peak Start" />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Battery Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historyData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <Line 
                        type="monotone" 
                        dataKey="batteryLevel" 
                        stroke="hsl(var(--energy-primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Battery Level']}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Solar Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historyData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <Line 
                        type="monotone" 
                        dataKey="solarGeneration" 
                        stroke="hsl(var(--solar-active))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} kWh`, 'Solar Generation']}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Grid Exchange</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historyData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <Line 
                        type="monotone" 
                        dataKey="gridImport" 
                        stroke="hsl(var(--grid-import))" 
                        strokeWidth={2}
                        dot={false}
                        name="Import"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="gridExport" 
                        stroke="hsl(var(--grid-export))" 
                        strokeWidth={2}
                        dot={false}
                        name="Export"
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'gridImport') return [`${value} kWh`, 'Grid Import'];
                          if (name === 'gridExport') return [`${value} kWh`, 'Grid Export'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Home Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historyData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <Line 
                        type="monotone" 
                        dataKey="homeConsumption" 
                        stroke="hsl(var(--energy-accent))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} kWh`, 'Home Consumption']}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Battery Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Technical details about your battery system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{batteryStatus.batteryType || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Serial Number</p>
                      <p className="font-medium">{batteryStatus.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">System Status</p>
                      <p className="font-medium">{batteryStatus.systemStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">System Mode</p>
                      <p className="font-medium">{batteryStatus.systemMode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modules</p>
                      <p className="font-medium">{batteryStatus.batteryModules || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cell Balancing</p>
                      <p className="font-medium">{batteryStatus.cellBalancing ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Temperature Readings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <ThermometerIcon className="h-4 w-4 text-muted-foreground mr-2" />
                        <div>
                          <p className="text-sm">Battery</p>
                          <p className="font-medium">
                            {batteryStatus.batteryTemperature !== undefined 
                              ? `${batteryStatus.batteryTemperature}°C` 
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <ThermometerIcon className="h-4 w-4 text-muted-foreground mr-2" />
                        <div>
                          <p className="text-sm">Inverter</p>
                          <p className="font-medium">
                            {batteryStatus.inverterTemperature !== undefined 
                              ? `${batteryStatus.inverterTemperature}°C` 
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Electrical Readings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Grid Voltage</p>
                        <p className="font-medium">
                          {batteryStatus.gridVoltage !== undefined 
                            ? `${batteryStatus.gridVoltage}V` 
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Grid Frequency</p>
                        <p className="font-medium">
                          {batteryStatus.gridFrequency !== undefined 
                            ? `${batteryStatus.gridFrequency}Hz` 
                            : 'N/A'
                          }
                        </p>
                      </div>
                      {batteryStatus.dcLinkVoltage !== undefined && (
                        <div>
                          <p className="text-sm text-muted-foreground">DC Link Voltage</p>
                          <p className="font-medium">{batteryStatus.dcLinkVoltage}V</p>
                        </div>
                      )}
                      {batteryStatus.cellVoltageDeviation !== undefined && (
                        <div>
                          <p className="text-sm text-muted-foreground">Cell Deviation</p>
                          <p className="font-medium">{batteryStatus.cellVoltageDeviation}V</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Diagnostics and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Alerts Section */}
                  {batteryStatus.alerts.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Active Alerts</h4>
                      <div className="space-y-2">
                        {batteryStatus.alerts.map((alert, index) => (
                          <Alert 
                            key={index} 
                            variant={
                              alert.severity === 'critical' ? 'destructive' : 
                              alert.severity === 'error' ? 'destructive' : 
                              alert.severity === 'warning' ? 'warning' : 
                              'default'
                            }
                          >
                            <AlertTriangleIcon className="h-4 w-4" />
                            <AlertTitle>{alert.code}: {alert.message}</AlertTitle>
                            <AlertDescription>
                              Reported: {formatRelativeTime(alert.timestamp)}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[hsl(var(--energy-success)/0.1)] text-[hsl(var(--energy-success))] p-3 rounded-lg">
                      <div className="flex items-center">
                        <ActivityIcon className="h-4 w-4 mr-2" />
                        <p className="font-medium">System operating normally</p>
                      </div>
                      <p className="text-sm mt-1">No active alerts or warnings</p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* LG RESU Specific Section */}
                  {showLgResuDetails && (
                    <div>
                      <Collapsible open={showCellDetails} onOpenChange={setShowCellDetails}>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between cursor-pointer">
                            <h4 className="text-sm font-medium">LG RESU Cell Details</h4>
                            <Button variant="ghost" size="sm">
                              {showCellDetails ? (
                                <ChevronUpIcon className="h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          {batteryStatus.moduleTemperatures && batteryStatus.moduleTemperatures.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-xs font-medium mb-2">Module Temperatures</h5>
                              <div className="grid grid-cols-3 gap-2">
                                {batteryStatus.moduleTemperatures.map((temp, index) => (
                                  <div key={index} className="bg-muted rounded p-2 text-center">
                                    <p className="text-xs text-muted-foreground">Module {index + 1}</p>
                                    <p className="font-medium">{temp}°C</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {batteryStatus.cellVoltageDeviation !== undefined && (
                            <div className="mb-4">
                              <h5 className="text-xs font-medium mb-2">Cell Voltage Deviation</h5>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-[hsl(var(--energy-primary))] h-2 rounded-full"
                                  style={{ 
                                    width: `${Math.min(100, batteryStatus.cellVoltageDeviation * 100)}%` 
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-xs mt-1">
                                <span>0V</span>
                                <span>0.5V</span>
                                <span>1V</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {batteryStatus.cellVoltageDeviation < 0.05 
                                  ? 'Excellent cell balance' 
                                  : batteryStatus.cellVoltageDeviation < 0.1 
                                    ? 'Good cell balance' 
                                    : batteryStatus.cellVoltageDeviation < 0.2 
                                      ? 'Cell balancing recommended' 
                                      : 'Cell balancing required'
                                }
                              </p>
                            </div>
                          )}
                          
                          {batteryStatus.cellBalancing !== undefined && (
                            <div>
                              <h5 className="text-xs font-medium mb-2">Cell Balancing Status</h5>
                              <div className="flex items-center">
                                <div className={`h-2 w-2 rounded-full mr-2 ${
                                  batteryStatus.cellBalancing 
                                    ? 'bg-[hsl(var(--energy-success))]' 
                                    : 'bg-muted'
                                }`} />
                                <p className="text-sm">
                                  {batteryStatus.cellBalancing 
                                    ? 'Cell balancing active' 
                                    : 'Cell balancing inactive'
                                  }
                                </p>
                              </div>
                              {batteryStatus.cellBalancing && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Cell balancing improves battery efficiency and lifespan
                                </p>
                              )}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Australian Market Optimization */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Australian Market Optimization</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-muted-foreground mr-2" />
                          <p className="text-sm">Current TOU Period</p>
                        </div>
                        {getTOUBadge()}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className={`p-2 rounded ${
                          currentTOU === 'off-peak' 
                            ? 'bg-[hsl(var(--energy-success)/0.2)] text-[hsl(var(--energy-success))]' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <p>Off-Peak</p>
                          <p className="font-medium">{AUSTRALIAN_ELECTRICITY_RATES.offPeak}¢/kWh</p>
                        </div>
                        <div className={`p-2 rounded ${
                          currentTOU === 'shoulder' 
                            ? 'bg-[hsl(var(--energy-warning)/0.2)] text-[hsl(var(--energy-warning))]' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <p>Shoulder</p>
                          <p className="font-medium">{AUSTRALIAN_ELECTRICITY_RATES.shoulder}¢/kWh</p>
                        </div>
                        <div className={`p-2 rounded ${
                          currentTOU === 'peak' 
                            ? 'bg-[hsl(var(--energy-danger)/0.2)] text-[hsl(var(--energy-danger))]' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <p>Peak</p>
                          <p className="font-medium">{AUSTRALIAN_ELECTRICITY_RATES.peak}¢/kWh</p>
                        </div>
                      </div>
                      
                      <div className="bg-[hsl(var(--aus-green)/0.1)] p-2 rounded text-sm">
                        <p className="font-medium text-[hsl(var(--aus-green))]">Optimization Recommendation</p>
                        <p className="text-xs mt-1">
                          {currentTOU === 'peak' 
                            ? 'Use battery power to avoid high peak rates' 
                            : currentTOU === 'shoulder' 
                              ? 'Balance between grid and battery usage' 
                              : 'Charge battery from grid at low off-peak rates'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Savings Analysis Tab */}
        <TabsContent value="savings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Financial Benefits</CardTitle>
                <CardDescription>Cost savings from your battery system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={historyData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'savings') return [`$${value.toFixed(2)}`, 'Savings'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="savings" 
                        stroke="hsl(var(--energy-success))" 
                        fill="hsl(var(--energy-success)/0.5)" 
                        name="Savings"
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--energy-danger)/0.7)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                  <div className="p-3 rounded-lg bg-[hsl(var(--energy-primary)/0.1)]">
                    <DollarSignIcon className="h-5 w-5 text-[hsl(var(--energy-primary))] mx-auto mb-1" />
                    <p className="text-sm font-medium">Daily Savings</p>
                    <p className="text-lg font-bold">{formatAUD(savings.daily)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(var(--energy-primary)/0.1)]">
                    <DollarSignIcon className="h-5 w-5 text-[hsl(var(--energy-primary))] mx-auto mb-1" />
                    <p className="text-sm font-medium">Monthly Savings</p>
                    <p className="text-lg font-bold">{formatAUD(savings.monthly)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(var(--energy-primary)/0.1)]">
                    <DollarSignIcon className="h-5 w-5 text-[hsl(var(--energy-primary))] mx-auto mb-1" />
                    <p className="text-sm font-medium">Annual Savings</p>
                    <p className="text-lg font-bold">{formatAUD(savings.annual)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Savings Breakdown</CardTitle>
                <CardDescription>Where your savings come from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm">Peak Rate Avoidance</p>
                      <p className="text-sm font-medium">{formatAUD(savings.daily * 0.6)}</p>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm">Solar Self-Consumption</p>
                      <p className="text-sm font-medium">{formatAUD(savings.daily * 0.3)}</p>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm">Grid Export</p>
                      <p className="text-sm font-medium">{formatAUD(savings.daily * 0.1)}</p>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Australian Market Factors</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <p>Feed-in Tariff</p>
                        <p className="font-medium">{AUSTRALIAN_ELECTRICITY_RATES.feedIn}¢/kWh</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p>Peak Rate Differential</p>
                        <p className="font-medium">
                          {AUSTRALIAN_ELECTRICITY_RATES.peak - AUSTRALIAN_ELECTRICITY_RATES.offPeak}¢/kWh
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p>Shoulder Rate Differential</p>
                        <p className="font-medium">
                          {AUSTRALIAN_ELECTRICITY_RATES.shoulder - AUSTRALIAN_ELECTRICITY_RATES.offPeak}¢/kWh
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[hsl(var(--aus-green)/0.1)] p-3 rounded-lg">
                    <BarChart3Icon className="h-5 w-5 text-[hsl(var(--aus-green))] mb-1" />
                    <h4 className="text-sm font-medium">Optimization Strategy</h4>
                    <p className="text-xs mt-1">
                      {currentTOU === 'peak' 
                        ? 'Currently in peak period. Using battery to avoid high rates.' 
                        : currentTOU === 'shoulder' 
                          ? 'Currently in shoulder period. Balancing grid and battery usage.' 
                          : 'Currently in off-peak period. Charging battery at low rates.'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Australian Energy Market Insights</CardTitle>
              <CardDescription>Optimize your battery usage based on market conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[hsl(var(--energy-primary)/0.1)] p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Time-of-Use Strategy</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--energy-success))] mr-2" />
                      <p className="text-sm">
                        <span className="font-medium">Off-Peak (10pm-7am):</span> Charge battery
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--energy-warning))] mr-2" />
                      <p className="text-sm">
                        <span className="font-medium">Shoulder (7am-2pm, 8pm-10pm):</span> Solar priority
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--energy-danger))] mr-2" />
                      <p className="text-sm">
                        <span className="font-medium">Peak (2pm-8pm):</span> Battery discharge
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[hsl(var(--energy-secondary)/0.1)] p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Grid Export Value</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">Current Feed-in Rate</p>
                      <p className="text-sm font-medium">{AUSTRALIAN_ELECTRICITY_RATES.feedIn}¢/kWh</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">Today's Export</p>
                      <p className="text-sm font-medium">
                        {batteryHistory && batteryHistory.length > 0 
                          ? formatEnergy(batteryHistory.reduce((sum, entry) => sum + entry.gridExport, 0), 'kwh')
                          : '0 kWh'
                        }
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">Export Revenue</p>
                      <p className="text-sm font-medium">
                        {batteryHistory && batteryHistory.length > 0 
                          ? formatAUD((batteryHistory.reduce((sum, entry) => sum + entry.gridExport, 0) * AUSTRALIAN_ELECTRICITY_RATES.feedIn) / 100)
                          : '$0.00'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[hsl(var(--aus-green)/0.1)] p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Australian Rebates</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      Your battery system qualifies for the following Australian government incentives:
                    </p>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--aus-green))] mr-2" />
                      <p className="text-sm">Small-scale Technology Certificates (STCs)</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--aus-green))] mr-2" />
                      <p className="text-sm">Home Battery Scheme (SA residents)</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--aus-green))] mr-2" />
                      <p className="text-sm">Virtual Power Plant participation</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Skeleton loader for battery dashboard
function BatteryDashboardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full lg:col-span-2" />
      </div>
      <div>
        <div className="flex space-x-2 mb-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[150px] w-full" />
      </div>
    </div>
  );
}
