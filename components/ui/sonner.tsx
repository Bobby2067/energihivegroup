"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:bg-[hsl(var(--energy-success)/0.1)] group-[.toaster]:text-[hsl(var(--energy-success))] group-[.toaster]:border-[hsl(var(--energy-success)/0.2)]",
          error:
            "group-[.toaster]:bg-[hsl(var(--energy-danger)/0.1)] group-[.toaster]:text-[hsl(var(--energy-danger))] group-[.toaster]:border-[hsl(var(--energy-danger)/0.2)]",
          warning:
            "group-[.toaster]:bg-[hsl(var(--energy-warning)/0.1)] group-[.toaster]:text-[hsl(var(--energy-warning))] group-[.toaster]:border-[hsl(var(--energy-warning)/0.2)]",
          info:
            "group-[.toaster]:bg-[hsl(var(--energy-primary)/0.1)] group-[.toaster]:text-[hsl(var(--energy-primary))] group-[.toaster]:border-[hsl(var(--energy-primary)/0.2)]",
        },
      }}
      {...props}
    />
  )
}
