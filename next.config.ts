import type { NextConfig } from "next";
import path from 'path';

// Bundle analyzer for performance optimization
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  eslint: {
    // We omit devDependencies on Vercel, so disable lint during prod builds
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  experimental: {
    // Enable optimizations that work
    optimizeServerReact: true
  },
  // Webpack optimizations for bundle size
  webpack: (config, { dev, isServer }) => {
    // Ensure path alias '@/...' resolves in all environments (including Vercel)
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    
    // Production optimizations
    if (!dev) {
      // Bundle size optimizations
      config.optimization = {
        ...config.optimization,
        // Better splitting of chunks
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Separate vendor chunks for better caching
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Separate common chunks
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
      
      // Tree shaking improvements
      config.optimization.usedExports = true;
      config.optimization.providedExports = true;
      config.optimization.sideEffects = false;
    }
    
    return config;
  },
  images: {
    remotePatterns: [
      // Auth0 / Google / Gravatar profile images
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's.gravatar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.auth0.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'smartcdn.gprod.postmedia.digital',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.wetaskiwin.ca',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wetaskiwin.ca',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.pipestoneflyer.ca',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pipestoneflyer.ca',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.wetaskiwintimes.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wetaskiwintimes.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.connectwetaskiwin.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'connectwetaskiwin.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tockify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd3fd4e4oyqldw5.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      // Common CDN patterns that might be used
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // Add common image hosting services
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
