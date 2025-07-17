"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

// Define types for the auth context
type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{ success: boolean; error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error: AuthError | null }>;
  updateEmail: (email: string) => Promise<{ success: boolean; error: AuthError | null }>;
  updateProfile: (profile: { [key: string]: any }) => Promise<{ success: boolean; error: Error | null }>;
  sendMagicLink: (email: string) => Promise<{ success: boolean; error: AuthError | null }>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the auth provider
interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: Session | null;
}

/**
 * Authentication Provider Component
 * 
 * Manages Supabase authentication state and provides auth context to all components.
 * Handles session management, user information, and authentication functions.
 * 
 * @param {React.ReactNode} children - Child components
 * @param {Session | null} initialSession - Initial session from SSR
 */
export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  // Create Supabase client
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  // State for auth data
  const [session, setSession] = useState<Session | null>(initialSession || null);
  const [user, setUser] = useState<User | null>(initialSession?.user || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Compute authentication status
  const isAuthenticated = !!session && !!user;

  // Protected routes configuration
  const protectedRoutes = ['/dashboard', '/account', '/orders', '/batteries'];
  const authRoutes = ['/login', '/signup', '/reset-password'];
  
  // Handle auth state changes
  useEffect(() => {
    // Set initial data from props
    if (initialSession) {
      setSession(initialSession);
      setUser(initialSession.user);
    }

    // Function to get the current session
    const getSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error);
          console.error("Error getting session:", error.message);
        } else {
          setSession(session);
          setUser(session?.user || null);
        }
      } catch (err) {
        console.error("Unexpected error during getSession:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Get the initial session
    getSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          toast.success('Successfully signed in');
          
          // Redirect from auth pages if user signs in
          if (authRoutes.some(route => pathname.startsWith(route))) {
            router.push('/dashboard');
          }
        }
        
        if (event === 'SIGNED_OUT') {
          toast.info('You have been signed out');
          
          // Redirect to home page on sign out
          if (protectedRoutes.some(route => pathname.startsWith(route))) {
            router.push('/');
          }
        }
        
        if (event === 'PASSWORD_RECOVERY') {
          router.push('/reset-password');
        }
        
        if (event === 'USER_UPDATED') {
          toast.success('Your profile has been updated');
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, pathname, initialSession]);

  // Route protection effect
  useEffect(() => {
    // Skip during initial load
    if (isLoading) return;

    // Redirect from protected routes if not authenticated
    if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      toast.error('You need to be logged in to access this page');
    }

    // Redirect from auth routes if already authenticated
    if (isAuthenticated && authRoutes.some(route => pathname.startsWith(route))) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router, isLoading]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error);
        toast.error(error.message);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error("Unexpected error during signIn:", err);
      return { 
        success: false, 
        error: new Error("An unexpected error occurred") as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error);
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Check your email to confirm your account');
      return { success: true, error: null };
    } catch (err) {
      console.error("Unexpected error during signUp:", err);
      return { 
        success: false, 
        error: new Error("An unexpected error occurred") as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error);
        toast.error(error.message);
      }
    } catch (err) {
      console.error("Unexpected error during signOut:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error);
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Check your email for password reset instructions');
      return { success: true, error: null };
    } catch (err) {
      console.error("Unexpected error during resetPassword:", err);
      return { 
        success: false, 
        error: new Error("An unexpected error occurred") as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error);
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Password updated successfully');
      return { success: true, error: null };
    } catch (err) {
      console.error("Unexpected error during updatePassword:", err);
      return { 
        success: false, 
        error: new Error("An unexpected error occurred") as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Update email
  const updateEmail = async (email: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.updateUser({
        email,
      });

      if (error) {
        setError(error);
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Check your email to confirm the change');
      return { success: true, error: null };
    } catch (err) {
      console.error("Unexpected error during updateEmail:", err);
      return { 
        success: false, 
        error: new Error("An unexpected error occurred") as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile in the profiles table
  const updateProfile = async (profile: { [key: string]: any }) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        return { 
          success: false, 
          error: new Error("User not authenticated") 
        };
      }

      // First update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: profile,
      });

      if (authError) {
        setError(authError);
        toast.error(authError.message);
        return { success: false, error: authError };
      }

      // Then update the profile in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          updated_at: new Date().toISOString(),
          ...profile,
        });

      if (profileError) {
        console.error("Error updating profile:", profileError);
        toast.error("Failed to update profile details");
        return { success: false, error: profileError };
      }

      toast.success('Profile updated successfully');
      return { success: true, error: null };
    } catch (err) {
      console.error("Unexpected error during updateProfile:", err);
      return { 
        success: false, 
        error: new Error("An unexpected error occurred") 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Send magic link
  const sendMagicLink = async (email: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error);
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Check your email for the login link');
      return { success: true, error: null };
    } catch (err) {
      console.error("Unexpected error during sendMagicLink:", err);
      return { 
        success: false, 
        error: new Error("An unexpected error occurred") as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    session,
    user,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    updateProfile,
    sendMagicLink,
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use the auth context
 * 
 * @returns {AuthContextType} The auth context
 * @throws {Error} If used outside of an AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
