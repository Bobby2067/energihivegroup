import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--energy-primary))] text-primary-foreground hover:bg-[hsl(var(--energy-primary-dark))]",
        destructive:
          "bg-[hsl(var(--energy-danger))] text-destructive-foreground hover:bg-[hsl(var(--energy-danger-dark))]",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-[hsl(var(--energy-secondary))] text-secondary-foreground hover:bg-[hsl(var(--energy-secondary-dark))]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-[hsl(var(--energy-primary))] underline-offset-4 hover:underline",
        success: "bg-[hsl(var(--energy-success))] text-white hover:bg-[hsl(var(--energy-success-dark))]",
        warning: "bg-[hsl(var(--energy-warning))] text-white hover:bg-[hsl(var(--energy-warning-dark))]",
        accent: "bg-[hsl(var(--energy-accent))] text-white hover:bg-[hsl(var(--energy-accent-dark))]",
        ausGreen: "bg-[hsl(var(--aus-green))] text-white hover:bg-[hsl(var(--aus-green)/0.9)]",
        ausGold: "bg-[hsl(var(--aus-gold))] text-black hover:bg-[hsl(var(--aus-gold)/0.9)]",
        glass: "glass-button text-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, isLoading = false, loadingText, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || isLoading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2 inline-flex">{leftIcon}</span>
        )}
        {isLoading && loadingText ? loadingText : children}
        {!isLoading && rightIcon && (
          <span className="ml-2 inline-flex">{rightIcon}</span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
