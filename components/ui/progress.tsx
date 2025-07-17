"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      variant: {
        default: "bg-secondary",
        energy: "bg-[hsl(var(--energy-primary)/0.2)]",
        secondary: "bg-[hsl(var(--energy-secondary)/0.2)]",
        accent: "bg-[hsl(var(--energy-accent)/0.2)]",
        success: "bg-[hsl(var(--energy-success)/0.2)]",
        warning: "bg-[hsl(var(--energy-warning)/0.2)]",
        destructive: "bg-[hsl(var(--energy-danger)/0.2)]",
        ausGreen: "bg-[hsl(var(--aus-green)/0.2)]",
        ausGold: "bg-[hsl(var(--aus-gold)/0.2)]",
        battery: "bg-muted",
      },
      size: {
        default: "h-4",
        sm: "h-2",
        lg: "h-6",
        xl: "h-8",
      },
      animated: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animated: false,
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary",
        energy: "bg-[hsl(var(--energy-primary))]",
        secondary: "bg-[hsl(var(--energy-secondary))]",
        accent: "bg-[hsl(var(--energy-accent))]",
        success: "bg-[hsl(var(--energy-success))]",
        warning: "bg-[hsl(var(--energy-warning))]",
        destructive: "bg-[hsl(var(--energy-danger))]",
        ausGreen: "bg-[hsl(var(--aus-green))]",
        ausGold: "bg-[hsl(var(--aus-gold))]",
        battery: "battery-medium", // Uses the battery color class from globals.css
      },
      animated: {
        true: "animate-progress-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorVariant?: VariantProps<typeof progressIndicatorVariants>["variant"]
  indicatorClassName?: string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value, 
  variant, 
  size, 
  animated,
  indicatorVariant,
  indicatorClassName,
  ...props 
}, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, size, animated }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        progressIndicatorVariants({ 
          variant: indicatorVariant || variant, 
          animated 
        }),
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
