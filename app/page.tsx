import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { BatteryChargingIcon, SolarIcon, ZapIcon, PiggyBankIcon, BarChart3Icon, ShieldCheckIcon, AustraliaIcon } from 'lucide-react';
import { EnergyFlowChart } from '@/components/energy/energy-flow-chart';
import { BatteryProductCard } from '@/components/products/battery-product-card';
import { MarketStatCounter } from '@/components/stats/market-stat-counter';
import { TestimonialCarousel } from '@/components/testimonials/testimonial-carousel';
import { AustralianEnergyMap } from '@/components/maps/australian-energy-map';
import { PaymentMethodShowcase } from '@/components/payments/payment-method-showcase';

import { getBatteryProducts } from '@/lib/api/battery-products';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  // Fetch featured battery products
  const featuredProducts = await getBatteryProducts({ 
    limit: 4, 
    featured: true,
    availableInAU: true
  });
  
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[hsl(var(--energy-primary)/0.8)] to-[hsl(var(--energy-secondary)/0.8)] py-24 md:py-32">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/australia-energy-map.png" 
            alt="Australian Energy Grid Map" 
            fill 
            className="object-cover opacity-20"
            priority
          />
        </div>
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <Badge className="mb-4 bg-white/20 text-white">Australia's Energy Revolution</Badge>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Power Your Home with <span className="text-[hsl(var(--aus-gold))]">Australian</span> Energy Storage
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
              Join thousands of Australians taking control of their energy future with smart battery systems optimized for the Australian market.
            </p>
            
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button size="lg" className="bg-white text-[hsl(var(--energy-primary))] hover:bg-white/90">
                Find Your Battery
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Calculate Savings
              </Button>
            </div>
            
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
                <span className="text-sm font-medium text-white">Clean Energy Council Approved</span>
              </div>
              <div className="flex items-center space-x-2">
                <AustraliaIcon className="h-6 w-6 text-white" />
                <span className="text-sm font-medium text-white">Australian Owned</span>
              </div>
              <div className="flex items-center space-x-2">
                <ZapIcon className="h-6 w-6 text-white" />
                <span className="text-sm font-medium text-white">5000+ Installations</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>
      
      {/* Real-time Energy Statistics */}
      <section className="container mx-auto -mt-16 px-4">
        <div className="glass-card">
          <h2 className="mb-6 text-2xl font-bold">Australian Energy Market Live</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Suspense fallback={<div className="h-24 rounded-lg bg-muted animate-pulse"></div>}>
              <MarketStatCounter 
                title="Batteries Installed" 
                value={5283} 
                change={+12}
                icon={<BatteryChargingIcon className="h-5 w-5" />}
              />
            </Suspense>
            
            <Suspense fallback={<div className="h-24 rounded-lg bg-muted animate-pulse"></div>}>
              <MarketStatCounter 
                title="kWh Stored Today" 
                value={128945} 
                change={+3.2}
                suffix="kWh"
                icon={<ZapIcon className="h-5 w-5" />}
              />
            </Suspense>
            
            <Suspense fallback={<div className="h-24 rounded-lg bg-muted animate-pulse"></div>}>
              <MarketStatCounter 
                title="Customer Savings" 
                value={4832756} 
                change={+5.7}
                prefix="$"
                icon={<PiggyBankIcon className="h-5 w-5" />}
              />
            </Suspense>
          </div>
          
          <Separator className="my-8" />
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-4 text-xl font-bold">Real-time Energy Flow</h3>
              <Suspense fallback={<div className="h-64 rounded-lg bg-muted animate-pulse"></div>}>
                <EnergyFlowChart className="h-64 w-full" />
              </Suspense>
            </div>
            
            <div>
              <h3 className="mb-4 text-xl font-bold">Australian Energy Map</h3>
              <Suspense fallback={<div className="h-64 rounded-lg bg-muted animate-pulse"></div>}>
                <AustralianEnergyMap className="h-64 w-full" />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Highlights */}
      <section className="container mx-auto mt-24 px-4">
        <div className="text-center">
          <Badge className="mb-2">Features</Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Designed for Australian Homes</h2>
          <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
            Our platform is built specifically for the Australian energy market, with features that help you maximize savings and efficiency.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 rounded-full bg-[hsl(var(--energy-primary)/0.1)] p-2 w-10 h-10 flex items-center justify-center">
                <BatteryChargingIcon className="h-5 w-5 text-[hsl(var(--energy-primary))]" />
              </div>
              <CardTitle>Advanced Battery Monitoring</CardTitle>
              <CardDescription>
                Real-time monitoring of AlphaESS and LG RESU battery systems with Australian market optimizations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <ShieldCheckIcon className="mr-2 h-4 w-4 text-[hsl(var(--energy-primary))]" />
                  <span>Time-of-Use optimization</span>
                </li>
                <li className="flex items-center">
                  <ShieldCheckIcon className="mr-2 h-4 w-4 text-[hsl(var(--energy-primary))]" />
                  <span>Cell-level diagnostics</span>
                </li>
                <li className="flex items-center">
                  <ShieldCheckIcon className="mr-2 h-4 w-4 text-[hsl(var(--energy-primary))]" />
                  <span>Performance forecasting</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Learn More</Button>
            </CardFooter>
          </Card>
          
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 rounded-full bg-[hsl(var(--energy-secondary)/0.1)] p-2 w-10 h-10 flex items-center justify-center">
                <PiggyBankIcon className="h-5 w-5 text-[hsl(var(--energy-secondary))]" />
              </div>
              <CardTitle>Australian Payment Methods</CardTitle>
              <CardDescription>
                Seamless payments with methods designed specifically for the Australian market.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <ShieldCheckIcon className="mr-2 h-4 w-4 text-[hsl(var(--energy-secondary))]" />
                  <span>BPAY integration</span>
                </li>
                <li className="flex items-center">
                  <ShieldCheckIcon className="mr-2 h-4 w-4 text-[hsl(var(--energy-secondary))]" />
                  <span>PayID instant transfers</span>
                </li>
                <li className="flex items-center">
                  <ShieldCheckIcon className="mr-2 h-4 w-4 text-[hsl(var(--energy-secondary))]" />
                  <span>GoCardless direct debit</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Learn More</Button>
            </CardFooter>
          </Card>
          
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 rounded-full bg-[hsl(var(--energy-accent)/0.1)] p-2 w-10 h-10 flex items-center justify-center">
                <BarChart3Icon className="h-5 w-5 text-[hsl(var(--energy-accent))]" />
              </div>
              <CardTitle>Energy Analytics</CardTitle>
              <CardDescription>
                Comprehensive analytics and reporting to track your energy usage and savings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <ShieldCheckIcon className="mr-2 h-4 w-4 text-[hsl(var(--energy-accent))]" />
                  <span>ROI calculator</span>
                </li>
                <li className="flex items-center">
                  <ShieldCheckIcon className="mr-2 h-4 w-4 text-[hsl(var(--energy-accent))]" />
                  <span>Seasonal performance</span>
                </li>
                <li className="flex items-center">
                  <ShieldCheckIcon className="mr-2 h-4 w-4 text-[hsl(var(--energy-accent))]" />
                  <span>Grid export tracking</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Learn More</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
      
      {/* Australian Payment Methods */}
      <section className="container mx-auto mt-24 px-4">
        <div className="rounded-xl bg-gradient-to-r from-[hsl(var(--aus-green)/0.1)] to-[hsl(var(--aus-gold)/0.1)] p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <Badge className="mb-2 bg-[hsl(var(--aus-green))] text-white">Australian Payments</Badge>
              <h2 className="mb-4 text-3xl font-bold">Pay Your Way</h2>
              <p className="mb-6 text-muted-foreground">
                We've built a payment system specifically for Australians, with all the payment methods you know and trust.
              </p>
              
              <ul className="mb-8 space-y-4">
                <li className="flex items-start">
                  <div className="mr-4 mt-1 rounded-full bg-[hsl(var(--energy-primary)/0.1)] p-1">
                    <ShieldCheckIcon className="h-5 w-5 text-[hsl(var(--energy-primary))]" />
                  </div>
                  <div>
                    <h3 className="font-medium">BPAY</h3>
                    <p className="text-sm text-muted-foreground">Secure bill payments with your existing banking app</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="mr-4 mt-1 rounded-full bg-[hsl(var(--energy-primary)/0.1)] p-1">
                    <ShieldCheckIcon className="h-5 w-5 text-[hsl(var(--energy-primary))]" />
                  </div>
                  <div>
                    <h3 className="font-medium">PayID</h3>
                    <p className="text-sm text-muted-foreground">Instant transfers using your email or phone number</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="mr-4 mt-1 rounded-full bg-[hsl(var(--energy-primary)/0.1)] p-1">
                    <ShieldCheckIcon className="h-5 w-5 text-[hsl(var(--energy-primary))]" />
                  </div>
                  <div>
                    <h3 className="font-medium">GoCardless</h3>
                    <p className="text-sm text-muted-foreground">Simple direct debit for payment plans and subscriptions</p>
                  </div>
                </li>
              </ul>
              
              <Button className="bg-[hsl(var(--aus-green))] text-white hover:bg-[hsl(var(--aus-green)/0.9)]">
                Learn About Payment Options
              </Button>
            </div>
            
            <div className="flex items-center justify-center">
              <Suspense fallback={<div className="h-64 w-full rounded-lg bg-muted animate-pulse"></div>}>
                <PaymentMethodShowcase />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
      
      {/* Product Showcase */}
      <section className="container mx-auto mt-24 px-4">
        <div className="text-center">
          <Badge className="mb-2">Products</Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Popular Battery Systems</h2>
          <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
            Discover our range of home battery systems, all optimized for the Australian energy market and climate.
          </p>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-4">
            <TabsTrigger value="all">All Batteries</TabsTrigger>
            <TabsTrigger value="alphaess">AlphaESS</TabsTrigger>
            <TabsTrigger value="lg">LG RESU</TabsTrigger>
            <TabsTrigger value="tesla">Tesla</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <BatteryProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button size="lg">View All Products</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="alphaess">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts
                .filter(p => p.manufacturer === 'AlphaESS')
                .map((product) => (
                  <BatteryProductCard key={product.id} product={product} />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="lg">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts
                .filter(p => p.manufacturer === 'LG RESU')
                .map((product) => (
                  <BatteryProductCard key={product.id} product={product} />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="tesla">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts
                .filter(p => p.manufacturer === 'Tesla')
                .map((product) => (
                  <BatteryProductCard key={product.id} product={product} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
      
      {/* Testimonials */}
      <section className="container mx-auto mt-24 px-4">
        <div className="text-center">
          <Badge className="mb-2">Testimonials</Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">What Australians Say</h2>
          <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
            Hear from homeowners across Australia who have transformed their energy usage with our battery systems.
          </p>
        </div>
        
        <Suspense fallback={<div className="h-64 rounded-lg bg-muted animate-pulse"></div>}>
          <TestimonialCarousel />
        </Suspense>
      </section>
      
      {/* Australian Energy Market Trust Indicators */}
      <section className="container mx-auto mt-24 px-4">
        <div className="rounded-xl bg-[hsl(var(--energy-primary)/0.05)] p-8">
          <div className="text-center">
            <Badge className="mb-2">Trust</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Australian Energy Certified</h2>
            <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
              We meet and exceed all Australian energy standards and certifications.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-20 w-20 overflow-hidden rounded-full bg-white p-4 shadow-md">
                <Image 
                  src="/images/certifications/clean-energy-council.png" 
                  alt="Clean Energy Council" 
                  width={80} 
                  height={80}
                  className="h-full w-full object-contain"
                />
              </div>
              <h3 className="text-sm font-medium">Clean Energy Council</h3>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-20 w-20 overflow-hidden rounded-full bg-white p-4 shadow-md">
                <Image 
                  src="/images/certifications/australian-standards.png" 
                  alt="Australian Standards" 
                  width={80} 
                  height={80}
                  className="h-full w-full object-contain"
                />
              </div>
              <h3 className="text-sm font-medium">Australian Standards</h3>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-20 w-20 overflow-hidden rounded-full bg-white p-4 shadow-md">
                <Image 
                  src="/images/certifications/accc.png" 
                  alt="ACCC Approved" 
                  width={80} 
                  height={80}
                  className="h-full w-full object-contain"
                />
              </div>
              <h3 className="text-sm font-medium">ACCC Approved</h3>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-20 w-20 overflow-hidden rounded-full bg-white p-4 shadow-md">
                <Image 
                  src="/images/certifications/australian-made.png" 
                  alt="Australian Made" 
                  width={80} 
                  height={80}
                  className="h-full w-full object-contain"
                />
              </div>
              <h3 className="text-sm font-medium">Australian Made</h3>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="mt-24 w-full bg-gradient-to-r from-[hsl(var(--energy-primary))] to-[hsl(var(--energy-secondary))] py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Ready to Take Control of Your Energy?
              </h2>
              <p className="mb-8 text-white/90">
                Join thousands of Australian households already saving with our energy storage solutions.
              </p>
              
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button size="lg" className="bg-white text-[hsl(var(--energy-primary))] hover:bg-white/90">
                  Get Started
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Contact Sales
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="glass-card bg-white/10 text-white">
                <h3 className="mb-4 text-xl font-bold">Average Savings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-white/20 p-4 text-center">
                    <p className="text-sm">Monthly</p>
                    <p className="text-2xl font-bold">$125</p>
                  </div>
                  <div className="rounded-lg bg-white/20 p-4 text-center">
                    <p className="text-sm">Yearly</p>
                    <p className="text-2xl font-bold">$1,500</p>
                  </div>
                  <div className="rounded-lg bg-white/20 p-4 text-center">
                    <p className="text-sm">5 Year</p>
                    <p className="text-2xl font-bold">$7,500</p>
                  </div>
                  <div className="rounded-lg bg-white/20 p-4 text-center">
                    <p className="text-sm">ROI</p>
                    <p className="text-2xl font-bold">3.2 yrs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="container mx-auto mt-24 px-4 mb-24">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-bold">Stay Updated</h2>
              <p className="mb-6 text-muted-foreground">
                Get the latest news on Australian energy market trends, product updates, and exclusive offers.
              </p>
              
              <form className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button type="submit">Subscribe</Button>
              </form>
              
              <p className="mt-4 text-xs text-muted-foreground">
                By subscribing, you agree to our Privacy Policy and Terms of Service.
              </p>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center rounded-lg bg-[hsl(var(--energy-primary)/0.1)] p-4 text-center">
                  <SolarIcon className="mb-2 h-8 w-8 text-[hsl(var(--energy-primary))]" />
                  <h3 className="font-medium">Solar News</h3>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-[hsl(var(--energy-secondary)/0.1)] p-4 text-center">
                  <BatteryChargingIcon className="mb-2 h-8 w-8 text-[hsl(var(--energy-secondary))]" />
                  <h3 className="font-medium">Battery Tips</h3>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-[hsl(var(--energy-accent)/0.1)] p-4 text-center">
                  <PiggyBankIcon className="mb-2 h-8 w-8 text-[hsl(var(--energy-accent))]" />
                  <h3 className="font-medium">Rebate Updates</h3>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-[hsl(var(--aus-green)/0.1)] p-4 text-center">
                  <ZapIcon className="mb-2 h-8 w-8 text-[hsl(var(--aus-green))]" />
                  <h3 className="font-medium">Market Trends</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
