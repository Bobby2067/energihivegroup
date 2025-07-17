import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-[hsl(var(--energy-danger)/0.5)] bg-[hsl(var(--energy-danger)/0.1)] text-[hsl(var(--energy-danger))] [&>svg]:text-[hsl(var(--energy-danger))]",
        success:
          "border-[hsl(var(--energy-success)/0.5)] bg-[hsl(var(--energy-success)/0.1)] text-[hsl(var(--energy-success))] [&>svg]:text-[hsl(var(--energy-success))]",
        warning:
          "border-[hsl(var(--energy-warning)/0.5)] bg-[hsl(var(--energy-warning)/0.1)] text-[hsl(var(--energy-warning))] [&>svg]:text-[hsl(var(--energy-warning))]",
        energy:
          "border-[hsl(var(--energy-primary)/0.5)] bg-[hsl(var(--energy-primary)/0.1)] text-[hsl(var(--energy-primary))] [&>svg]:text-[hsl(var(--energy-primary))]",
        secondary:
          "border-[hsl(var(--energy-secondary)/0.5)] bg-[hsl(var(--energy-secondary)/0.1)] text-[hsl(var(--energy-secondary))] [&>svg]:text-[hsl(var(--energy-secondary))]",
        accent:
          "border-[hsl(var(--energy-accent)/0.5)] bg-[hsl(var(--energy-accent)/0.1)] text-[hsl(var(--energy-accent))] [&>svg]:text-[hsl(var(--energy-accent))]",
        ausGreen:
          "border-[hsl(var(--aus-green)/0.5)] bg-[hsl(var(--aus-green)/0.1)] text-[hsl(var(--aus-green))] [&>svg]:text-[hsl(var(--aus-green))]",
        ausGold:
          "border-[hsl(var(--aus-gold)/0.5)] bg-[hsl(var(--aus-gold)/0.1)] text-[hsl(var(--aus-gold))] [&>svg]:text-[hsl(var(--aus-gold))]",
      },
      hasIcon: {
        true: "",
        false: "[&>svg]:hidden [&>*]:pl-0",
      },
    },
    defaultVariants: {
      variant: "default",
      hasIcon: true,
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      icon?: React.ReactNode
    }
>(({ className, variant, hasIcon, icon, children, ...props }, ref) => {
  // Default icons based on variant
  const getDefaultIcon = () => {
    if (!hasIcon) return null
    
    switch (variant) {
      case "destructive":
        return <XCircle className="h-4 w-4" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "energy":
      case "secondary":
      case "accent":
      case "ausGreen":
      case "ausGold":
        return <Info className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant, hasIcon }), className)}
      {...props}
    >
      {icon || getDefaultIcon()}
      {children}
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
