import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-border",
        energy: "border-[hsl(var(--energy-primary)/0.5)] bg-[hsl(var(--energy-primary)/0.05)]",
        secondary: "border-[hsl(var(--energy-secondary)/0.5)] bg-[hsl(var(--energy-secondary)/0.05)]",
        accent: "border-[hsl(var(--energy-accent)/0.5)] bg-[hsl(var(--energy-accent)/0.05)]",
        success: "border-[hsl(var(--energy-success)/0.5)] bg-[hsl(var(--energy-success)/0.05)]",
        warning: "border-[hsl(var(--energy-warning)/0.5)] bg-[hsl(var(--energy-warning)/0.05)]",
        destructive: "border-[hsl(var(--energy-danger)/0.5)] bg-[hsl(var(--energy-danger)/0.05)]",
        ausGreen: "border-[hsl(var(--aus-green))] bg-[hsl(var(--aus-green)/0.05)]",
        ausGold: "border-[hsl(var(--aus-gold))] bg-[hsl(var(--aus-gold)/0.05)]",
        glass: "glass-card border-transparent",
      },
      hover: {
        true: "hover:shadow-md hover:scale-[1.01]",
        false: "",
      },
      clickable: {
        true: "cursor-pointer active:scale-[0.99]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: false,
      clickable: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, clickable, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, clickable }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const cardHeaderVariants = cva(
  "flex flex-col space-y-1.5 p-6",
  {
    variants: {
      variant: {
        default: "",
        compact: "p-4",
        borderBottom: "border-b pb-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ variant }), className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const cardTitleVariants = cva(
  "text-lg font-semibold leading-none tracking-tight",
  {
    variants: {
      variant: {
        default: "text-foreground",
        energy: "text-[hsl(var(--energy-primary))]",
        secondary: "text-[hsl(var(--energy-secondary))]",
        accent: "text-[hsl(var(--energy-accent))]",
        success: "text-[hsl(var(--energy-success))]",
        warning: "text-[hsl(var(--energy-warning))]",
        destructive: "text-[hsl(var(--energy-danger))]",
        ausGreen: "text-[hsl(var(--aus-green))]",
        ausGold: "text-[hsl(var(--aus-gold))]",
      },
      size: {
        default: "text-lg",
        sm: "text-base",
        lg: "text-xl",
        xl: "text-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof cardTitleVariants> {}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, variant, size, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(cardTitleVariants({ variant, size }), className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const cardDescriptionVariants = cva(
  "text-sm text-muted-foreground",
  {
    variants: {
      variant: {
        default: "",
        muted: "text-muted-foreground/80",
        emphasis: "font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof cardDescriptionVariants> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, variant, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(cardDescriptionVariants({ variant }), className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const cardContentVariants = cva(
  "p-6 pt-0",
  {
    variants: {
      variant: {
        default: "",
        compact: "p-4 pt-0",
        padded: "p-6",
        flush: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ variant }), className)}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

const cardFooterVariants = cva(
  "flex items-center p-6 pt-0",
  {
    variants: {
      variant: {
        default: "",
        compact: "p-4 pt-0",
        borderTop: "border-t mt-3 pt-3",
        sticky: "sticky bottom-0 bg-card border-t mt-3 pt-3",
      },
      align: {
        default: "justify-between",
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
      },
    },
    defaultVariants: {
      variant: "default",
      align: "default",
    },
  }
)

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, variant, align, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ variant, align }), className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
