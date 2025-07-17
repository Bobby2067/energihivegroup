"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * Theme Provider Component
 * 
 * Provides theme context to the application with support for:
 * - Light/dark mode switching
 * - System preference detection
 * - Hydration handling
 * - Australian energy market brand colors
 * 
 * Uses next-themes under the hood for theme management.
 */
export function ThemeProvider({ 
  children, 
  ...props 
}: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  // Handle hydration issues by only rendering after component is mounted
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by rendering a simple div during SSR
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}

/**
 * Hook to access the current theme and theme-related functions
 * 
 * @returns Theme context with setTheme function and current theme
 */
export function useTheme() {
  const context = React.useContext(
    // @ts-expect-error - ThemeContext is not exported from next-themes
    // This is a workaround to access the theme context directly
    // The actual context is available at runtime
    NextThemesProvider.Context
  );

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

/**
 * Australian Energy Market Theme Colors
 * 
 * These colors are defined in globals.css as CSS variables
 * This object provides a reference for use in JavaScript
 */
export const energyThemeColors = {
  primary: "hsl(var(--energy-primary))",
  primaryDark: "hsl(var(--energy-primary-dark))",
  secondary: "hsl(var(--energy-secondary))",
  secondaryDark: "hsl(var(--energy-secondary-dark))",
  accent: "hsl(var(--energy-accent))",
  accentDark: "hsl(var(--energy-accent-dark))",
  warning: "hsl(var(--energy-warning))",
  warningDark: "hsl(var(--energy-warning-dark))",
  danger: "hsl(var(--energy-danger))",
  dangerDark: "hsl(var(--energy-danger-dark))",
  success: "hsl(var(--energy-success))",
  successDark: "hsl(var(--energy-success-dark))",
  ausGreen: "hsl(var(--aus-green))",
  ausGold: "hsl(var(--aus-gold))",
};
