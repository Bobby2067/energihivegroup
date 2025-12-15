"use client"

import React from "react"
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

// Authentication provider props
interface AuthProviderProps {
  children: React.ReactNode
  session: Session | null
}

/**
 * Authentication Provider Component
 *
 * Provides authentication state and methods using NextAuth v5.
 * Wraps the SessionProvider from next-auth/react.
 *
 * @param props - Provider props including children and session
 * @returns AuthProvider component
 */
export function AuthProvider({
  children,
  session
}: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}
