/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  pageExtensions: ['tsx', 'ts'],
  turbopack: {},
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },

  async rewrites() {
    return [
      { source: '/ai-agent/:id', destination: '/project/:id' },
      { source: '/defi/:id', destination: '/project/:id' },
    ]
  },
}

module.exports = nextConfig
