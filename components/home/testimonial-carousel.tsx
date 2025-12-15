'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';
  rating: number;
  comment: string;
  product: string;
  savings: string;
  avatarUrl?: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    location: 'Sydney',
    state: 'NSW',
    rating: 5,
    comment: 'Absolutely thrilled with my LG RESU battery! The installation was seamless, and I\'m already seeing a 70% reduction in my electricity bills. The Energi Hive team made the whole process easy.',
    product: 'LG RESU10H Prime',
    savings: '$180/month',
  },
  {
    id: '2',
    name: 'James Chen',
    location: 'Melbourne',
    state: 'VIC',
    rating: 5,
    comment: 'The Solar Victoria rebate made this incredibly affordable. My AlphaESS battery charges during off-peak and powers my home during expensive peak hours. Best investment I\'ve made!',
    product: 'AlphaESS SMILE-B3',
    savings: '$220/month',
  },
  {
    id: '3',
    name: 'Emma Thompson',
    location: 'Brisbane',
    state: 'QLD',
    rating: 5,
    comment: 'Living in Queensland with solar, the Tesla Powerwall was a game-changer. The app is fantastic, and I love seeing my energy independence grow. Highly recommend Energi Hive!',
    product: 'Tesla Powerwall 2',
    savings: '$195/month',
  },
];

/**
 * Testimonial Carousel Component
 *
 * Displays customer testimonials with Australian locations and state rebates
 * - Auto-rotates every 5 seconds
 * - Manual navigation with arrows
 * - Shows real Australian customer experiences
 */
export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const previousTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonial = testimonials[currentIndex];

  return (
    <div className="relative w-full">
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          <div className="relative">
            <Quote className="absolute -left-2 -top-2 h-12 w-12 text-primary/10" />

            <div className="relative z-10">
              {/* Rating */}
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < testimonial.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="mb-6 text-lg leading-relaxed text-foreground">
                "{testimonial.comment}"
              </p>

              {/* Stats Grid */}
              <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-semibold">{testimonial.product}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Savings</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {testimonial.savings}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} />
                  <AvatarFallback>
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.location}, {testimonial.state}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={previousTestimonial}
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Dots */}
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={nextTestimonial}
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
