import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // We omit devDependencies on Vercel, so disable lint during prod builds
    ignoreDuringBuilds: true,
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

export default nextConfig;
