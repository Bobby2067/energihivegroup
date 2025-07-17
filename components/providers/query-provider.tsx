"use client";

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider as TanStackQueryProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';

import { useAuth } from './auth-provider';

/**
 * Custom Query Provider for Energi Hive
 * 
 * Configures TanStack Query with optimized defaults for energy platform data:
 * - Battery monitoring data is kept fresh with shorter stale times
 * - Payment and order data uses longer cache times
 * - Authentication headers are automatically added to requests
 * - Error handling is integrated with toast notifications
 * - Development tools are provided in development mode
 */
export function QueryProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { session } = useAuth();
  
  // Create a client with Australian energy platform optimized defaults
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time of 1 minute for most data
        staleTime: 60 * 1000,
        
        // Retry failed queries 3 times with exponential backoff
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus for real-time data
        refetchOnWindowFocus: true,
        
        // Keep data in cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        
        // Handle errors consistently
        onError: (error: unknown) => {
          const message = error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred';
            
          toast.error(`Error: ${message}`);
          console.error('Query error:', error);
        },
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        
        // Handle errors consistently
        onError: (error: unknown, variables, context) => {
          const message = error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred';
            
          toast.error(`Error: ${message}`);
          console.error('Mutation error:', error, { variables, context });
        },
      },
    },
  }));

  // Configure default fetch function with auth headers
  queryClient.setDefaultOptions({
    queries: {
      queryFn: async ({ queryKey }) => {
        // Extract URL from query key (first element is usually the endpoint)
        const url = Array.isArray(queryKey[0]) 
          ? queryKey[0][0] 
          : typeof queryKey[0] === 'string' 
            ? queryKey[0] 
            : '';
            
        // Only proceed if URL is a string
        if (typeof url !== 'string') {
          throw new Error('Invalid query key: URL must be a string');
        }
        
        // Build headers with authentication if session exists
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        // Extract query parameters from query key (second element is usually params)
        const params = queryKey[1] || {};
        
        // Build URL with query parameters
        const urlWithParams = new URL(url, window.location.origin);
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            urlWithParams.searchParams.append(key, String(value));
          }
        });
        
        // Make the request
        const response = await fetch(urlWithParams.toString(), { headers });
        
        // Handle HTTP errors
        if (!response.ok) {
          // Try to parse error message from response
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
          } catch (e) {
            // If JSON parsing fails, use status text
            throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
          }
        }
        
        // Parse and return response data
        return response.json();
      },
    },
  });

  return (
    <TanStackQueryProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </TanStackQueryProvider>
  );
}

/**
 * Custom hooks and utilities for working with queries
 */

// Hook to get the query client instance
export function useQueryClient() {
  return React.useContext(TanStackQueryProvider).getClient();
}

// Predefined query keys for better organization and type safety
export const queryKeys = {
  // Battery related queries
  batteries: {
    all: ['api/batteries'] as const,
    detail: (id: string) => ['api/batteries', id] as const,
    monitoring: (id: string) => ['api/batteries', id, 'monitoring'] as const,
  },
  
  // Order related queries
  orders: {
    all: ['api/orders'] as const,
    detail: (id: string) => ['api/orders', id] as const,
    byStatus: (status: string) => ['api/orders', { status }] as const,
  },
  
  // Payment related queries
  payments: {
    all: ['api/payments'] as const,
    detail: (id: string) => ['api/payments', id] as const,
    byOrder: (orderId: string) => ['api/payments', { orderId }] as const,
  },
  
  // User related queries
  user: {
    profile: ['api/user/profile'] as const,
    batteries: ['api/user/batteries'] as const,
    orders: ['api/user/orders'] as const,
    payments: ['api/user/payments'] as const,
  },
};

// Helper function to create authenticated fetch requests
export async function fetchWithAuth(
  url: string, 
  options: RequestInit = {}, 
  session?: { access_token: string } | null
) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    } catch (e) {
      throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
    }
  }
  
  return response;
}

// Battery data specific optimizations
export const batteryQueryOptions = {
  // Real-time battery data needs to be fresher
  realtime: {
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  },
  
  // Historical battery data can be cached longer
  historical: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  },
};

// Payment data specific optimizations
export const paymentQueryOptions = {
  // Payment status needs regular updates
  status: {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  },
  
  // Payment history can be cached longer
  history: {
    staleTime: 10 * 60 * 1000, // 10 minutes
  },
};

// Australian market specific optimizations
export const marketQueryOptions = {
  // Energy prices change frequently
  prices: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  },
  
  // Rebate information changes infrequently
  rebates: {
    staleTime: 60 * 60 * 1000, // 1 hour
  },
};
