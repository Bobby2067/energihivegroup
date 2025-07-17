"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { useRouter, usePathname } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

// Define the authentication context type
type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    success: boolean
  }>
  signUp: (email: string, password: string) => Promise<{
    error: Error | null
    success: boolean
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{
    error: Error | null
    success: boolean
  }>
  updatePassword: (password: string) => Promise<{
    error: Error | null
    success: boolean
  }>
  sendMagicLink: (email: string) => Promise<{
    error: Error | null
    success: boolean
  }>
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Authentication provider props
interface AuthProviderProps {
  children: React.ReactNode
  initialSession: Session | null
}

/**
 * Authentication Provider Component
 * 
 * Provides authentication state and methods using Supabase.
 * Handles user sessions, sign in/out, and authentication state management.
 * 
 * @param props - Provider props including children and initial session
 * @returns AuthProvider component
 */
export function AuthProvider({ 
  children,
  initialSession
}: AuthProviderProps) {
  // Initialize state
  const [session, setSession] = useState<Session | null>(initialSession)
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  // Initialize router for navigation after auth events
  const router = useRouter()
  const pathname = usePathname()
  
  // Create Supabase client
  const supabase = createClient()
  
  // Handle session changes
  useEffect(() => {
    // Set initial state
    setIsLoading(false)
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user || null)
        
        // Handle auth events
        if (event === 'SIGNED_IN' && pathname === '/login') {
          router.push('/dashboard')
        }
        
        if (event === 'SIGNED_OUT') {
          router.push('/')
        }
      }
    )
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      return {
        error,
        success: !error,
      }
    } catch (error) {
      return {
        error: error as Error,
        success: false,
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      return {
        error,
        success: !error,
      }
    } catch (error) {
      return {
        error: error as Error,
        success: false,
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Sign out
  const signOut = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setIsLoading(false)
  }
  
  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      return {
        error,
        success: !error,
      }
    } catch (error) {
      return {
        error: error as Error,
        success: false,
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Update password
  const updatePassword = async (password: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.updateUser({
        password,
      })
      
      return {
        error,
        success: !error,
      }
    } catch (error) {
      return {
        error: error as Error,
        success: false,
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Send magic link
  const sendMagicLink = async (email: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      return {
        error,
        success: !error,
      }
    } catch (error) {
      return {
        error: error as Error,
        success: false,
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Create context value
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    sendMagicLink,
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use authentication context
 * 
 * @returns Authentication context with user, session, and auth methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  
  return context
}
