import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  eslint: {
    // We omit devDependencies on Vercel, so disable lint during prod builds
    ignoreDuringBuilds: true,
  },
  
  // Performance optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'], // Optimize large packages
  },
  
  webpack: (config) => {
    // Ensure path alias '@/...' resolves in all environments (including Vercel)
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
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
    // Image optimization settings
    formats: ['image/avif', 'image/webp'], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Responsive breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon/thumbnail sizes
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache optimized images for 30 days
  },
};

export default nextConfig;
