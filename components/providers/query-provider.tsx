"use client"

import React, { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

/**
 * Query keys for API endpoints
 * 
 * Structured to allow for easy invalidation and type safety
 */
export const queryKeys = {
  batteries: {
    all: ['batteries'] as const,
    lists: () => [...queryKeys.batteries.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.batteries.lists(), filters] as const,
    details: () => [...queryKeys.batteries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.batteries.details(), id] as const,
    monitoring: (systemId: string) => [...queryKeys.batteries.all, 'monitoring', systemId] as const,
    history: (systemId: string, period: string) => 
      [...queryKeys.batteries.monitoring(systemId), 'history', period] as const,
    stats: (systemId: string) => [...queryKeys.batteries.monitoring(systemId), 'stats'] as const,
    cells: (systemId: string) => [...queryKeys.batteries.monitoring(systemId), 'cells'] as const,
  },
  payments: {
    all: ['payments'] as const,
    methods: () => [...queryKeys.payments.all, 'methods'] as const,
    transactions: () => [...queryKeys.payments.all, 'transactions'] as const,
    transaction: (id: string) => [...queryKeys.payments.transactions(), id] as const,
    invoices: () => [...queryKeys.payments.all, 'invoices'] as const,
    invoice: (id: string) => [...queryKeys.payments.invoices(), id] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
    notifications: () => [...queryKeys.user.all, 'notifications'] as const,
  },
}

/**
 * React Query Provider Component
 * 
 * Provides React Query client for API state management.
 * Configured with defaults optimized for the Energi Hive platform.
 * 
 * @param props - Provider props including children
 * @returns QueryProvider component
 */
export function QueryProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Optimized for Australian energy market data
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 30, // 30 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 2,
        retryDelay: 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
