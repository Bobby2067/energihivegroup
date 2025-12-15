'use client';

import { CreditCard, Smartphone, Building2, Wallet, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  processingTime: string;
  badge?: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'bpay',
    name: 'BPAY',
    description: 'Pay via your bank using your unique BPAY reference',
    icon: <Building2 className="h-6 w-6" />,
    features: [
      'Available 24/7',
      'Use internet banking or phone',
      'Instant confirmation',
      'No fees',
    ],
    processingTime: '1-2 business days',
    badge: 'Most Popular',
  },
  {
    id: 'payid',
    name: 'PayID',
    description: 'Fast payment using your email or mobile number',
    icon: <Smartphone className="h-6 w-6" />,
    features: [
      'Instant transfers',
      'Use your email or phone',
      'Real-time confirmation',
      'Secure NPP network',
    ],
    processingTime: 'Instant',
    badge: 'Fastest',
  },
  {
    id: 'gocardless',
    name: 'Direct Debit',
    description: 'Automated payments via GoCardless',
    icon: <CreditCard className="h-6 w-6" />,
    features: [
      'Set up once, pay automatically',
      'Flexible schedules',
      'Easy to manage',
      'Safe and secure',
    ],
    processingTime: '3-5 business days',
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    description: 'Direct transfer to our business account',
    icon: <Wallet className="h-6 w-6" />,
    features: [
      'Traditional method',
      'Use any bank',
      'Include reference number',
      'Track via statement',
    ],
    processingTime: '1-3 business days',
  },
];

/**
 * Payment Method Showcase Component
 *
 * Displays all available Australian payment methods
 * - BPAY (most popular)
 * - PayID (fastest)
 * - GoCardless Direct Debit
 * - Bank Transfer
 */
export function PaymentMethodShowcase() {
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Flexible Payment Options
        </h2>
        <p className="mt-2 text-muted-foreground">
          Choose from popular Australian payment methods
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary"
          >
            {method.badge && (
              <div className="absolute right-0 top-0">
                <Badge className="rounded-bl-lg rounded-tr-lg rounded-tl-none rounded-br-none">
                  {method.badge}
                </Badge>
              </div>
            )}

            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {method.icon}
              </div>
              <CardTitle>{method.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {method.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {/* Features */}
                <ul className="space-y-2">
                  {method.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Processing Time */}
                <div className="mt-4 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Processing Time</p>
                  <p className="font-semibold">{method.processingTime}</p>
                </div>
              </div>
            </CardContent>

            {/* Hover Effect Border */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-green-500 opacity-0 transition-opacity group-hover:opacity-100" />
          </Card>
        ))}
      </div>

      {/* Security Notice */}
      <Card className="border-green-500/20 bg-green-50 dark:bg-green-950">
        <CardContent className="flex items-start gap-3 p-4">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
          <div className="text-sm">
            <p className="font-semibold text-green-900 dark:text-green-100">
              All payments are secure and encrypted
            </p>
            <p className="mt-1 text-green-700 dark:text-green-300">
              We use industry-standard security measures to protect your financial information.
              All payment methods comply with Australian financial regulations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
