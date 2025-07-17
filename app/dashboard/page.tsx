import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { BatteryDashboard } from '@/components/dashboard/battery-dashboard';
import { EnergyFlowDiagram } from '@/components/dashboard/energy-flow-diagram';
import { TimeOfUseChart } from '@/components/dashboard/time-of-use-chart';
import { WeatherForecast } from '@/components/dashboard/weather-forecast';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { RecentPayments } from '@/components/dashboard/recent-payments';
import { SystemAlerts } from '@/components/dashboard/system-alerts';
import { PerformanceMetrics } from '@/components/dashboard/performance-metrics';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { BatterySystemSelector } from '@/components/dashboard/battery-system-selector';
import { SavingsSummary } from '@/components/dashboard/savings-summary';

import {
  BatteryChargingIcon,
  AlertTriangleIcon,
  CalendarIcon,
  BarChart3Icon,
  CloudSunIcon,
  ZapIcon,
  DollarSignIcon,
  RefreshCwIcon,
} from 'lucide-react';

import { getUserBatterySystems } from '@/lib/api/user';
import { getWeatherForecast } from '@/lib/api/weather';
import { getRecentOrders } from '@/lib/api/orders';
import { getRecentPayments } from '@/lib/api/payments';
import { getSystemAlerts } from '@/lib/api/alerts';

// Metadata for the dashboard page
export const metadata: Metadata = {
  title: 'Dashboard | Energi Hive',
  description: 'Monitor your battery systems, energy usage, and savings in real-time.',
};

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

// Main dashboard page component
export default async function DashboardPage() {
  // Fetch user's battery systems
  const batterySystems = await getUserBatterySystems();
  const hasActiveSystems = batterySystems.length > 0;
  
  // Get the first system ID for default view
  const defaultSystemId = hasActiveSystems ? batterySystems[0].id : null;
  
  // Fetch weather data for solar forecasting
  const weatherData = await getWeatherForecast();
  
  // Fetch recent orders and payments
  const recentOrders = await getRecentOrders({ limit: 5 });
  const recentPayments = await getRecentPayments({ limit: 5 });
  
  // Fetch system alerts
  const systemAlerts = await getSystemAlerts();
  const hasAlerts = systemAlerts.length > 0;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader 
        title="Energy Dashboard" 
        description="Monitor your battery systems, energy usage, and savings in real-time."
      />
      
      {!hasActiveSystems ? (
        <NoBatterySystemsView />
      ) : (
        <>
          {/* Battery System Selector */}
          <div className="mb-6">
            <BatterySystemSelector 
              systems={batterySystems} 
              defaultSystemId={defaultSystemId} 
            />
          </div>
          
          {/* Alert Banner (if there are alerts) */}
          {hasAlerts && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>System Alerts</AlertTitle>
              <AlertDescription>
                You have {systemAlerts.length} active {systemAlerts.length === 1 ? 'alert' : 'alerts'} that require attention.
                <Button variant="link" className="p-0 h-auto font-normal" asChild>
                  <Link href="#alerts">View details</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-4 md:w-[600px] w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Suspense fallback={<DashboardSkeleton type="stat" />}>
                  <QuickStatCard 
                    title="Battery Status"
                    value="85%"
                    description="Charging • 2.4 kW"
                    trend="+5% in last hour"
                    icon={<BatteryChargingIcon className="h-5 w-5 text-[hsl(var(--energy-primary))]" />}
                  />
                </Suspense>
                
                <Suspense fallback={<DashboardSkeleton type="stat" />}>
                  <QuickStatCard 
                    title="Today's Generation"
                    value="18.7 kWh"
                    description="Solar Production"
                    trend="+12% vs. yesterday"
                    icon={<ZapIcon className="h-5 w-5 text-[hsl(var(--aus-gold))]" />}
                  />
                </Suspense>
                
                <Suspense fallback={<DashboardSkeleton type="stat" />}>
                  <QuickStatCard 
                    title="Grid Import"
                    value="3.2 kWh"
                    description="Off-peak rate: 15¢/kWh"
                    trend="-8% vs. yesterday"
                    icon={<ZapIcon className="h-5 w-5 text-[hsl(var(--energy-secondary))]" />}
                  />
                </Suspense>
                
                <Suspense fallback={<DashboardSkeleton type="stat" />}>
                  <QuickStatCard 
                    title="Today's Savings"
                    value="$5.87"
                    description="vs. standard tariff"
                    trend="+$1.23 from battery usage"
                    icon={<DollarSignIcon className="h-5 w-5 text-[hsl(var(--energy-success))]" />}
                  />
                </Suspense>
              </div>
              
              {/* Battery Dashboard & Energy Flow */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle>Battery Status</CardTitle>
                    <CardDescription>Real-time monitoring and historical data</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Suspense fallback={<DashboardSkeleton type="chart" height="300px" />}>
                      <BatteryDashboard systemId={defaultSystemId} />
                    </Suspense>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <RefreshCwIcon className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Energy Flow</CardTitle>
                    <CardDescription>Current power flow in your system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardSkeleton type="energy-flow" height="300px" />}>
                      <EnergyFlowDiagram systemId={defaultSystemId} />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<DashboardSkeleton type="actions" />}>
                    <QuickActions systemId={defaultSystemId} />
                  </Suspense>
                </CardContent>
              </Card>
              
              {/* System Alerts */}
              <div id="alerts">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>System Alerts</CardTitle>
                      {hasAlerts && (
                        <Badge variant="destructive">{systemAlerts.length} Active</Badge>
                      )}
                    </div>
                    <CardDescription>Notifications and maintenance recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardSkeleton type="alerts" />}>
                      <SystemAlerts alerts={systemAlerts} systemId={defaultSystemId} />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Battery Performance</CardTitle>
                    <CardDescription>Efficiency and utilization metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardSkeleton type="chart" height="300px" />}>
                      <PerformanceMetrics systemId={defaultSystemId} />
                    </Suspense>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Time of Use Optimization</CardTitle>
                    <CardDescription>Australian TOU tariff performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardSkeleton type="chart" height="300px" />}>
                      <TimeOfUseChart systemId={defaultSystemId} />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Historical Performance</CardTitle>
                  <CardDescription>Daily, weekly, and monthly trends</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily" className="pt-4">
                      <Suspense fallback={<DashboardSkeleton type="chart" height="300px" />}>
                        <PerformanceMetrics systemId={defaultSystemId} period="daily" />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="weekly" className="pt-4">
                      <Suspense fallback={<DashboardSkeleton type="chart" height="300px" />}>
                        <PerformanceMetrics systemId={defaultSystemId} period="weekly" />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="monthly" className="pt-4">
                      <Suspense fallback={<DashboardSkeleton type="chart" height="300px" />}>
                        <PerformanceMetrics systemId={defaultSystemId} period="monthly" />
                      </Suspense>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Savings Summary</CardTitle>
                    <CardDescription>Financial benefits of your battery system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardSkeleton type="chart" height="300px" />}>
                      <SavingsSummary systemId={defaultSystemId} />
                    </Suspense>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>ROI Tracker</CardTitle>
                    <CardDescription>Return on investment progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Initial Investment</p>
                        <p className="text-2xl font-bold">$12,500</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Total Savings to Date</p>
                        <p className="text-2xl font-bold text-[hsl(var(--energy-success))]">$3,287</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Payback Progress</p>
                        <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[hsl(var(--energy-primary))] rounded-full" 
                            style={{ width: '26%' }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">26% • Estimated payback in 3.1 years</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Your latest purchases and subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardSkeleton type="list" />}>
                      <RecentOrders orders={recentOrders} />
                    </Suspense>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/orders">View All Orders</Link>
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Payments</CardTitle>
                    <CardDescription>Your latest transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardSkeleton type="list" />}>
                      <RecentPayments payments={recentPayments} />
                    </Suspense>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/payments">View All Payments</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            {/* Forecast Tab */}
            <TabsContent value="forecast" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weather Forecast</CardTitle>
                    <CardDescription>Local weather conditions for solar prediction</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardSkeleton type="weather" />}>
                      <WeatherForecast data={weatherData} />
                    </Suspense>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Solar Generation Forecast</CardTitle>
                    <CardDescription>Predicted solar output based on weather</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardSkeleton type="chart" height="300px" />}>
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="text-center">
                          <CloudSunIcon className="h-16 w-16 text-[hsl(var(--aus-gold))] mx-auto mb-4" />
                          <h3 className="text-xl font-medium mb-2">Tomorrow's Forecast</h3>
                          <p className="text-3xl font-bold mb-2">21.5 kWh</p>
                          <p className="text-sm text-muted-foreground">Expected solar generation</p>
                          <Separator className="my-4" />
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-sm font-medium">Morning</p>
                              <p className="text-lg">5.2 kWh</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Midday</p>
                              <p className="text-lg">10.8 kWh</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Afternoon</p>
                              <p className="text-lg">5.5 kWh</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Energy Planning</CardTitle>
                  <CardDescription>Optimize your energy usage based on forecasts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted rounded-lg p-4">
                        <CalendarIcon className="h-8 w-8 text-[hsl(var(--energy-primary))] mb-2" />
                        <h3 className="text-lg font-medium mb-1">Best Charging Time</h3>
                        <p className="text-sm text-muted-foreground">Tomorrow, 10:00 AM - 2:00 PM</p>
                        <p className="text-xs mt-2">High solar production expected</p>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4">
                        <ZapIcon className="h-8 w-8 text-[hsl(var(--energy-warning))] mb-2" />
                        <h3 className="text-lg font-medium mb-1">Peak Avoidance</h3>
                        <p className="text-sm text-muted-foreground">Tomorrow, 5:00 PM - 8:00 PM</p>
                        <p className="text-xs mt-2">Use battery instead of grid</p>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4">
                        <BarChart3Icon className="h-8 w-8 text-[hsl(var(--energy-secondary))] mb-2" />
                        <h3 className="text-lg font-medium mb-1">Export Opportunity</h3>
                        <p className="text-sm text-muted-foreground">Tomorrow, 12:00 PM - 3:00 PM</p>
                        <p className="text-xs mt-2">Potential revenue: $3.45</p>
                      </div>
                    </div>
                    
                    <div className="bg-[hsl(var(--energy-primary)/0.1)] rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2">Automated Optimization</h3>
                      <p className="text-sm mb-4">Your battery is set to automatically optimize based on weather forecasts and electricity prices.</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Optimization Mode: Weather-Aware TOU</span>
                        <Badge>Active</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Adjust Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// Quick stat card component
function QuickStatCard({ 
  title, 
  value, 
  description, 
  trend, 
  icon 
}: { 
  title: string; 
  value: string; 
  description: string; 
  trend: string; 
  icon: React.ReactNode;
}) {
  const isTrendPositive = trend.startsWith('+');
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className={`text-xs mt-1 ${isTrendPositive ? 'text-[hsl(var(--energy-success))]' : 'text-[hsl(var(--energy-warning))]'}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}

// View shown when user has no battery systems
function NoBatterySystemsView() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>No Battery Systems Found</CardTitle>
        <CardDescription>
          You don't have any battery systems registered yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <BatteryChargingIcon className="h-16 w-16 text-muted-foreground mb-6" />
        <h3 className="text-xl font-medium mb-2">Get Started with Energy Storage</h3>
        <p className="text-center text-muted-foreground mb-6 max-w-md">
          Register your battery system or explore our range of energy storage solutions to take control of your energy usage.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href="/products">Browse Battery Systems</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/batteries/register">Register Existing System</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
