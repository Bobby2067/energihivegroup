'use client';

import { Battery, CheckCircle, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BatteryProductCardProps {
  id: string;
  name: string;
  manufacturer: string;
  capacity: string;
  power: string;
  price: number;
  salePrice?: number;
  warranty: number;
  rating: number;
  reviews: number;
  imageUrl?: string;
  isFeatured?: boolean;
  cecApproved?: boolean;
  rebateEligible?: boolean;
  rebateAmount?: number;
}

/**
 * Battery Product Card Component
 *
 * Displays a battery product with Australian market features:
 * - CEC approval badge
 * - Rebate eligibility
 * - GST-inclusive pricing
 * - Australian warranty information
 */
export function BatteryProductCard({
  name,
  manufacturer,
  capacity,
  power,
  price,
  salePrice,
  warranty,
  rating,
  reviews,
  imageUrl,
  isFeatured,
  cecApproved,
  rebateEligible,
  rebateAmount,
}: BatteryProductCardProps) {
  const displayPrice = salePrice || price;
  const savingsAmount = salePrice ? price - salePrice : 0;
  const priceAfterRebate = rebateAmount ? displayPrice - rebateAmount : displayPrice;

  return (
    <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
      {isFeatured && (
        <div className="bg-gradient-to-r from-blue-600 to-green-600 px-4 py-2 text-center">
          <Badge variant="secondary" className="bg-white/20 text-white">
            <TrendingUp className="mr-1 h-3 w-3" />
            Featured
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="mb-4 flex h-48 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-contain p-4" />
          ) : (
            <Battery className="h-24 w-24 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {cecApproved && (
            <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
              <CheckCircle className="mr-1 h-3 w-3" />
              CEC Approved
            </Badge>
          )}
          {rebateEligible && (
            <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
              Rebate Eligible
            </Badge>
          )}
        </div>

        <CardTitle className="mt-2 line-clamp-2">{name}</CardTitle>
        <CardDescription>{manufacturer}</CardDescription>

        <div className="mt-2 flex items-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">({reviews})</span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Capacity</p>
            <p className="font-semibold">{capacity}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Power</p>
            <p className="font-semibold">{power}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Warranty</p>
            <p className="font-semibold">{warranty} years</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-baseline gap-2">
            {salePrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${price.toLocaleString('en-AU')}
              </span>
            )}
            <span className="text-2xl font-bold">
              ${displayPrice.toLocaleString('en-AU')}
            </span>
            <span className="text-xs text-muted-foreground">inc GST</span>
          </div>

          {savingsAmount > 0 && (
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Save ${savingsAmount.toLocaleString('en-AU')}
            </p>
          )}

          {rebateEligible && rebateAmount && (
            <div className="rounded-md bg-blue-50 p-2 dark:bg-blue-950">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                After rebate: ${priceAfterRebate.toLocaleString('en-AU')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Up to ${rebateAmount.toLocaleString('en-AU')} rebate available
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button className="flex-1" variant="default">
          View Details
        </Button>
        <Button variant="outline">Compare</Button>
      </CardFooter>
    </Card>
  );
}
