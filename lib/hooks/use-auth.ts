"use client"

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"

/**
 * Custom hook for authentication using NextAuth v5
 *
 * Provides authentication state and methods for the application.
 * Wraps NextAuth's useSession hook with additional utility methods.
 *
 * @returns Authentication state and methods
 */
export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user || null,
    session,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",

    /**
     * Sign in with email and password
     */
    signIn: async (email: string, password: string) => {
      try {
        const result = await nextAuthSignIn("credentials", {
          email,
          password,
          redirect: false,
        })

        return {
          error: result?.error ? new Error(result.error) : null,
          success: !result?.error,
        }
      } catch (error) {
        return {
          error: error as Error,
          success: false,
        }
      }
    },

    /**
     * Sign in with magic link (email)
     */
    sendMagicLink: async (email: string) => {
      try {
        const result = await nextAuthSignIn("email", {
          email,
          redirect: false,
          callbackUrl: "/auth/verify",
        })

        return {
          error: result?.error ? new Error(result.error) : null,
          success: !result?.error,
        }
      } catch (error) {
        return {
          error: error as Error,
          success: false,
        }
      }
    },

    /**
     * Sign out
     */
    signOut: async () => {
      await nextAuthSignOut({ callbackUrl: "/" })
    },
  }
}
