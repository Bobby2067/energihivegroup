import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';

import './globals.css';

// Font configuration
const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Metadata for SEO
export const metadata: Metadata = {
  title: {
    default: 'Energi Hive | Australian Energy Storage Solutions',
    template: '%s | Energi Hive',
  },
  description: 'Australia\'s premier marketplace for home battery systems, solar solutions, and energy management. Optimized for the Australian energy market.',
  keywords: ['battery', 'energy storage', 'solar', 'renewable energy', 'Australia', 'home battery', 'AlphaESS', 'LG RESU'],
  authors: [{ name: 'Energi Hive', url: 'https://energihive.com.au' }],
  creator: 'Energi Hive Pty Ltd',
  publisher: 'Energi Hive Pty Ltd',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://energihive.com.au'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://energihive.com.au',
    title: 'Energi Hive | Australian Energy Storage Solutions',
    description: 'Australia\'s premier marketplace for home battery systems, solar solutions, and energy management.',
    siteName: 'Energi Hive',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Energi Hive - Australian Energy Storage Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Energi Hive | Australian Energy Storage Solutions',
    description: 'Australia\'s premier marketplace for home battery systems, solar solutions, and energy management.',
    images: ['/images/twitter-image.jpg'],
    creator: '@energihive',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'google-site-verification=energihive',
  },
  category: 'energy',
};

// Get initial server state for NextAuth
async function getInitialState() {
  try {
    const session = await auth();
    return {
      session,
    };
  } catch (error) {
    console.error('Error getting initial state:', error);
    return {
      session: null,
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialState = await getInitialState();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        fontSans.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider session={initialState.session}>
            <QueryProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navigation />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster position="top-right" closeButton richColors />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
