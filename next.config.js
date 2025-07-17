/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'energihive.com.au',
      'static.energihive.com.au',
      'images.unsplash.com',
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com'
    ],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['nodemailer'],
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'recharts',
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
      {
        source: '/account',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/profile',
        destination: '/dashboard/profile',
        permanent: true,
      },
      {
        source: '/batteries',
        destination: '/products',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/healthcheck',
        destination: '/api/healthcheck',
      },
      {
        source: '/payments/gocardless/redirect',
        destination: '/api/payments/gocardless/redirect',
      },
      {
        source: '/payments/bpay/verify/:id',
        destination: '/api/payments/bpay/verify/:id',
      },
      {
        source: '/payments/payid/verify/:id',
        destination: '/api/payments/payid/verify/:id',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_REGION: 'au', // Australian market
    NEXT_PUBLIC_CURRENCY: 'AUD',
    NEXT_PUBLIC_TIMEZONE: 'Australia/Sydney',
  },
  serverRuntimeConfig: {
    // Will only be available on the server
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
    // Battery API credentials
    ALPHAESS_API_URL: process.env.ALPHAESS_API_URL,
    ALPHAESS_API_KEY: process.env.ALPHAESS_API_KEY,
    ALPHAESS_API_SECRET: process.env.ALPHAESS_API_SECRET,
    LG_API_URL: process.env.LG_API_URL,
    LG_API_KEY: process.env.LG_API_KEY,
    LG_API_SECRET: process.env.LG_API_SECRET,
    // Australian payment systems
    BPAY_BILLER_CODE: process.env.BPAY_BILLER_CODE,
    PAYID_IDENTIFIER: process.env.PAYID_IDENTIFIER,
    BANK_ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME,
    BANK_BSB: process.env.BANK_BSB,
    BANK_ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER,
    GOCARDLESS_ACCESS_TOKEN: process.env.GOCARDLESS_ACCESS_TOKEN,
    GOCARDLESS_ENVIRONMENT: process.env.GOCARDLESS_ENVIRONMENT || 'sandbox',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    APP_NAME: 'Energi Hive',
    APP_VERSION: '1.0.0',
    ENABLE_BATTERY_SIMULATION: process.env.ENABLE_BATTERY_SIMULATION === 'true',
  },
  // Optimize for Vercel deployment
  output: 'standalone',
};

module.exports = nextConfig;
