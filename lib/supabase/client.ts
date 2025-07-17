/**
 * Supabase Client Utility
 * 
 * This module provides typed Supabase clients for both server and browser environments,
 * with support for Next.js 14 App Router, authentication, and admin operations.
 */

import { createClient } from '@supabase/supabase-js';
import { createServerClient, createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type CookieOptions } from '@supabase/ssr';
import { cache } from 'react';

// Environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Define Supabase database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          created_at: string;
          updated_at: string;
          phone: string | null;
          avatar_url: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          notification_preferences: {
            email: boolean;
            sms: boolean;
            push: boolean;
          } | null;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
          updated_at?: string;
          phone?: string | null;
          avatar_url?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          notification_preferences?: {
            email: boolean;
            sms: boolean;
            push: boolean;
          } | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
          updated_at?: string;
          phone?: string | null;
          avatar_url?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          notification_preferences?: {
            email: boolean;
            sms: boolean;
            push: boolean;
          } | null;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'user' | 'installer' | 'supplier' | 'community_admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'admin' | 'user' | 'installer' | 'supplier' | 'community_admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'admin' | 'user' | 'installer' | 'supplier' | 'community_admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      batteries: {
        Row: {
          id: string;
          name: string;
          manufacturer: string;
          model: string;
          capacity: number;
          description: string | null;
          retail_price: number;
          sale_price: number | null;
          stock_quantity: number;
          in_stock: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          image_url: string | null;
          specifications: Record<string, any> | null;
          warranty_years: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          manufacturer: string;
          model: string;
          capacity: number;
          description?: string | null;
          retail_price: number;
          sale_price?: number | null;
          stock_quantity?: number;
          in_stock?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          image_url?: string | null;
          specifications?: Record<string, any> | null;
          warranty_years?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          manufacturer?: string;
          model?: string;
          capacity?: number;
          description?: string | null;
          retail_price?: number;
          sale_price?: number | null;
          stock_quantity?: number;
          in_stock?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          image_url?: string | null;
          specifications?: Record<string, any> | null;
          warranty_years?: number | null;
        };
      };
      battery_systems: {
        Row: {
          id: string;
          user_id: string;
          battery_id: string;
          serial_number: string;
          manufacturer: string;
          model: string;
          capacity: number;
          installer_id: string | null;
          installation_date: string | null;
          location: string | null;
          nickname: string | null;
          api_key: string | null;
          api_secret: string | null;
          status: 'active' | 'inactive' | 'maintenance' | 'error';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          battery_id: string;
          serial_number: string;
          manufacturer: string;
          model: string;
          capacity: number;
          installer_id?: string | null;
          installation_date?: string | null;
          location?: string | null;
          nickname?: string | null;
          api_key?: string | null;
          api_secret?: string | null;
          status?: 'active' | 'inactive' | 'maintenance' | 'error';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          battery_id?: string;
          serial_number?: string;
          manufacturer?: string;
          model?: string;
          capacity?: number;
          installer_id?: string | null;
          installation_date?: string | null;
          location?: string | null;
          nickname?: string | null;
          api_key?: string | null;
          api_secret?: string | null;
          status?: 'active' | 'inactive' | 'maintenance' | 'error';
          created_at?: string;
          updated_at?: string;
        };
      };
      communities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          location: string | null;
          admin_id: string;
          created_at: string;
          updated_at: string;
          member_count: number;
          status: 'active' | 'inactive' | 'pending';
          image_url: string | null;
          join_code: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          location?: string | null;
          admin_id: string;
          created_at?: string;
          updated_at?: string;
          member_count?: number;
          status?: 'active' | 'inactive' | 'pending';
          image_url?: string | null;
          join_code?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          location?: string | null;
          admin_id?: string;
          created_at?: string;
          updated_at?: string;
          member_count?: number;
          status?: 'active' | 'inactive' | 'pending';
          image_url?: string | null;
          join_code?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          battery_id: string;
          community_id: string | null;
          order_number: string;
          total_amount: number;
          deposit_amount: number;
          balance_amount: number;
          payment_status: 'pending' | 'deposit_paid' | 'paid' | 'refunded' | 'cancelled';
          created_at: string;
          updated_at: string;
          shipping_address: Record<string, any> | null;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          battery_id: string;
          community_id?: string | null;
          order_number?: string;
          total_amount: number;
          deposit_amount: number;
          balance_amount: number;
          payment_status?: 'pending' | 'deposit_paid' | 'paid' | 'refunded' | 'cancelled';
          created_at?: string;
          updated_at?: string;
          shipping_address?: Record<string, any> | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          battery_id?: string;
          community_id?: string | null;
          order_number?: string;
          total_amount?: number;
          deposit_amount?: number;
          balance_amount?: number;
          payment_status?: 'pending' | 'deposit_paid' | 'paid' | 'refunded' | 'cancelled';
          created_at?: string;
          updated_at?: string;
          shipping_address?: Record<string, any> | null;
          metadata?: Record<string, any> | null;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          payment_method: 'bpay' | 'payid' | 'bank_transfer' | 'gocardless';
          payment_type: 'deposit' | 'balance';
          amount: number;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          reference: string;
          created_at: string;
          updated_at: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          payment_method: 'bpay' | 'payid' | 'bank_transfer' | 'gocardless';
          payment_type: 'deposit' | 'balance';
          amount: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          reference?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string;
          payment_method?: 'bpay' | 'payid' | 'bank_transfer' | 'gocardless';
          payment_type?: 'deposit' | 'balance';
          amount?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          reference?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_battery_inventory: {
        Args: {
          battery_id: string;
          quantity: number;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Define types for client options
interface ServerClientOptions {
  admin?: boolean;
  cookieOptions?: CookieOptions;
}

/**
 * Creates a Supabase client for server-side operations
 * Uses the service role key for admin operations when available
 * Falls back to cookie-based auth for user context
 * 
 * @param options - Optional configuration
 * @returns Typed Supabase client
 */
export function createServerSupabaseClient(options: ServerClientOptions = {}) {
  const { admin = false, cookieOptions } = options;
  
  // Use service role for admin operations (bypasses RLS)
  if (admin && supabaseServiceRoleKey) {
    return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-admin-operation': 'true'
        }
      }
    });
  }
  
  // Use cookie-based auth for normal server operations
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: (name) => {
          return cookieStore.get(name)?.value;
        },
        set: (name, value, options) => {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Handle cookies.set in read-only context
            console.warn('Warning: Unable to set cookie in read-only context', { name, error });
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          } catch (error) {
            // Handle cookies.remove in read-only context
            console.warn('Warning: Unable to remove cookie in read-only context', { name, error });
          }
        }
      },
      ...cookieOptions
    }
  );
}

/**
 * Cached version of createServerSupabaseClient to improve performance
 * Useful for components that need to access Supabase data
 */
export const createServerSupabaseClientCached = cache((options: ServerClientOptions = {}) => {
  return createServerSupabaseClient(options);
});

/**
 * Creates a Supabase client for browser-side operations
 * @returns Typed Supabase client
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce', // Use PKCE flow for better security
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

/**
 * Legacy client for direct Supabase JS usage
 * @deprecated Use createServerSupabaseClient or createBrowserSupabaseClient instead
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Authentication helper functions
 */
export const AuthHelpers = {
  /**
   * Get the currently logged in user
   * @param client - Supabase client
   * @returns User data or null if not authenticated
   */
  async getCurrentUser(client = supabaseClient) {
    try {
      const { data: { user }, error } = await client.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Get the user's role
   * @param userId - User ID to check
   * @param client - Supabase client
   * @returns User role or null if not found
   */
  async getUserRole(userId: string, client = supabaseClient) {
    try {
      const { data, error } = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  /**
   * Check if the user has a specific role
   * @param userId - User ID to check
   * @param role - Role to check for
   * @param client - Supabase client
   * @returns Boolean indicating if user has the role
   */
  async hasRole(userId: string, role: string, client = supabaseClient) {
    const userRole = await this.getUserRole(userId, client);
    return userRole === role;
  },

  /**
   * Check if the user is an admin
   * @param userId - User ID to check
   * @param client - Supabase client
   * @returns Boolean indicating if user is an admin
   */
  async isAdmin(userId: string, client = supabaseClient) {
    return this.hasRole(userId, 'admin', client);
  }
};

/**
 * Database helper functions
 */
export const DatabaseHelpers = {
  /**
   * Get a user's profile data
   * @param userId - User ID to get profile for
   * @param client - Supabase client
   * @returns User profile data or null if not found
   */
  async getUserProfile(userId: string, client = supabaseClient) {
    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  /**
   * Get a user's battery systems
   * @param userId - User ID to get battery systems for
   * @param client - Supabase client
   * @returns Array of battery systems or empty array if none found
   */
  async getUserBatterySystems(userId: string, client = supabaseClient) {
    try {
      const { data, error } = await client
        .from('battery_systems')
        .select(`
          *,
          battery:batteries(id, name, manufacturer, model, capacity)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user battery systems:', error);
      return [];
    }
  },

  /**
   * Get a user's orders
   * @param userId - User ID to get orders for
   * @param client - Supabase client
   * @returns Array of orders or empty array if none found
   */
  async getUserOrders(userId: string, client = supabaseClient) {
    try {
      const { data, error } = await client
        .from('orders')
        .select(`
          *,
          battery:batteries(id, name, manufacturer, model, capacity),
          community:communities(id, name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }
};

/**
 * Default export for convenience
 */
export default {
  createServerSupabaseClient,
  createServerSupabaseClientCached,
  createBrowserSupabaseClient,
  supabaseClient,
  AuthHelpers,
  DatabaseHelpers
};
