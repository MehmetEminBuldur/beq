// Load environment variables from global.env (development only)
// In Docker, environment variables are provided via env_file
if (process.env.NODE_ENV !== 'production' && !process.env.DOCKER_ENV) {
  require('dotenv').config({ path: '../../global.env' });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // optimizeCss: true, // Temporarily disabled due to critters dependency issue
    appDir: true, // Explicitly enable App Router
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // SSR için gerekli
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    // Use consistent localhost endpoints (docker-compose overrides these for Docker)
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
    NEXT_PUBLIC_ORCHESTRATOR_API_URL: process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_SCHEDULER_API_URL: process.env.NEXT_PUBLIC_SCHEDULER_API_URL || 'http://localhost:8001',
    NEXT_PUBLIC_RAG_API_URL: process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8002',
    NEXT_PUBLIC_CALENDAR_API_URL: process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'http://localhost:8003',
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  async rewrites() {
    // Use the same API URL as defined in env
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  images: {
    domains: ['localhost', 'api.beq.app'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async headers() {
    return [
      {
        // Service worker headers
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Static assets caching
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Performance optimizations
    if (!dev) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        supabase: {
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          name: 'supabase',
          chunks: 'all',
          priority: 20,
        },
        ui: {
          test: /[\\/]components[\\/]ui[\\/]/,
          name: 'ui-components',
          chunks: 'all',
          priority: 15,
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
