/**
 * NextAuth v5 Configuration
 *
 * Using Drizzle adapter for database persistence
 */

import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from 'next-auth/providers/credentials';
import Email from 'next-auth/providers/email';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Credentials schema for validation
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/auth/welcome',
  },
  providers: [
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@energihive.com.au',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentialsSchema.parse(credentials);

          // Find user by email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return null;
          }

          // For now, allow any password in development
          // In production, you'd verify against a hashed password
          if (process.env.NODE_ENV === 'production') {
            // TODO: Implement proper password hashing and verification
            // const isValid = await bcrypt.compare(password, user.passwordHash);
            // if (!isValid) return null;
            return null; // Disable credentials auth in production for now
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Add user info to JWT on sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      // Add user info to session
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      return session;
    },
  },
});
